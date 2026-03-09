(function() {
    let userLikes = new Set();
    let currentUser = null;
    const PROJECT_ID = 'cbcd61ec-f2ef-425c-a952-30034c2de4e1';

    const getCleanUrl = () => window.location.href.split('?')[0].split('#')[0].replace(/\/$/, "");

    const getBadgeFromLocker = () => {
        try {
            const tokenString = localStorage.getItem('sb-yfcqtkrayecpkkuzivvf-auth-token');
            if (!tokenString) return null;
            return JSON.parse(tokenString);
        } catch (e) { return null; }
    };

    const styling = `
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800;900&display=swap');
        
        #custom-comment-section { 
            font-family: 'Montserrat', sans-serif !important; 
            padding: 0; 
            background: transparent !important; 
            max-width: 800px;
            margin: 0 auto;
        }
        
        /* Floating Input Section */
        #comment-form {
            background: #fff !important;
            padding: 8px 16px;
            border-radius: 28px;
            margin-bottom: 45px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            border: 1px solid #e2e8f0;
            position: relative;
        }

        .auth-trigger-area {
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 40px;
        }

        .user-avatar-btn {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border: none;
            transition: background 0.2s;
        }
        
        .user-avatar-btn:hover { background: #e2e8f0; }

        #comment-body {
            flex: 1;
            border: none !important;
            background: transparent !important;
            padding: 12px 0;
            font-family: 'Montserrat', sans-serif;
            font-size: 15px;
            color: #1e293b;
            resize: none;
            outline: none !important;
            box-shadow: none !important;
            height: 44px;
            display: flex;
            align-items: center;
        }

        .send-btn {
            background: #1e293b !important;
            color: white !important;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border: none;
            transition: transform 0.2s;
        }

        .send-btn:hover { transform: scale(1.05); background: #000 !important; }

        /* Nickname floating above */
        .nickname-container {
            position: absolute;
            top: -30px;
            left: 20px;
        }
        #nickname {
            border: none;
            background: transparent;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            color: #64748b;
            outline: none;
        }

        /* Disclaimer Fix */
        .comment-disclaimer {
            font-size: 10px;
            color: #94a3b8;
            font-weight: 700;
            text-transform: uppercase;
            text-align: center;
            margin-top: -35px !important; /* Your requested fix */
            margin-bottom: 40px;
        }
        .comment-disclaimer a { color: #64748b !important; text-decoration: underline; }

        /* List Items */
        .comment-card { background: #fff !important; border-radius: 16px; padding: 20px; margin-bottom: 16px; border: 1px solid #f1f5f9; }
        .executive-btn { background: none; border: none; font-family: 'Montserrat'; font-size: 11px; font-weight: 800; cursor: pointer; color: #94a3b8; text-transform: uppercase; margin-right: 15px; }
        .casual-adventurer-badge { color: #3b82f6 !important; font-size: 10px; font-weight: 800; text-transform: uppercase; margin-left: 8px; }
        .park-scout-badge { color: #10b981 !important; font-size: 10px; font-weight: 800; text-transform: uppercase; margin-left: 8px; }
        .mod-badge-text { color: #f59e0b !important; font-size: 10px; font-weight: 800; text-transform: uppercase; margin-left: 8px; }
        .reply-item-container { margin-left: 20px; border-left: 2px solid #f1f5f9; padding-left: 15px; margin-top: 15px; }
    </style>`;

    const createCommentHtml = (comment) => {
        const isLiked = userLikes.has(String(comment.id));
        const voteCount = comment.votes_count || 0;
        const isGuest = !comment.userId || comment.by_email === 'guest@example.com';
        const isHost = comment.by_email === 'bestdayswithdad@gmail.com';

        let badgeHtml = isHost ? '<span class="mod-badge-text">HOST</span>' : 
                    (isGuest ? '<span class="casual-adventurer-badge">Casual</span>' : 
                    '<span class="park-scout-badge">Verified Scout</span>');

        return `
            <div class="comment-content-wrapper">
                <div style="display:flex; align-items:center; margin-bottom:8px;">
                    <span style="font-weight:800; font-size:14px; color:#1e293b;">${comment.by_nickname}</span>
                    ${badgeHtml}
                </div>
                <p style="line-height:1.5; color:#475569; font-size:15px; margin-bottom:12px;">${comment.content}</p>
                <div class="comment-actions">
                    <button class="executive-btn" onclick="window.setReply('${comment.id}', '${comment.by_nickname}')">Reply</button>
                    <button class="executive-btn" onclick="window.handleLikeAction('${comment.id}', ${isLiked})">
                        ${isLiked ? '❤️' : '🤍'} ${voteCount > 0 ? voteCount : ''}
                    </button>
                </div>
            </div>`;
    };

    const renderTree = (allComments, parentId) => {
        const children = allComments.filter(c => String(c.parentId) === String(parentId));
        return children.map(child => `<div class="reply-item-container">${createCommentHtml(child)}${renderTree(allComments, child.id)}</div>`).join('');
    };

    const render = async () => {
        const container = document.getElementById('custom-comment-section');
        if (!container) return;
        currentUser = getBadgeFromLocker();
        const pageId = encodeURIComponent(getCleanUrl());
        
        try {
            const res = await fetch(`https://cusdis-jet-one.vercel.app/api/public-comments?pageId=${pageId}`);
            const data = await res.json();
            const comments = Array.isArray(data) ? data : (data.comments || []);
            const rootComments = comments.filter(c => !c.parentId);
            
            const authIcon = currentUser?.user ? 
                `<button onclick="window.handleSignOut()" class="user-avatar-btn" title="Sign Out">🔓</button>` : 
                `<button onclick="window.handleSignIn()" class="user-avatar-btn" title="Sign in with Google">👤</button>`;

            container.innerHTML = styling + `
                <div id="comment-list" style="margin-top: 20px;">
                    ${rootComments.map(c => `
                        <div class="comment-card">
                            ${createCommentHtml(c)}
                            ${renderTree(comments, c.id)}
                        </div>
                    `).join('')}
                </div>

                <div class="nickname-container">
                    <input type="text" id="nickname" placeholder="Nickname..." value="${currentUser?.user?.user_metadata?.full_name || 'Guest Explorer'}" />
                </div>
                <div id="comment-form">
                    <div class="auth-trigger-area">${authIcon}</div>
                    <textarea id="comment-body" placeholder="Message Best Days With Dad..." rows="1"></textarea>
                    <input type="hidden" id="parent-id" value="" />
                    <button class="send-btn" onclick="window.submitReview()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
                <div class="comment-disclaimer">
                    By posting, you agree to our <a href="/p/comment-policy.html">Comment Policy</a>
                </div>
                <div id="submit-msg" style="text-align:center;"></div>`;
        } catch (e) { container.innerHTML = `<p>Loading interaction...</p>`; }
    };

    window.setReply = (id, name) => { 
        document.getElementById('parent-id').value = id; 
        document.getElementById('comment-body').focus(); 
        document.getElementById('comment-body').placeholder = `Reply to ${name}...`;
    };

    window.handleLikeAction = async (id, alreadyLiked) => {
        if (alreadyLiked) return;
        try {
            const res = await fetch(`https://cusdis-jet-one.vercel.app/api/public-comments?id=${id}&action=like`, { method: 'PATCH' });
            if (res.ok) { userLikes.add(String(id)); render(); }
        } catch (e) { console.error("Like failed", e); }
    };

    window.submitReview = async function() { 
        const content = document.getElementById('comment-body').value.trim(); 
        const nickname = document.getElementById('nickname').value.trim(); 
        const parentId = document.getElementById('parent-id').value;
        if (!content || !nickname) return; 

        const freshLocker = getBadgeFromLocker();
        const token = freshLocker ? freshLocker.access_token : null;
        const email = freshLocker?.user?.email || 'guest@example.com';

        const res = await fetch('https://cusdis-jet-one.vercel.app/api/public-comments', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }, 
            body: JSON.stringify({ 
                content, nickname, pageId: getCleanUrl(),
                pageTitle: document.title.split(' : ')[0],
                parentId: parentId || null,
                by_email: email
            }) 
        }); 

        if (res.ok) { 
            document.getElementById('comment-body').value = ""; 
            setTimeout(render, 500); 
        } 
    };

    window.handleSignIn = async () => {
        localStorage.removeItem('sb-yfcqtkrayecpkkuzivvf-auth-token');
        await window.supabaseClient.auth.signInWithOAuth({
            provider: 'google', options: { redirectTo: window.location.href, queryParams: { prompt: 'select_account' } }
        });
    };

    window.handleSignOut = async () => {
        if (window.supabaseClient) await window.supabaseClient.auth.signOut();
        localStorage.removeItem('sb-yfcqtkrayecpkkuzivvf-auth-token');
        setTimeout(() => { window.location.reload(); }, 100);
    };

    if (document.readyState === 'complete') render();
    else window.addEventListener('load', render);
})();
