(function() {
    let userLikes = new Set();
    let currentUser = null;

    // RULE 1: Standardized URL for sync between ?m=1 and desktop
    const getCleanUrl = () => {
        return window.location.href.split('?')[0].split('#')[0].replace(/\/$/, "");
    };

    // Helper to get user data from Supabase local storage
    const getBadgeFromLocker = () => {
        try {
            const tokenString = localStorage.getItem('sb-yfcqtkrayecpkkuzivvf-auth-token');
            if (!tokenString) return null;
            const token = JSON.parse(tokenString);
            return token?.user || null;
        } catch (e) { return null; }
    }

    const createCommentHtml = (comment, isReply = false) => {
        const isLiked = userLikes.has(String(comment.id));
        const voteCount = comment.votes_count || 0;
        const isRedHeart = isLiked || voteCount > 0;
        const isAdmin = currentUser?.email === 'bestdayswithdad@gmail.com'; 
        const isGuest = !comment.by_email || comment.by_email === 'guest@example.com';

        return `
            <div class="comment-content-wrapper">
                <div class="comment-header-row">
                    <div class="comment-emoji">👤</div>
                    <span class="comment-author-name">${comment.by_nickname}</span>
                    ${!isGuest ? '<span class="verified-reader-badge">Verified Reader</span>' : ''}
                    ${comment.by_email === 'bestdayswithdad@gmail.com' ? 
                        '<span class="verified-reader-badge" style="background:#f59e0b !important;">Host</span>' : ''}
                </div>
                <div class="comment-text-row">
                    <p>${comment.content}</p>
                </div>
                <div class="comment-actions">
                    <button class="executive-btn" onclick="window.setReply('${comment.id}', '${comment.by_nickname}')">Reply</button>
                    <button class="executive-btn ${isRedHeart ? 'is-active' : ''}" onclick="window.handleLikeAction('${comment.id}', ${isLiked})" style="${isRedHeart ? 'color: #ef4444;' : ''}">
                        ${isRedHeart ? '❤️ HELPFUL' : '🤍 MARK AS HELPFUL'} ${voteCount > 0 ? `(${voteCount})` : ''}
                    </button>
                    ${isAdmin ? `<button class="executive-btn" style="color:#ef4444;" onclick="window.adminDelete('${comment.id}')">🗑️ DELETE</button>` : ''}
                </div>
            </div>`;
    };

    const renderTree = (allComments, parentId, depth = 1) => {
        const children = allComments.filter(c => String(c.parentId) === String(parentId) || String(c.parent_id) === String(parentId));
        if (children.length === 0) return '';
        const isHidden = depth > 4;
        const wrapperId = `nest-${parentId}`;

        let branchHtml = children.map(child => `
            <div class="reply-item-container">
                ${createCommentHtml(child, true)}
                ${renderTree(allComments, child.id, depth + 1)}
            </div>
        `).join('');

        if (isHidden) {
            return `<button class="view-more-replies" id="btn-${wrapperId}" onclick="window.toggleNest('${wrapperId}')">+ View ${children.length} replies</button>
                    <div class="reply-thread-internal" id="${wrapperId}" style="display:none;">${branchHtml}</div>`;
        }
        return `<div class="reply-thread-internal">${branchHtml}</div>`;
    };

    const render = async () => {
        // RULE 2: Safety Check - Only run if the anchor exists
        const container = document.getElementById('custom-comment-section');
        if (!container) return;

        currentUser = getBadgeFromLocker();
        const pageId = encodeURIComponent(getCleanUrl());
        
        try {
            // Simple retry logic for Vercel stability
            let res = await fetch(`https://cusdis-jet-one.vercel.app/api/public-comments?pageId=${pageId}&projectId=cbcd61ec-f2ef-425c-a952-30034c2de4e1`);
            
            if (!res.ok) {
                await new Promise(r => setTimeout(r, 2000));
                res = await fetch(`https://cusdis-jet-one.vercel.app/api/public-comments?pageId=${pageId}&projectId=cbcd61ec-f2ef-425c-a952-30034c2de4e1`);
            }

            const comments = await res.json();

            if (currentUser?.id && window.supabaseClient) {
                const { data } = await window.supabaseClient.from('comment_likes').select('comment_id').eq('id', currentUser.id);
                if (data) userLikes = new Set(data.map(l => String(l.comment_id)));
            }

            const rootComments = comments.filter(c => !c.parentId && !c.parent_id);
            
            let html = `
                <div>
                    <div class="comment-disclaimer" style="margin-top: -35px !important;">
                        By posting, you agree to our <a href="/p/comment-policy.html">Comment Policy</a>.<br>
                        Be kind, be helpful, and keep it family-friendly!
                    </div>
                    <div id="comment-form" style="margin-bottom: 30px; text-align: center;">
                        <div id="reply-indicator" style="display:none; background:#e0f2fe; color:#0369a1; padding:10px; border-radius:6px; font-size:11px; font-weight:700; margin-bottom:10px; border:1px solid #bae6fd; text-align:left; cursor:pointer;" onclick="window.cancelReply()">Replying to someone (Click to cancel X)</div>
                        <input type="text" id="nickname" placeholder="Your Nickname" value="${currentUser ? (currentUser.user_metadata?.full_name || 'Verified Reader') : ''}" />
                        <textarea id="comment-body" placeholder="Share your experience..."></textarea>
                        <input type="hidden" id="parent-id" value="" />
                        <button class="submit-review-btn" onclick="window.submitReview()">Post Review</button>
                        <div id="submit-msg"></div>
                    </div>
                    <div id="comment-list">
                        ${rootComments.length > 0 ? rootComments.map(c => `
                            <div class="comment-card">
                                ${createCommentHtml(c, false)}
                                ${renderTree(comments, c.id, 1)}
                            </div>
                        `).join('') : '<p style="text-align:center; color:#667085; font-size:14px;">No reviews yet. Be the first to share your experience!</p>'}
                    </div>
                </div>`;
            container.innerHTML = html;
            container.classList.add('loaded');

        } catch (error) {
            console.error("Comment Engine Error:", error);
            container.innerHTML = `<p style="text-align:center; padding:20px;">Comments are currently syncing. Please check back in a moment.</p>`;
        }
    };

    // Global UI Actions
    window.toggleNest = (id) => { 
        const el = document.getElementById(id);
        const btn = document.getElementById(`btn-${id}`);
        if (el) el.style.display = 'block'; 
        if (btn) btn.style.display = 'none'; 
    };
    
    window.setReply = (id, name) => { 
        document.getElementById('parent-id').value = id; 
        const ind = document.getElementById('reply-indicator'); 
        ind.innerText = `Replying to ${name} (Click to cancel X)`; 
        ind.style.display = 'block'; 
        document.getElementById('comment-body').focus(); 
        window.scrollTo({ top: document.getElementById('comment-form').offsetTop - 150, behavior: 'smooth' }); 
    };
    
    window.cancelReply = () => { 
        document.getElementById('parent-id').value = ''; 
        document.getElementById('reply-indicator').style.display = 'none'; 
    };
    
    window.handleLikeAction = async (commentId, alreadyLiked) => { 
        if (!currentUser) { alert("Please log in to mark reviews as helpful!"); return; } 
        const rpc = alreadyLiked ? 'handle_remove_like' : 'handle_new_like'; 
        const { error } = await window.supabaseClient.rpc(rpc, { c_id: String(commentId), u_id: currentUser.id }); 
        if (!error) render(); 
    };

    window.adminDelete = async (id) => { 
        if (!confirm("Delete this comment?")) return; 
        const res = await fetch('https://cusdis-jet-one.vercel.app/api/admin-delete', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ commentId: id, projectId: 'cbcd61ec-f2ef-425c-a952-30034c2de4e1' }) 
        }); 
        if (res.ok) render(); 
    };

    window.submitReview = async function() { 
        const content = document.getElementById('comment-body').value; 
        const nickname = document.getElementById('nickname').value; 
        const parentId = document.getElementById('parent-id').value; 
        const pageId = getCleanUrl(); 
        if (!content || !nickname) { alert("Please provide a nickname and a comment."); return; } 

        const lockerData = localStorage.getItem('sb-yfcqtkrayecpkkuzivvf-auth-token');
        const token = lockerData ? JSON.parse(lockerData).access_token : null;

        const res = await fetch('https://cusdis-jet-one.vercel.app/api/public-comments', { 
            method: 'POST', 
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            }, 
            body: JSON.stringify({ 
                content, 
                nickname, 
                parentId: parentId || null, 
                pageId: pageId, 
                projectId: 'cbcd61ec-f2ef-425c-a952-30034c2de4e1' 
            }) 
        }); 

        if (res.ok) { 
            const msgEl = document.getElementById('submit-msg');
            msgEl.innerHTML = currentUser ? `✓ Posted! Thanks for being a Verified Reader.` : `Thank you! Sent for moderation.`;
            msgEl.style.display = "block"; 
            document.getElementById('comment-body').value = ""; 
            window.cancelReply(); 
            setTimeout(render, 1000); 
        } 
    };

    if (document.readyState === 'complete') render();
    else window.addEventListener('load', render);
})();
