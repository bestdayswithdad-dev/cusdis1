(function() {
    let userLikes = new Set();
    let currentUser = null;

    // Helper to clean URLs for consistent ID mapping
    const getCleanUrl = () => {
        return window.location.href.split('?')[0].split('#')[0];
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

    /**
     * NEW: Fetch Blogger Feed with Throttling & Caching
     * This prevents the 429 "Too Many Requests" error by limiting hits to Google.
     */
    const fetchBloggerFeed = async () => {
        const CACHE_KEY = 'bdb_feed_cache';
        const CACHE_TIME_KEY = 'bdb_feed_timestamp';
        const FIVE_MINUTES = 5 * 60 * 1000;

        const lastFetch = localStorage.getItem(CACHE_TIME_KEY);
        const now = Date.now();

        // Return cached data if available and fresh
        if (lastFetch && (now - lastFetch < FIVE_MINUTES)) {
            const cachedData = localStorage.getItem(CACHE_KEY);
            if (cachedData) return JSON.parse(cachedData);
        }

        try {
            // Fetching the Blogger feed
            const res = await fetch(`https://www.bestdayswithdad.com/feeds/posts/default?alt=json&max-results=12`);
            
            // If Google redirects to a CAPTCHA (CORS error usually triggers here)
            if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`);

            const data = await res.json();
            
            // Save to cache
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            localStorage.setItem(CACHE_TIME_KEY, now.toString());
            
            return data;
        } catch (err) {
            console.warn("Blogger feed unavailable, using stale cache or empty state.", err);
            return JSON.parse(localStorage.getItem(CACHE_KEY)) || null;
        }
    };

    const createCommentHtml = (comment, isReply = false) => {
        const isLiked = userLikes.has(String(comment.id));
        const voteCount = comment.votes_count || 0;
        const isRedHeart = isLiked || voteCount > 0;
        const isAdmin = currentUser?.email === 'bestdayswithdad@gmail.com'; 
        const isGuest = comment.by_email === 'guest@example.com';

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
        const container = document.getElementById('custom-comment-section');
        if (!container) return;
        currentUser = getBadgeFromLocker();
        
        // Parallel fetch for speed: Comments + Blogger Feed (if needed for sidebar/footer)
        const pageId = encodeURIComponent(getCleanUrl());
        
        try {
            const res = await fetch(`https://cusdis-jet-one.vercel.app/api/public-comments?pageId=${pageId}`);
            const comments = await res.json();

            // Handle likes for logged in users
            if (currentUser?.id && window.supabaseClient) {
                const { data } = await window.supabaseClient.from('comment_likes').select('comment_id').eq('id', currentUser.id);
                if (data) userLikes = new Set(data.map(l => String(l.comment_id)));
            }

            const rootComments = comments.filter(c => !c.parentId && !c.parent_id);
            
            let html = `
                <div style="margin-top: 0;">
                    <div class="comment-disclaimer">
                        By posting, you agree to our <a href="/p/comment-policy.html">Comment Policy</a>.<br>
                        Be kind, be helpful, and keep it family-friendly!
                    </div>
                    <div id="comment-form" style="margin-bottom: 30px; text-align: center;">
                        <div id="reply-indicator" style="display:none; background:#e0f2fe; color:#0369a1; padding:10px; border-radius:6px; font-size:11px; font-weight:700; margin-bottom:10px; border:1px solid #bae6fd; text-align:left; cursor:pointer;" onclick="window.cancelReply()">Replying to someone (Click to cancel X)</div>
                        <input type="text" id="nickname" placeholder="Your Nickname" value="${currentUser ? 'Adam' : ''}" />
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

            // Trigger the feed fetch silently in the background to warm cache
            fetchBloggerFeed();

        } catch (error) {
            console.error("Failed to render comments:", error);
            container.innerHTML = `<p style="color:red;">Failed to load comments. Please refresh.</p>`;
        }
    };

    // UI Window Globals
    window.toggleNest = (id) => { 
        document.getElementById(id).style.display = 'block'; 
        document.getElementById(`btn-${id}`).style.display = 'none'; 
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
            body: JSON.stringify({ commentId: id }) 
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
            body: JSON.stringify({ content, nickname, parentId: parentId || null, pageId: pageId }) 
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

    // Initialize
    if (document.readyState === 'complete') render();
    else window.addEventListener('load', render);
})();
