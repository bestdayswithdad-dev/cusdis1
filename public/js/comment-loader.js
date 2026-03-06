(function() {
    let userLikes = new Set();
    let currentUser = null;

    const getBadgeFromLocker = () => {
        try {
            const token = JSON.parse(localStorage.getItem('best-days-auth-auth-token'));
            return token?.user || null;
        } catch (e) { return null; }
    }

    const style = document.createElement('style');
    style.innerHTML = `
        /* THE CONTAINER: Widened for maximum writing space */
        #custom-comment-section { 
            max-width: 1100px; 
            width: calc(100% - 20px); /* Ensures 10px gap on each side */
            margin: 40px auto; 
            font-family: 'Montserrat', sans-serif !important; 
        }
        
        /* THE MAIN BUBBLE: Everything stays inside this widened border */
        .comment-card { 
            background: #f8fafc !important; 
            border: 1px solid #e2e8f0 !important; 
            border-radius: 20px !important; 
            padding: 25px !important; /* Slightly more padding for the wider look */
            margin-bottom: 25px !important; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.03) !important; 
            display: flex; 
            gap: 15px; 
        }
        
        .comment-emoji { font-size: 24px; padding-top: 5px; flex-shrink: 0; }
        .comment-body-wrap { flex: 1; }
        .comment-author-name { color: #334155 !important; font-weight: 800 !important; font-size: 16px !important; }
        .verified-reader-badge { background-color: #007bff !important; color: #ffffff !important; font-size: 9px !important; font-weight: 800 !important; padding: 2px 10px !important; border-radius: 4px !important; margin-left: 10px; text-transform: uppercase; }
        .comment-actions { display: flex; align-items: center; gap: 15px; margin-top: 12px; }
        .executive-btn { background: transparent; border: none; font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 800; text-transform: uppercase; cursor: pointer; color: #64748b; transition: 0.2s; padding: 0; }
        .executive-btn:hover { color: #334155; text-decoration: underline; }
        .executive-btn.is-active { color: #ef4444 !important; }

        /* INTERNAL REPLY STYLE: Widened and Indented */
        .reply-thread-internal { 
            margin-top: 20px; 
            border-top: 1px solid #e2e8f0; 
            padding-top: 20px; 
        }
        .reply-item-internal { 
            margin-bottom: 20px; 
            display: flex; 
            gap: 12px; 
            margin-left: 40px; /* Stronger indentation for the wider card */
        }
        .reply-item-internal .comment-emoji { font-size: 18px !important; }
        .reply-item-internal .comment-author-name { font-size: 14px !important; }

        /* Form Styles: Also widened */
        .submit-review-btn { background: #334155 !important; color: #ffffff !important; border-radius: 8px !important; padding: 14px 45px !important; font-weight: 700; text-transform: uppercase; cursor: pointer; border: none; margin-top: 10px; transition: 0.3s; }
        #custom-comment-section input, #custom-comment-section textarea { width: 100%; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 12px; font-family: inherit; box-sizing: border-box; font-size: 15px; }
        #reply-indicator { display: none; background: #e0f2fe; color: #0369a1; padding: 10px; border-radius: 6px; font-size: 11px; font-weight: 700; margin-bottom: 10px; border: 1px solid #bae6fd; text-align: left; }
    `;
    document.head.appendChild(style);

    const createCommentHtml = (comment, isReply = false) => {
        const isLiked = userLikes.has(String(comment.id));
        const voteCount = comment.votes_count || 0;
        return `
            <div class="comment-emoji">👤</div>
            <div class="comment-body-wrap">
                <div style="display:flex; align-items:center; margin-bottom:5px;">
                    <span class="comment-author-name">${comment.by_nickname}</span>
                    <span class="verified-reader-badge">Verified Reader</span>
                </div>
                <p style="font-size: 14px; color: #475569; line-height:1.6; margin:0;">${comment.content}</p>
                <div class="comment-actions">
                    <button class="executive-btn" onclick="window.setReply('${comment.id}', '${comment.by_nickname}')">Reply</button>
                    <button class="executive-btn ${isLiked ? 'is-active' : ''}" onclick="window.handleLikeAction('${comment.id}', ${isLiked})">
                        ${isLiked ? '❤️ HELPFUL' : '🤍 MARK AS HELPFUL'} ${voteCount > 0 ? `(${voteCount})` : ''}
                    </button>
                </div>
            </div>`;
    };

    const render = async () => {
        const container = document.getElementById('custom-comment-section');
        if (!container) return;

        currentUser = getBadgeFromLocker();
        const res = await fetch('https://cusdis-jet-one.vercel.app/api/public-comments');
        const comments = await res.json();

        if (currentUser?.id && window.supabaseClient) {
            const { data } = await window.supabaseClient.from('comment_likes').select('comment_id').eq('id', currentUser.id);
            if (data) userLikes = new Set(data.map(l => String(l.comment_id)));
        }

        const rootComments = comments.filter(c => !c.parentId && !c.parent_id);
        const getReplies = (parentId) => comments.filter(c => String(c.parentId) === String(parentId) || String(c.parent_id) === String(parentId));

        let html = `
            <div style="margin-top: 30px;">
                <div id="comment-form" style="margin-bottom: 40px; text-align: center;">
                    <div id="reply-indicator" onclick="window.cancelReply()">Replying to someone (Click to cancel X)</div>
                    <input type="text" id="nickname" placeholder="Your Nickname" value="${currentUser ? 'Adam' : ''}" />
                    <textarea id="comment-body" placeholder="Share your experience..."></textarea>
                    <input type="hidden" id="parent-id" value="" />
                    <button class="submit-review-btn" onclick="window.submitReview()">Post Review</button>
                    <p id="submit-msg" style="display:none; color: green; font-size: 12px; margin-top: 15px; font-weight:bold;"></p>
                </div>
                <div id="comment-list">
                    ${rootComments.map(c => {
                        const replies = getReplies(c.id);
                        return `
                        <div class="comment-card">
                            <div class="comment-emoji">👤</div>
                            <div class="comment-body-wrap">
                                <div style="display:flex; align-items:center; margin-bottom:5px;">
                                    <span class="comment-author-name">${c.by_nickname}</span>
                                    <span class="verified-reader-badge">Verified Reader</span>
                                </div>
                                <p style="font-size: 15px; color: #475569; line-height:1.6; margin:0;">${c.content}</p>
                                <div class="comment-actions">
                                    <button class="executive-btn" onclick="window.setReply('${c.id}', '${c.by_nickname}')">Reply</button>
                                    <button class="executive-btn ${userLikes.has(String(c.id)) ? 'is-active' : ''}" onclick="window.handleLikeAction('${c.id}', ${userLikes.has(String(c.id))})">
                                        ${userLikes.has(String(c.id)) ? '❤️ HELPFUL' : '🤍 MARK AS HELPFUL'} ${(c.votes_count || 0) > 0 ? `(${c.votes_count})` : ''}
                                    </button>
                                </div>

                                ${replies.length > 0 ? `
                                    <div class="reply-thread-internal">
                                        ${replies.map(r => `
                                            <div class="reply-item-internal">
                                                ${createCommentHtml(r, true)}
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
        container.innerHTML = html;
    };

    window.setReply = (id, name) => {
        document.getElementById('parent-id').value = id;
        const indicator = document.getElementById('reply-indicator');
        indicator.innerText = `Replying to ${name} (Click to cancel X)`;
        indicator.style.display = 'block';
        document.getElementById('comment-body').focus();
        window.scrollTo({ top: document.getElementById('comment-form').offsetTop - 100, behavior: 'smooth' });
    };

    window.cancelReply = () => {
        document.getElementById('parent-id').value = '';
        document.getElementById('reply-indicator').style.display = 'none';
    };

    window.handleLikeAction = async (commentId, alreadyLiked) => {
        if (!currentUser) { alert("Join the community to mark this as helpful!"); return; }
        const rpcName = alreadyLiked ? 'handle_remove_like' : 'handle_new_like';
        const { error } = await window.supabaseClient.rpc(rpcName, { c_id: String(commentId), u_id: currentUser.id });
        if (!error) render();
    };

    window.submitReview = async function() {
        const content = document.getElementById('comment-body').value;
        const nickname = document.getElementById('nickname').value;
        const parentId = document.getElementById('parent-id').value;
        if (!content) return;

        const res = await fetch('https://cusdis-jet-one.vercel.app/api/public-comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, nickname, parentId: parentId || null })
        });
        if (res.ok) {
            document.getElementById('submit-msg').innerText = "Thanks! Your review is awaiting moderation.";
            document.getElementById('submit-msg').style.display = "block";
            document.getElementById('comment-body').value = "";
            window.cancelReply();
            setTimeout(render, 2500);
        }
    };

    if (document.readyState === 'complete') render();
    else window.addEventListener('load', render);
})();
