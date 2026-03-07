(function() {
    let userLikes = new Set();
    let currentUser = null;
    const PROJECT_ID = 'cbcd61ec-f2ef-425c-a952-30034c2de4e1';

    const getCleanUrl = () => {
        return window.location.href.split('?')[0].split('#')[0].replace(/\/$/, "");
    };

    const getBadgeFromLocker = () => {
        try {
            const tokenString = localStorage.getItem('sb-yfcqtkrayecpkkuzivvf-auth-token');
            if (!tokenString) return null;
            const token = JSON.parse(tokenString);
            return token?.user || null;
        } catch (e) { return null; }
    }

    const styling = `
    <style>
        #custom-comment-section {
            font-family: 'Montserrat', sans-serif !important;
            margin-top: 50px;
            padding: 25px;
            background: rgba(255, 255, 255, 0.8) !important;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1.5px solid #000000;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            color: #1a202c;
        }
        
        .comment-disclaimer {
            margin-top: -45px !important;
            background: rgba(248, 250, 252, 0.95);
            padding: 12px;
            border-radius: 8px;
            border: 1.5px solid #000000; /* Matching boxed look */
            font-size: 12px;
            color: #64748b;
            text-align: center;
            margin-bottom: 30px;
            font-weight: 700;
            line-height: 1.4;
        }
        .comment-disclaimer a {
            text-decoration: none !important;
            color: #334155;
            transition: color 0.2s;
        }
        .comment-disclaimer a:hover {
            color: #f59e0b;
        }
        
        .comment-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .comment-author-name {
            font-weight: 800;
            font-size: 14px;
        }
        .verified-reader-badge {
            background: #334155 !important; /* Syncing badge with Slate button */
            color: white !important;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 800;
            margin-left: 10px;
            text-transform: uppercase;
        }
        .host-badge {
            background: #f59e0b !important;
            color: white !important;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 800;
            margin-left: 10px;
            text-transform: uppercase;
        }
        .executive-btn {
            background: none;
            border: none;
            font-family: 'Montserrat', sans-serif;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
            color: #64748b;
            margin-right: 15px;
            padding: 0;
            text-transform: uppercase;
        }
        .executive-btn.is-active { color: #ef4444 !important; }
        
        #comment-form input, #comment-form textarea {
            width: 100%;
            padding: 12px;
            border: 1.5px solid #000;
            border-radius: 4px;
            margin-bottom: 10px;
            font-family: 'Montserrat', sans-serif;
            background: rgba(255, 255, 255, 0.9);
        }
        .submit-review-btn {
            background: #334155; /* SLATE TYPE COLOUR */
            color: white;
            border: none;
            padding: 14px 20px;
            border-radius: 4px;
            font-weight: 800;
            text-transform: uppercase;
            cursor: pointer;
            width: 100%;
            letter-spacing: 1px;
            transition: background 0.2s;
        }
        .submit-review-btn:hover {
            background: #1e293b; /* Darker Slate on hover */
        }
        .reply-item-container {
            margin-left: 25px;
            border-left: 2px solid #000;
            padding-left: 15px;
            margin-top: 15px;
        }
    </style>
    `;

    const createCommentHtml = (comment) => {
        const isLiked = userLikes.has(String(comment.id));
        const voteCount = comment.votes_count || 0;
        const isRedHeart = isLiked || voteCount > 0;
        const isHost = comment.by_email === 'bestdayswithdad@gmail.com';
        const isVerified = !isHost && comment.by_email && comment.by_email !== 'guest@example.com';

        return `
            <div class="comment-content-wrapper">
                <div class="comment-header-row" style="margin-bottom:10px; display:flex; align-items:center;">
                    <span class="comment-author-name">${comment.by_nickname}</span>
                    ${isHost ? '<span class="host-badge">Host</span>' : ''}
                    ${isVerified ? '<span class="verified-reader-badge">Verified Reader</span>' : ''}
                </div>
                <div class="comment-text-row">
                    <p style="margin-bottom:15px; line-height:1.5;">${comment.content}</p>
                </div>
                <div class="comment-actions">
                    <button class="executive-btn" onclick="window.setReply('${comment.id}', '${comment.by_nickname}')">Reply</button>
                    <button class="executive-btn ${isRedHeart ? 'is-active' : ''}" onclick="window.handleLikeAction('${comment.id}', ${isLiked})">
                        ${isRedHeart ? '❤️ HELPFUL' : '🤍 MARK AS HELPFUL'} ${voteCount > 0 ? `(${voteCount})` : ''}
                    </button>
                    ${currentUser?.email === 'bestdayswithdad@gmail.com' ? `<button class="executive-btn" style="color:#ef4444;" onclick="window.adminDelete('${comment.id}')">🗑️ DELETE</button>` : ''}
                </div>
            </div>`;
    };

    const renderTree = (allComments, parentId) => {
        const children = allComments.filter(c => String(c.parentId || c.parent_id) === String(parentId));
        if (children.length === 0) return '';
        return children.map(child => `
            <div class="reply-item-container">
                ${createCommentHtml(child)}
                ${renderTree(allComments, child.id)}
            </div>
        `).join('');
    };

    const render = async () => {
        const container = document.getElementById('custom-comment-section');
        if (!container) return;
        currentUser = getBadgeFromLocker();
        const pageId = encodeURIComponent(getCleanUrl());
        
        try {
            const res = await fetch(`https://cusdis-jet-one.vercel.app/api/public-comments?pageId=${pageId}&projectId=${PROJECT_ID}`);
            const comments = await res.json();

            if (currentUser?.id && window.supabaseClient) {
                const { data } = await window.supabaseClient.from('comment_likes').select('comment_id').eq('user_id', currentUser.id);
                if (data) userLikes = new Set(data.map(l => String(l.comment_id)));
            }

            const rootComments = comments.filter(c => !c.parentId && !c.parent_id);
            
            let html = styling + `
                <div>
                    <div class="comment-disclaimer">
                        By posting, you agree to our <a href="/p/comment-policy.html">Comment Policy</a>.<br>
                        Be kind, be helpful, and keep it family-friendly!
                    </div>
                    <div id="comment-form" style="margin-bottom:30px;">
                        <div id="reply-indicator" style="display:none; background:#f0f9ff; padding:10px; font-size:11px; font-weight:700; margin-bottom:10px; border:1.5px solid #000; cursor:pointer;" onclick="window.cancelReply()">Replying to someone (Click to cancel X)</div>
                        <input type="text" id="nickname" placeholder="Nickname" value="${currentUser ? (currentUser.user_metadata?.full_name || 'Verified Reader') : ''}" />
                        <textarea id="comment-body" placeholder="Share your experience..." rows="3"></textarea>
                        <input type="hidden" id="parent-id" value="" />
                        <button class="submit-review-btn" onclick="window.submitReview()">Post Review</button>
                        <div id="submit-msg" style="display:none; margin-top:10px; font-weight:700; color:#059669; text-align:center;"></div>
                    </div>
                    <div id="comment-list">
                        ${rootComments.length > 0 ? rootComments.map(c => `
                            <div class="comment-card">
                                ${createCommentHtml(c)}
                                ${renderTree(comments, c.id)}
                            </div>
                        `).join('') : '<p style="text-align:center; color:#64748b; font-size:13px; padding:20px; background:#fff; border:1.5px solid #000; border-radius:8px;">No reviews yet.</p>'}
                    </div>
                </div>`;
            container.innerHTML = html;
        } catch (e) {
            container.innerHTML = `<p>Error loading comments.</p>`;
        }
    };

    window.setReply = (id, name) => { 
        document.getElementById('parent-id').value = id; 
        document.getElementById('reply-indicator').innerText = `Replying to ${name} (Click to cancel X)`; 
        document.getElementById('reply-indicator').style.display = 'block'; 
        document.getElementById('comment-body').focus(); 
    };
    window.cancelReply = () => { 
        document.getElementById('parent-id').value = ''; 
        document.getElementById('reply-indicator').style.display = 'none'; 
    };
    window.handleLikeAction = async (commentId, alreadyLiked) => { 
        if (!currentUser) { alert("Please log in to like reviews."); return; } 
        const rpc = alreadyLiked ? 'handle_remove_like' : 'handle_new_like'; 
        await window.supabaseClient.rpc(rpc, { c_id: String(commentId), u_id: currentUser.id }); 
        render(); 
    };
    window.adminDelete = async (id) => { 
        if (!confirm("Delete?")) return; 
        await fetch('https://cusdis-jet-one.vercel.app/api/admin-delete', { 
            method: 'POST', headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({ commentId: id, projectId: PROJECT_ID }) 
        }); 
        render(); 
    };
    window.submitReview = async function() { 
        const content = document.getElementById('comment-body').value; 
        const nickname = document.getElementById('nickname').value; 
        const parentId = document.getElementById('parent-id').value; 
        if (!content || !nickname) return; 
        
        const lockerData = localStorage.getItem('sb-yfcqtkrayecpkkuzivvf-auth-token');
        const token = lockerData ? JSON.parse(lockerData).access_token : null;

        const res = await fetch('https://cusdis-jet-one.vercel.app/api/public-comments', { 
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }, 
            body: JSON.stringify({ content, nickname, parentId: parentId || null, pageId: getCleanUrl(), projectId: PROJECT_ID }) 
        }); 
        if (res.ok) { 
            document.getElementById('submit-msg').innerText = "Submitted for moderation!";
            document.getElementById('submit-msg').style.display = "block";
            document.getElementById('comment-body').value = ""; 
            setTimeout(render, 1500); 
        } 
    };

    if (document.readyState === 'complete') render();
    else window.addEventListener('load', render);
})();
