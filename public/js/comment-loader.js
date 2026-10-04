(function() {
    // Persistent local storage for likes so they survive refreshes
    let userLikes = new Set(JSON.parse(localStorage.getItem('bdwd_likes') || '[]'));
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
            max-width: 1000px;
            margin: -30px auto 0 auto;
        }
        
        .input-wrapper {
            position: relative;
            margin-top: 40px;
            margin-bottom: 12px;
        }

        .nickname-label-bar {
            padding-left: 10px;
            margin-bottom: 8px;
            display: flex;
            gap: 5px;
            align-items: center;
            flex-wrap: wrap;
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

        .avatar-choice-label {
            font-size: 11px;
            font-weight: 700;
            color: #94a3b8;
            display: flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            margin-left: auto;
            padding-right: 10px;
        }

        /* NOTIFICATION TOAST / BANNER (MODERN EXECUTIVE PALETTE) */
        .bdwd-notice-banner {
            border-radius: 14px;
            padding: 16px 20px;
            margin-bottom: 16px;
            font-size: 13.5px;
            line-height: 1.5;
            display: none;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
            animation: bdwdFade 0.3s ease;
        }
        .bdwd-notice-banner.success {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-left: 5px solid #22c55e;
            color: #15803d;
        }
        .bdwd-notice-banner.pending {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-left: 5px solid #007bff;
            color: #1e293b;
        }
        .bdwd-notice-banner.flagged {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-left: 5px solid #ef4444;
            color: #991b1b;
        }
        .bdwd-notice-banner strong {
            font-weight: 800;
            display: block;
            margin-bottom: 4px;
            font-size: 14px;
        }

        /* SAFE & POLISHED GOOGLE SIGN-IN BUTTON */
        .bdwd-google-cta-btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            background: #ffffff;
            color: #374151;
            border: 1.5px solid #d1d5db;
            border-radius: 20px;
            padding: 8px 18px;
            font-size: 12.5px;
            font-weight: 700;
            text-decoration: none;
            cursor: pointer;
            margin-top: 10px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
            transition: all 0.2s ease;
            font-family: 'Montserrat', sans-serif !important;
        }
        .bdwd-google-cta-btn:hover {
            background: #f9fafb;
            border-color: #007bff;
            color: #111827;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
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
            width: 38px;
            height: 38px;
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

        #comment-body {
            flex: 1;
            border: none;
            background: transparent !important;
            padding: 8px 0;
            font-family: 'Montserrat', sans-serif;
            font-size: 15px;
            color: #1e293b;
            resize: none;
            outline: none !important;
            box-shadow: none;
            min-height: 24px;
            max-height: 200px; 
            line-height: 1.5;
            overflow-y: hidden;
        }

        .send-btn {
            background: #1e293b !important;
            color: white !important;
            width: 38px;
            height: 38px;
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

        .comment-legal-footer {
            font-size: 11px;
            color: #94a3b8;
            font-weight: 700;
            text-transform: uppercase;
            text-align: center;
            padding-bottom: 30px;
            line-height: 1.6;
            letter-spacing: 0.3px;
        }
        .comment-legal-footer a { color: #2A5DB0 !important; text-decoration: underline; }

        .comment-card { 
            background: #fff !important; 
            border-radius: 16px; 
            padding: 20px; 
            margin-bottom: 16px; 
            border: 1px solid #e2e8f0; 
            display: flex; 
            gap: 14px; 
        }
        .comment-main { flex: 1; }
        .executive-btn { background: none; border: none; font-family: 'Montserrat'; font-size: 11px; font-weight: 800; cursor: pointer; color: #94a3b8; text-transform: uppercase; margin-right: 15px; padding: 0; }
        .casual-adventurer-badge { color: #3b82f6 !important; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-left: 8px; }
        .park-scout-badge { color: #10b981 !important; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-left: 8px; }
        .mod-badge-text { color: #f59e0b !important; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-left: 8px; }
        .reply-item-container { margin-left: 10px; border-left: 2px solid #f1f5f9; padding-left: 15px; margin-top: 15px; }

        @keyframes bdwdFade {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>`;

    const createCommentHtml = (comment) => {
        const isLiked = userLikes.has(String(comment.id));
        const voteCount = comment.votes_count || 0;
        const isGuest = !comment.by_email || comment.by_email === 'guest@example.com';
        const isHost = comment.by_email === 'bestdayswithdad@gmail.com';

        // Ownership checks for self-delete
        const isOwner = currentUser?.user?.email === comment.by_email;
        const isAdmin = currentUser?.user?.email === 'bestdayswithdad@gmail.com';

        let badgeHtml = isHost ? '<span class="mod-badge-text">MOD</span>' : 
                    (isGuest ? '<span class="casual-adventurer-badge">Casual Adventurer</span>' : 
                    '<span class="park-scout-badge">Park Scout</span>');

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
                        <button class="executive-btn" onclick="window.handleLikeAction('${comment.id}')">
                            ${isLiked ? '❤️' : '🤍'} ${voteCount > 0 ? voteCount : ''}
                        </button>
                        ${(isOwner || isAdmin) ? `<button class="executive-btn" style="color: #ef4444;" onclick="window.handleSelfDelete('${comment.id}')">Delete</button>` : ''}
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
                            ${createCommentHtml(c)}${renderTree(comments, c.id)}
                        </div>
                    `).join('')}
                </div>

                <div class="input-wrapper">
                    <!-- INLINE STATUS FEEDBACK BOX -->
                    <div id="bdwd-notice-box" class="bdwd-notice-banner"></div>

                    <div class="nickname-label-bar">
                        <span style="font-size: 10px; font-weight: 800; color: #cbd5e1;">POSTING AS:</span>
                        <input type="text" id="nickname" value="${currentUser?.user?.user_metadata?.full_name || 'Guest Explorer'}" />
                        
                        ${currentUser?.user ? `
                            <label class="avatar-choice-label">
                                <input type="checkbox" id="use-avatar" checked> Use Google Photo
                            </label>
                        ` : ''}
                    </div>
                    
                    <div id="comment-form">
                        <div class="auth-trigger-area">
                            ${authButton}
                        </div>
                        <textarea id="comment-body" placeholder="Message Best Days With Dad..." rows="1" oninput="window.autoExpand(this)"></textarea>
                        <input type="hidden" id="parent-id" value="" />
                        <button class="send-btn" onclick="window.submitReview()">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        </button>
                    </div>
                </div>

                <div class="comment-legal-footer">
                    By signing in or posting, you agree to our 
                    <a href="https://www.bestdayswithdad.com/p/terms-of-service.html">Terms of Service</a>, 
                    <a href="https://www.bestdayswithdad.com/p/privacy-agreement.html">Privacy Policy</a>, 
                    & <a href="/p/comment-policy.html">Comment Policy</a>.
                </div>`;
            
            window.autoExpand = autoExpand;
        } catch (e) { container.innerHTML = `<p>Syncing discussion...</p>`; }
    };

    window.submitReview = async function() { 
        const content = document.getElementById('comment-body').value.trim(); 
        const nickname = document.getElementById('nickname').value.trim(); 
        const parentId = document.getElementById('parent-id').value; 
        const avatarCheckbox = document.getElementById('use-avatar'); 
        const noticeBox = document.getElementById('bdwd-notice-box');
        
        if (!content || !nickname) return; 

        if (noticeBox) noticeBox.style.display = 'none';

        const freshLocker = getBadgeFromLocker(); 
        const token = freshLocker ? freshLocker.access_token : null; 
        
        const avatar_url = (freshLocker?.user && (!avatarCheckbox || avatarCheckbox.checked)) 
            ? freshLocker.user.user_metadata.avatar_url 
            : null; 

        try {
            const res = await fetch('https://cusdis-jet-one.vercel.app/api/public-comments', { 
                method: 'POST', 
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': token ? `Bearer ${token}` : '' 
                }, 
                body: JSON.stringify({ 
                    content, 
                    nickname, 
                    pageId: getCleanUrl(), 
                    pageTitle: document.title.split(' : ')[0], 
                    parentId: parentId || null, 
                    metadata: { avatar_url } 
                }) 
            }); 

            const data = await res.json().catch(() => ({}));

            if (res.ok) { 
                const body = document.getElementById('comment-body'); 
                body.value = ""; 
                body.style.height = 'auto'; 
                document.getElementById('parent-id').value = ""; 
                body.placeholder = "Message Best Days With Dad..."; 

                // CONTEXTUAL MODERATION FEEDBACK
                if (noticeBox) {
                    if (data.moderationStatus === 'live') {
                        noticeBox.className = 'bdwd-notice-banner success';
                        noticeBox.innerHTML = `
                            <strong>✔ Thanks for your comment!</strong>
                            As a verified reader, your review was published instantly to this post.
                        `;
                        noticeBox.style.display = 'block';
                        setTimeout(render, 500);
                    } else if (data.moderationStatus === 'flagged') {
                        noticeBox.className = 'bdwd-notice-banner flagged';
                        noticeBox.innerHTML = `
                            <strong>⚠️ Comment Sent for Review</strong>
                            Your comment contained language or links flagged by our family-friendly filter. It has been routed to our moderation team for review.
                        `;
                        noticeBox.style.display = 'block';
                    } else {
                        noticeBox.className = 'bdwd-notice-banner pending';
                        noticeBox.innerHTML = `
                            <strong>Thank you for submitting a comment with Best Days with Dad!</strong>
                            <div>Sign in with Google to skip moderation on future comments:</div>
                            <button class="bdwd-google-cta-btn" onclick="window.handleSignIn()">
                                <svg width="15" height="15" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                                <span>Sign In with Google</span>
                            </button>
                        `;
                        noticeBox.style.display = 'block';
                    }
                } else {
                    setTimeout(render, 500);
                }
            } 
        } catch (err) {
            console.error("Submission failed", err);
        }
    };

    window.setReply = (id, name) => { 
        document.getElementById('parent-id').value = id; 
        const body = document.getElementById('comment-body'); 
        body.focus(); 
        body.placeholder = `Reply to ${name}...`; 
    };

    window.handleLikeAction = async (id) => {
        // --- AUTH CHECK FOR LIKES ---
        const freshLocker = getBadgeFromLocker();
        if (!freshLocker?.user) {
            return alert("Please sign in with Google to like comments!");
        }

        const commentId = String(id);
        const isUnliking = userLikes.has(commentId);
        const token = freshLocker.access_token;
        
        if (isUnliking) {
            userLikes.delete(commentId);
        } else {
            userLikes.add(commentId);
        }
        
        localStorage.setItem('bdwd_likes', JSON.stringify(Array.from(userLikes)));
        render();

        try {
            const res = await fetch(`https://cusdis-jet-one.vercel.app/api/public-comments?id=${id}&action=like`, { 
                method: 'PATCH', 
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                }, 
                body: JSON.stringify({ type: isUnliking ? 'dec' : 'inc' }) 
            }); 
            if (res.ok) { 
                setTimeout(render, 300); 
            } 
        } catch (e) { 
            console.error("Like failed", e); 
            if (isUnliking) userLikes.add(commentId); 
            else userLikes.delete(commentId); 
            render(); 
        } 
    };

    window.handleSelfDelete = async (id) => {
        if (!confirm("Are you sure you want to permanently delete this comment?")) return; 
        
        const freshLocker = getBadgeFromLocker(); 
        const token = freshLocker ? freshLocker.access_token : null; 

        const res = await fetch(`https://cusdis-jet-one.vercel.app/api/public-comments?id=${id}`, { 
            method: 'DELETE', 
            headers: { 
                'Authorization': token ? `Bearer ${token}` : '' 
            } 
        }); 

        if (res.ok) { 
            render(); 
        } else { 
            alert("Could not delete comment. You may only delete your own posts."); 
        } 
    };

    window.handleSignIn = async () => {
        localStorage.removeItem('sb-yfcqtkrayecpkkuzivvf-auth-token');
        if (window.supabaseClient) {
            await window.supabaseClient.auth.signInWithOAuth({
                provider: 'google', 
                options: { redirectTo: window.location.href, queryParams: { prompt: 'select_account' } }
            });
        }
    };

    window.handleSignOut = async () => {
        if (window.supabaseClient) await window.supabaseClient.auth.signOut();
        localStorage.removeItem('sb-yfcqtkrayecpkkuzivvf-auth-token');
        setTimeout(() => { window.location.reload(); }, 100);
    };

    if (document.readyState === 'complete') render();
    else window.addEventListener('load', render);
})();
