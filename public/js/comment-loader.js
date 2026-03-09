(function() {
    let userLikes = new Set();
    let currentUser = null;
    const PROJECT_ID = 'cbcd61ec-f2ef-425c-a952-30034c2de4e1'; //

    // Syncs Desktop and Mobile (?m=1) comments
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
        #custom-comment-section { font-family: 'Montserrat', sans-serif !important; padding: 0; background: transparent !important; }
        
        .comment-disclaimer {
            margin-top: -35px !important; /* Fixes Blogger header gap */
            padding: 12px;
            font-size: 12px;
            color: #1e293b;
            text-align: center;
            font-weight: 800;
            text-transform: uppercase;
        }
        
        .comment-disclaimer a { text-decoration: none !important; color: #2563eb !important; font-weight: 900; }
        
        #comment-form input, #comment-form textarea {
            width: 100%;
            padding: 14px;
            background: rgba(241, 245, 249, 0.7) !important;
            border-radius: 8px;
            margin-bottom: 25px;
            font-family: 'Montserrat', sans-serif;
            box-shadow: 0 0 10px 2px rgba(0, 0, 0, 0.1);
            border: none;
        }

        .comment-card {
            background: rgba(241, 245, 249, 0.7) !important;
            border-radius: 12px;
            padding: 22px;
            margin-bottom: 20px;
            box-shadow: 0 0 10px 2px rgba(0, 0, 0, 0.1);
        }

        .comment-header-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        .comment-author-name { font-weight: 800; font-size: 16px; color: #94a3b8; }
        
        .verified-reader-badge { color: #5C9AFF !important; font-size: 12px; font-weight: 800; text-transform: uppercase; }
        .host-badge { background: #f59e0b !important; color: white !important; padding: 3px 10px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
        
        .submit-review-btn {
            background: #334155 !important;
            color: white !important;
            padding: 16px 20px;
            border-radius: 8px;
            font-weight: 800;
            cursor: pointer;
            width: 200px;
        }
        
        .auth-bar {
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 20px; 
            padding: 10px; 
            background: rgba(241, 245, 249, 0.5); 
            border-radius: 8px;
        }

        .reply-item-container { margin-left: 25px; border-left: 2.5px solid #000; padding-left: 18px; margin-top: 15px; }
    </style>`;

    const createCommentHtml = (comment) => {
        const isLiked = userLikes.has(String(comment.id));
        const voteCount = comment.votes_count || 0;
        const isAdmin = currentUser?.email === 'bestdayswithdad@gmail.com'; //
        const isGuest = comment.by_email === 'guest@example.com' || !comment.userId;

        return `
            <div class="comment-content-wrapper">
                <div class="comment-header-row">
                    <div class="comment-emoji">👤</div>
                    <span class="comment-author-name">${comment.by_nickname}</span>
                    ${comment.by_email === 'bestdayswithdad@gmail.com' ? '<span class="host-badge">Host</span>' : ''}
                    ${(!isGuest && comment.by_email !== 'bestdayswithdad@gmail.com') ? '<span class="verified-reader-badge">Verified Reader</span>' : ''}
                </div>
                <div class="comment-text-row"><p style="margin-bottom:15px; line-height:1.6; color:#334155;">${comment.content}</p></div>
                <div class="comment-actions">
                    <button class="executive-btn" onclick="window.setReply('${comment.id}', '${comment.by_nickname}')">Reply</button>
                    <button class="executive-btn ${isLiked ? 'is-active' : ''}" onclick="window.handleLikeAction('${comment.id}', ${isLiked})">
                        ${isLiked ? '❤️ HELPFUL' : '🤍 MARK AS HELPFUL'} ${voteCount > 0 ? `(${voteCount})` : ''}
                    </button>
                    ${isAdmin ? `<button class="executive-btn" style="color:#ef4444;" onclick="window.adminDelete('${comment.id}')">🗑️ DELETE</button>` : ''}
                </div>
            </div>`;
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
            
            let authBarHtml = `
                <div class="auth-bar">
                    ${currentUser ? 
                        `<span style="font-size: 11px; font-weight: 800;">LOGGED IN AS: ${currentUser.email}</span>
                         <button onclick="window.handleSignOut()" style="background: none; border: none; font-size: 10px; font-weight: 900; cursor: pointer; color: #ef4444;">SIGN OUT</button>` : 
                        `<span style="font-size: 11px; font-weight: 800; color: #64748b;">SIGN IN TO POST WITHOUT MODERATION</span>
                         <button onclick="window.handleSignIn()" style="background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 10px; font-weight: 800; cursor: pointer;">SIGN IN WITH GOOGLE</button>`
                    }
                </div>
            `;

            let html = styling + `
                <div>
                    ${authBarHtml}
                    <div class="comment-disclaimer">By posting, you agree to our <a href="/p/comment-policy.html">Comment Policy</a>.</div>
                    <div id="comment-form" style="margin-bottom:35px; text-align: center;">
                        <input type="text" id="nickname" placeholder="Your Nickname" value="${currentUser?.user_metadata?.full_name || ''}" />
                        <textarea id="comment-body" placeholder="Share your experience..." rows="4"></textarea>
                        <input type="hidden" id="parent-id" value="" />
                        <button class="submit-review-btn" onclick="window.submitReview()">Post Comment</button>
                        <div id="submit-msg"></div>
                    </div>
                    <div id="comment-list">
                        ${rootComments.map(c => `<div class="comment-card">${createCommentHtml(c)}</div>`).join('')}
                    </div>
                </div>`;
            container.innerHTML = html;
        } catch (e) { container.innerHTML = `<p>Syncing comments...</p>`; }
    };

    // Auth Handlers
    window.handleSignIn = async () => {
        await window.supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.href }
        });
    };

    window.handleSignOut = async () => {
        await window.supabaseClient.auth.signOut();
        localStorage.removeItem('sb-yfcqtkrayecpkkuzivvf-auth-token');
        window.location.reload();
    };

    window.submitReview = async function() { 
        const content = document.getElementById('comment-body').value.trim(); 
        const nickname = document.getElementById('nickname').value.trim(); 
        if (!content || !nickname) return; 

        const lockerData = localStorage.getItem('sb-yfcqtkrayecpkkuzivvf-auth-token');
        const token = lockerData ? JSON.parse(lockerData).access_token : null;

        const res = await fetch('https://cusdis-jet-one.vercel.app/api/public-comments', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }, 
            body: JSON.stringify({ content, nickname, pageId: getCleanUrl() }) 
        }); 

        if (res.ok) { 
            document.getElementById('submit-msg').innerHTML = `<div style="margin-top:15px; color:#059669; font-weight:800;">✓ SUCCESS!</div>`;
            document.getElementById('comment-body').value = ""; 
            setTimeout(render, 1500); 
        } 
    };

    if (document.readyState === 'complete') render();
    else window.addEventListener('load', render);
})();
