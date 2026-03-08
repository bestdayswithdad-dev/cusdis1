(function() {
    let userLikes = new Set();
    let currentUser = null;
    const PROJECT_ID = 'cbcd61ec-f2ef-425c-a952-30034c2de4e1';

    const getCleanUrl = () => window.location.href.split('?')[0].split('#')[0].replace(/\/$/, "");

    const getBadgeFromLocker = () => {
        try {
            const tokenString = localStorage.getItem('sb-yfcqtkrayecpkkuzivvf-auth-token');
            if (!tokenString) return null;
            const token = JSON.parse(tokenString);
            return token?.user || null;
        } catch (e) { return null; }
    };
     const styling = `
    <style>
        #custom-comment-section {
            font-family: 'Montserrat', sans-serif !important;
            padding: 0;
            background: transparent !important;
            border: none !important;
        }
        
        .comment-disclaimer {
            margin-top: -60px !important;
            /* Light Slate Tint to stand out on white */
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            padding: 12px;
            font-size: 12px;
            color: #1e293b;
            text-align: center;
            margin-bottom: 30px;
            font-weight: 800;
            text-transform: uppercase;
        }
        
        .comment-disclaimer a { 
            text-decoration: none !important; 
            color: #2563eb !important; 
            font-weight: 900;
        }
        .comment-disclaimer a:hover { color: #f59e0b !important; }

        /* TINTED GLASS INPUTS */
        #comment-form input, #comment-form textarea {
            width: 100%;
            padding: 14px;
            /* Using a darker Blue-Grey tint for visibility */
           background: rgba(241, 245, 249, 0.7) !important;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-radius: 8px;
            margin-bottom: 15px;
            font-family: 'Montserrat', sans-serif;
            color: #0f172a;
             box-shadow: 0 0 10px 2px rgba(0, 0, 0, 0.1);
             border:none;
        }

        /* TINTED GLASS COMMENT CARDS */
        .comment-card {
            /* Warm Slate tint so it doesn't blend into the white background */
            background: rgba(241, 245, 249, 0.7) !important;
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            border-radius: 12px;
            padding: 22px;
            margin-bottom: 20px;
            /* Stronger shadow to create the "Lifted" separation on white */
            box-shadow: 0 0 10px 2px rgba(0, 0, 0, 0.1);
        }

        .comment-header-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        .comment-emoji { font-size: 18px; }
        .comment-author-name { font-weight: 800; font-size: 16px; color: #94a3b8; }
        
        .verified-reader-badge { background: none; color: #5C9AFF !important; padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: 800; text-transform: uppercase; }
        .host-badge { background: #f59e0b !important; color: white !important; padding: 3px 10px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
        
        .submit-review-btn {
            background: #334155 !important;
            color: white !important;
            border: none;
            padding: 16px 20px;
            border-radius: 8px;
            font-weight: 800;
            text-transform: uppercase;
            cursor: pointer;
            width: 200px;
            letter-spacing: 1.5px;
        }
         .submit-review-btn:hover:not(.is-active) { 
         background: #1e293b !important;
    transform: translateY(-1px) !important; /* Subtle lift */
    }
        
        /* Updated Base Class with Transition */
.executive-btn { 
    background: none; 
    border: none; 
    font-family: 'Montserrat', sans-serif; 
    font-size: 11px; 
    font-weight: 800; 
    cursor: pointer; 
    color: #475569; 
    margin-right: 15px; 
    padding: 0; 
    text-transform: uppercase;
    transition: all 0.2s ease; /* Makes the hover/active state smooth */
    position: relative; /* For the optional underline effect */
}

/* Hover Effect */
.executive-btn:hover:not(.is-active) { 
    color: #1e293b !important; /* Darker Slate */
    transform: translateY(-1px) !important; /* Subtle lift */
}

/* Active State (Your existing red) */
.executive-btn.is-active { 
    color: #ef4444 !important; 
    transform: translateY(0); /* Resets the lift when active */
}

        .reply-item-container { margin-left: 25px; border-left: 2.5px solid #000000; padding-left: 18px; margin-top: 15px; }
 
    </style>

    const createCommentHtml = (comment) => {
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
                    ${comment.by_email === 'bestdayswithdad@gmail.com' ? '<span class="host-badge">Host</span>' : ''}
                    ${(!isGuest && comment.by_email !== 'bestdayswithdad@gmail.com') ? '<span class="verified-reader-badge">Casual Adventurer</span>' : ''}
                </div>
                <div class="comment-text-row"><p style="margin-bottom:15px; line-height:1.6; color:#334155;">${comment.content}</p></div>
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
        const children = allComments.filter(c => String(c.parentId || c.parent_id) === String(parentId));
        if (children.length === 0) return '';
        return children.map(child => `<div class="reply-item-container">${createCommentHtml(child)}${renderTree(allComments, child.id, depth + 1)}</div>`).join('');
    };

    const render = async () => {
        const container = document.getElementById('custom-comment-section');
        if (!container) return;
        currentUser = getBadgeFromLocker();
        const pageId = encodeURIComponent(getCleanUrl());
        
        try {
            const res = await fetch(`https://cusdis-jet-one.vercel.app/api/public-comments?pageId=${pageId}`);
            const comments = await res.json();
            const rootComments = comments.filter(c => !c.parentId && !c.parent_id);

            if (currentUser?.id && window.supabaseClient) {
                const { data } = await window.supabaseClient.from('comment_likes').select('comment_id').eq('user_id', currentUser.id);
                if (data) userLikes = new Set(data.map(l => String(l.comment_id)));
            }
            
            let html = styling + `
                <div>
                    <div class="comment-disclaimer">By posting, you agree to our <a href="/p/comment-policy.html">Comment Policy</a>.</div>
                    <div id="comment-form" style="margin-bottom:35px; text-align: center;">
                        <div id="reply-indicator" style="display:none; background:#f0f9ff; padding:12px; font-size:11px; font-weight:700; margin-bottom:12px; border:1.5px solid #000; cursor:pointer;" onclick="window.cancelReply()">Replying (Click to cancel X)</div>
                        <input type="text" id="nickname" placeholder="Your Nickname" value="${currentUser?.user_metadata?.full_name || (currentUser ? 'Adam' : '')}" />
                        <textarea id="comment-body" placeholder="Share your experience..." rows="4"></textarea>
                        <input type="hidden" id="parent-id" value="" />
                        <button class="submit-review-btn" onclick="window.submitReview()">Post Comment</button>
                        <div id="submit-msg"></div>
                    </div>
                    <div id="comment-list">${rootComments.map(c => `<div class="comment-card">${createCommentHtml(c)}${renderTree(comments, c.id, 1)}</div>`).join('')}</div>
                </div>`;
            container.innerHTML = html;
        } catch (e) { container.innerHTML = `<p>Syncing comments...</p>`; }
    };

    window.setReply = (id, name) => { document.getElementById('parent-id').value = id; const ind = document.getElementById('reply-indicator'); ind.innerText = `Replying to ${name} (Click to cancel X)`; ind.style.display = 'block'; document.getElementById('comment-body').focus(); };
    window.cancelReply = () => { document.getElementById('parent-id').value = ''; document.getElementById('reply-indicator').style.display = 'none'; };
    window.adminDelete = async (id) => { if (confirm("Delete?")) { await fetch('https://cusdis-jet-one.vercel.app/api/admin-bridge?id=' + id, { method: 'DELETE' }); render(); } };

    window.submitReview = async function() { 
        const content = document.getElementById('comment-body').value.trim(); 
        const nickname = document.getElementById('nickname').value.trim(); 
        const parentId = document.getElementById('parent-id').value; 
        if (!content || !nickname) return; 

        const lockerData = localStorage.getItem('sb-yfcqtkrayecpkkuzivvf-auth-token');
        const token = lockerData ? JSON.parse(lockerData).access_token : null;

        const res = await fetch('https://cusdis-jet-one.vercel.app/api/public-comments', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }, 
            body: JSON.stringify({ content, nickname, parentId: parentId || null, pageId: getCleanUrl() }) 
        }); 

        if (res.ok) { 
            document.getElementById('submit-msg').innerHTML = `<div style="margin-top:15px; color:#059669; font-weight:800;">✓ Submitted for moderation!</div>`;
            document.getElementById('comment-body').value = ""; 
            window.cancelReply(); 
            setTimeout(render, 1500); 
        } 
    };

    if (document.readyState === 'complete') render();
    else window.addEventListener('load', render);
})();
