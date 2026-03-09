(function() {
    let userLikes = new Set();
    let currentUser = null;
    const PROJECT_ID = 'cbcd61ec-f2ef-425c-a952-30034c2de4e1';

    // 1. URL SYNC: Merges Mobile (?m=1) and Desktop comments
    const getCleanUrl = () => window.location.href.split('?')[0].split('#')[0].replace(/\/$/, "");

    // 2. AUTH RETRIEVAL
    const getBadgeFromLocker = () => {
        try {
            const tokenString = localStorage.getItem('sb-yfcqtkrayecpkkuzivvf-auth-token');
            if (!tokenString) return null;
            return JSON.parse(tokenString);
        } catch (e) { return null; }
    };

    // 3. UI STYLING: Matching Bubble Style + Professional Form Structure
    const styling = `
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800;900&display=swap');
        
        #custom-comment-section { font-family: 'Montserrat', sans-serif !important; padding: 0; background: transparent !important; }
        
        /* FORM CONTAINER: Matches .comment-card shadow and opacity */
        #comment-form-shell {
            background: rgba(241, 245, 249, 0.7) !important;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 45px;
            text-align: center;
            box-shadow: 0 0 10px 2px rgba(0, 0, 0, 0.1);
        }

        .input-label { display: block; text-align: left; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 8px; margin-left: 5px; }

        #comment-form input, #comment-form textarea {
            width: 100%;
            padding: 14px;
            background: #fff !important;
            border-radius: 8px;
            margin-bottom: 20px;
            font-family: 'Montserrat', sans-serif;
            border: 1px solid rgba(0,0,0,0.05);
            color: #1e293b;
            box-shadow: 0 0 10px 2px rgba(0, 0, 0, 0.05);
        }

        /* COMPACT AUTH BAR */
        .auth-bar {
            display: flex; 
            flex-direction: column;
            align-items: center; 
            gap: 12px;
            margin-bottom: 25px; 
            padding: 20px; 
            background: #fff !important;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.05);
            text-align: center;
            width: fit-content;
            margin-left: auto;
            margin-right: auto;
        }

        .auth-bar.is-logged-in {
            background: rgba(5, 150, 105, 0.05) !important;
            border: 1px solid rgba(5, 150, 105, 0.2);
        }

        .auth-policy-note { font-size: 9px; font-weight: 700; color: #64748b; margin-top: 8px; text-transform: uppercase; display: block; }
        .auth-policy-note a { color: #2563eb !important; text-decoration: none !important; font-weight: 800; }

        .submit-review-btn {
            background: #334155 !important;
            color: white !important;
            padding: 16px 30px;
            border-radius: 8px;
            font-weight: 800;
            cursor: pointer;
            width: 240px;
            text-transform: uppercase;
            transition: all 0.2s ease;
            border: none;
            display: block;
            margin: 0 auto 5px auto;
        }
        .submit-review-btn:hover {
            background: #475569 !important; 
            transform: translateY(-2px);
        }

        .comment-disclaimer {
            font-size: 10px;
            color: #64748b;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 10px;
        }
        .comment-disclaimer a { color: #2563eb !important; text-decoration: none !important; font-weight: 800; }

        .executive-btn { background: none; border: none; font-family: 'Montserrat'; font-size: 11px; font-weight: 800; cursor: pointer; color: #475569; text-transform: uppercase; margin-right: 15px; padding: 0; }
        .comment-card { background: rgba(241, 245, 249, 0.7) !important; border-radius: 12px; padding: 22px; margin-bottom: 20px; box-shadow: 0 0 10px 2px rgba(0, 0, 0, 0.1); }
        .casual-adventurer-badge { color: #5C9AFF !important; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-left: 8px; }
        .park-scout-badge { color: #059669 !important; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-left: 8px; }
        .mod-badge-text { color: #f59e0b !important; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-left: 8px; }
        .submit-msg-success { margin-top: 15px; color: #059669; font-weight: 900; font-size: 13px; text-transform: uppercase; animation: fadeInOut 3s forwards; }
        @keyframes fadeInOut { 0% { opacity: 0; transform: translateY(-5px); } 10% { opacity: 1; transform: translateY(0); } 80% { opacity: 1; } 100% { opacity: 0; } }
        .reply-item-container { margin-left: 25px; border-left: 2.5px solid #000; padding-left: 18px; margin-top: 15px; }
    </style>`;

    // 4. COMPONENT: Builds HTML with Adventure Tiers
    const createCommentHtml = (comment) => {
        const isLiked = userLikes.has(String(comment.id));
        const voteCount = comment.votes_count || 0;
        const isGuest = !comment.userId || comment.by_email === 'guest@example.com';
        const isHost = comment.by_email === 'bestdayswithdad@gmail.com';

        let badgeHtml = isHost ? '<span class="mod-badge-text">MOD</span>' : 
                    (isGuest ? '<span class="casual-adventurer-badge">Casual Adventurer</span>' : 
                    '<span class="park-scout-badge">Park Scout</span>');

        return `
            <div class="comment-content-wrapper">
                <div style="display:flex; align-items:center; margin-bottom:12px;">
                    <span style="font-weight:800; font-size:16px; color:#94a3b8;">${comment.by_nickname}</span>
                    ${badgeHtml}
                </div>
                <p style="line-height:1.6; color:#334155; margin-bottom:15px;">${comment.content}</p>
                <div class="comment-actions">
                    <button class="executive-btn" onclick="window.setReply('${comment.id}', '${comment.by_nickname}')">Reply</button>
                    <button class="executive-btn ${isLiked ? 'is-active' : ''}" onclick="window.handleLikeAction('${comment.id}', ${isLiked})">
                        ${isLiked ? '❤️ HELPFUL' : '🤍 MARK AS HELPFUL'} ${voteCount > 0 ? `(${voteCount})` : ''}
                    </button>
                </div>
            </div>`;
    };

    const renderTree = (allComments, parentId) => {
        const children = allComments.filter(c => String(c.parentId) === String(parentId));
        return children.map(child => `<div class="reply-item-container">${createCommentHtml(child)}${renderTree(allComments, child.id)}</div>`).join('');
    };

    // 6. MAIN RENDER: Logic for Structured Hierarchy
    const render = async () => {
        if (window.location.hash.includes('access_token')) {
            setTimeout(() => { window.history.replaceState(null, null, window.location.pathname + window.location.search); }, 500);
        }

        const container = document.getElementById('custom-comment-section');
        if (!container) return;
        currentUser = getBadgeFromLocker();
        const pageId = encodeURIComponent(getCleanUrl());
        
        try {
            const res = await fetch(`https://cusdis-jet-one.vercel.app/api/public-comments?pageId=${pageId}`);
            const data = await res.json();
            const comments = Array.isArray(data) ? data : (data.comments || []);
            const rootComments = comments.filter(c => !c.parentId);
            
            let authBarHtml = `
                <div class="auth-bar ${currentUser?.user ? 'is-logged-in' : ''}">
                    ${currentUser?.user ? 
                        `<div>
                            <span style="font-size: 11px; font-weight: 800; color: #065f46; display: block; margin-bottom: 10px;">✓ SIGNED IN: ${currentUser.user.email}</span>
                            <button onclick="window.handleSignOut()" style="background: none; border: none; font-size: 11px; font-weight: 900; cursor: pointer; color: #ef4444; text-transform: uppercase;">LOG OUT</button>
                         </div>` : 
                        `<div>
                            <button onclick="window.handleSignIn()" style="background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 4px; font-size: 11px; font-weight: 800; cursor: pointer; margin-bottom: 10px; width: 220px;">SIGN IN WITH GOOGLE</button>
                            <span class="auth-policy-note">Before signing in, read our <a href="https://www.bestdayswithdad.com/p/privacy-agreement.html">Privacy Policy</a></span>
                         </div>`
                    }
                </div>
            `;

            container.innerHTML = styling + `
                <div>
                    <div id="comment-form-shell">
                        ${authBarHtml}

                        <label class="input-label">Your Nickname</label>
                        <input type="text" id="nickname" placeholder="Nickname" value="${currentUser?.user?.user_metadata?.full_name || ''}" />
                        
                        <label class="input-label">Share your experience</label>
                        <textarea id="comment-body" placeholder="Tell us about your adventure..." rows="4"></textarea>
                        <input type="hidden" id="parent-id" value="" />

                        <button class="submit-review-btn" onclick="window.submitReview()">Post Comment</button>
                        
                        <div class="comment-disclaimer">
                           By posting, you agree to our <a href="/p/comment-policy.html">Comment Policy</a>.
                        </div>

                        <div id="submit-msg"></div>
                    </div>

                    <div id="comment-list">
                        ${rootComments.map(c => `
                            <div class="comment-card">
                                ${createCommentHtml(c)}
                                ${renderTree(comments, c.id)}
                            </div>
                        `).join('')}
                    </div>
                </div>`;
        } catch (e) { container.innerHTML = `<p>Syncing comments...</p>`; }
    };

    // 7. ACTIONS
    window.setReply = (id, name) => { 
        document.getElementById('parent-id').value = id; 
        document.getElementById('comment-body').focus(); 
        document.getElementById('comment-body').placeholder = `Replying to ${name}...`;
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
            const successMsg = token ? "✓ Scout Report Logged!" : "✓ Comment Sent!";
            document.getElementById('submit-msg').innerHTML = `<div class="submit-msg-success">${successMsg}</div>`;
            document.getElementById('comment-body').value = ""; 
            document.getElementById('parent-id').value = "";
            document.getElementById('comment-body').placeholder = "Tell us about your adventure...";
            setTimeout(render, 1500); 
        } 
    };

    // 8. AUTH HANDLERS
    window.handleSignIn = async () => {
        localStorage.removeItem('sb-yfcqtkrayecpkkuzivvf-auth-token');
        await window.supabaseClient.auth.signInWithOAuth({
            provider: 'google', options: { redirectTo: window.location.href, queryParams: { prompt: 'select_account' } }
        });
    };

    window.handleSignOut = async () => {
        if (window.supabaseClient) {
            await window.supabaseClient.auth.signOut();
        }
        localStorage.removeItem('sb-yfcqtkrayecpkkuzivvf-auth-token');
        setTimeout(() => {
            window.location.reload();
        }, 100);
    };

    if (document.readyState === 'complete') render();
    else window.addEventListener('load', render);
})();
