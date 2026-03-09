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
            padding: 20px 0; 
            background: transparent !important; 
            max-width: 800px;
            margin: 0 auto;
        }
        
        .input-wrapper {
            position: relative;
            margin-top: 40px;
            margin-bottom: 10px;
        }

        .nickname-label-bar {
            padding-left: 20px;
            margin-bottom: 8px;
            display: flex;
            gap: 10px;
            align-items: center;
        }

        #nickname {
            border: none;
            background: transparent;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            color: #94a3b8;
            outline: none;
            width: auto;
            padding: 0;
        }

        #comment-form {
            background: #fff !important;
            padding: 10px 16px;
            border-radius: 24px;
            display: flex;
            align-items: flex-end; 
            gap: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            border: 1px solid #e2e8f0;
            transition: border-radius 0.2s;
        }

        .auth-trigger-area {
            display: flex;
            flex-direction: column;
            align-items: center;
            min-width: 44px;
            padding-bottom: 2px;
        }

        .user-avatar-btn, .comment-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            flex-shrink: 0;
        }

        .user-avatar-btn { cursor: pointer; border: 2px solid transparent; transition: border-color 0.2s; padding: 0; }
        .user-avatar-btn:hover { border-color: #e2e8f0; }

        .user-avatar-img { width: 100%; height: 100%; object-fit: cover; }

        .privacy-link-tiny {
            font-size: 8px;
            font-weight: 700;
            color: #cbd5e1;
            text-decoration: none;
            text-transform: uppercase;
            margin-top: 4px;
        }

        #comment-body {
            flex: 1;
            border: none !important;
            background: transparent !important;
            padding: 8px 0;
            font-family: 'Montserrat', sans-serif;
            font-size: 15px;
            color: #1e293b;
            resize: none;
            outline: none !important;
            box-shadow: none !important;
            min-height: 24px;
            max-height: 200px; 
            line-height: 1.5;
            overflow-y: hidden;
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
            transition: all 0.2s;
            padding: 0;
            margin-bottom: 2px;
        }
        .send-btn:hover { background: #000 !important; transform: scale(1.05); }

        .comment-disclaimer {
            font-size: 10px;
            color: #94a3b8;
            font-weight: 700;
            text-transform: uppercase;
            text-align: center;
            margin-top: -35px !important;
            padding-bottom: 20px;
        }
        .comment-disclaimer a { color: #64748b !important; text-decoration: underline; }

        /* Comment List Layout */
        .comment-card { 
            background: #fff !important; 
            border-radius: 16px; 
            padding: 20px; 
            margin-bottom: 16px; 
            border: 1px solid #f1f5f9; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.02);
            display: flex;
            gap: 14px;
        }
        .comment-main { flex: 1; }
        .executive-btn { background: none; border: none; font-family: 'Montserrat'; font-size: 11px; font-weight: 800; cursor: pointer; color: #94a3b8; text-transform: uppercase; margin-right: 15px; padding: 0; }
        .casual-adventurer-badge { color: #3b82f6 !important; font-size: 10px; font-weight: 800; text-transform: uppercase; margin-left: 8px; }
        .park-scout-badge { color: #10b981 !important; font-size: 10px; font-weight: 800; text-transform: uppercase; margin-left: 8px; }
        .mod-badge-text { color: #f59e0b !important; font-size: 10px; font-weight: 800; text-transform: uppercase; margin-left: 8px; }
        .reply-item-container { margin-left: 10px; border-left: 2px solid #f1f5f9; padding-left: 15px; margin-top: 15px; }
    </style>`;

    const createCommentHtml = (comment) => {
        const isLiked = userLikes.has(String(comment.id));
        const voteCount = comment.votes_count || 0;
        const isGuest = !comment.userId || comment.by_email === 'guest@example.com';
        const isHost = comment.by_email === 'bestdayswithdad@gmail.com';

        let badgeHtml = isHost ? '<span class="mod-badge-text">MOD</span>' : 
                    (isGuest ? '<span class="casual-adventurer-badge">Casual Adventurer</span>' : 
                    '<span class="park-scout-badge">Park Scout</span>');

        // Check for avatar in comment metadata (assuming it's passed or mapped)
        // If your backend doesn't store the avatar URL yet, we can fallback to the guest icon
        const avatarUrl = comment.metadata?.avatar_url || null;
        const avatarImg = avatarUrl ? `<img src="${avatarUrl}" class="user-avatar-img">` : `<span style="font-size:18px;">👤</span>`;

        return `
            <div class="comment-card">
                <div class="comment-avatar">${avatarImg}</div>
                <div class="comment-main">
                    <div style="display:flex; align-items:center; margin-bottom:6px;">
                        <span style="font-weight:800; font-size:14px; color:#1e293b;">${comment.by_nickname}</span>
                        ${badgeHtml}
                    </div>
                    <p style="line-height:1.5; color:#475569; font-size:15px; margin-bottom:10px; margin-top:0;">${comment.content}</p>
                    <div class="comment-actions">
                        <button class="executive-btn" onclick="window.setReply('${comment.id}', '${comment.by_nickname}')">Reply</button>
                        <button class="executive-btn" onclick="window.handleLikeAction('${comment.id}', ${isLiked})">
                            ${isLiked ? '❤️' : '🤍'} ${voteCount > 0 ? voteCount : ''}
                        </button>
                    </div>
                </div>
            </div>`;
    };

    const renderTree = (allComments, parentId) => {
        const children = allComments.filter(c => String(c.parentId) === String(parentId));
        return children.map(child => `<div class="reply-item-container">${createCommentHtml(child)}${renderTree(allComments, child.id)}</div>`).join('');
    };

    const autoExpand = (el) => {
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
        const form = document.getElementById('comment-form');
        if (el.scrollHeight > 60) {
            form.style.borderRadius = "16px";
        } else {
            form.style.borderRadius = "24px";
        }
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
            
            const avatarUrl = currentUser?.user?.user_metadata?.avatar_url;
            const authIconHtml = avatarUrl ? 
                `<img src="${avatarUrl}" class="user-avatar-img" alt="User Profile">` : 
                (currentUser?.user ? '🔓' : '👤');

            const authButton = currentUser?.user ? 
                `<button onclick="window.handleSignOut()" class="user-avatar-btn" title="Log Out">${authIconHtml}</button>` : 
                `<button onclick="window.handleSignIn()" class="user-avatar-btn" title="Sign in with Google">${authIconHtml}</button>`;

            container.innerHTML = styling + `
                <div id="comment-list">
                    ${rootComments.map(c => `
                        <div style="margin-bottom:16px;">
                            ${createCommentHtml(c)}
                            ${renderTree(comments, c.id)}
                        </div>
                    `).join('')}
                </div>

                <div class="input-wrapper">
                    <div class="nickname-label-bar">
                        <span style="font-size: 10px; font-weight: 800; color: #cbd5e1;">POSTING AS:</span>
                        <input type="text" id="nickname" value="${currentUser?.user?.user_metadata?.full_name || 'Guest Explorer'}" />
                    </div>
                    
                    <div id="comment-form">
                        <div class="auth-trigger-area">
                            ${authButton}
                            <a href="https://www.bestdayswithdad.com/p/privacy-agreement.html" class="privacy-link-tiny">Privacy</a>
                        </div>
                        <textarea id="comment-body" placeholder="Message Best Days With Dad..." rows="1" oninput="window.autoExpand(this)"></textarea>
                        <input type="hidden" id="parent-id" value="" />
                        <button class="send-btn" onclick="window.submitReview()">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        </button>
                    </div>
                </div>

                <div class="comment-disclaimer">
                    By posting, you agree to our <a href="/p/comment-policy.html">Comment Policy</a>
                </div>
                <div id="submit-msg"></div>`;
            
            window.autoExpand = autoExpand;
        } catch (e) { container.innerHTML = `<p>Syncing discussion...</p>`; }
    };

    window.setReply = (id, name) => { 
        document.getElementById('parent-id').value = id; 
        const body = document.getElementById('comment-body');
        body.focus(); 
        body.placeholder = `Reply to ${name}...`;
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
        const avatar_url = freshLocker?.user?.user_metadata?.avatar_url || null;

        const res = await fetch('https://cusdis-jet-one.vercel.app/api/public-comments', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }, 
            body: JSON.stringify({ 
                content, nickname, pageId: getCleanUrl(),
                pageTitle: document.title.split(' : ')[0],
                parentId: parentId || null,
                by_email: email,
                metadata: { avatar_url } // Sending the avatar URL to be stored
            }) 
        }); 

        if (res.ok) { 
            const body = document.getElementById('comment-body');
            body.value = ""; 
            body.style.height = 'auto'; 
            document.getElementById('parent-id').value = "";
            body.placeholder = "Message Best Days With Dad...";
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
