(function() {
    let userLikes = new Set();
    let currentUser = null;

    // 1. IDENTITY & STYLE
    const getBadgeFromLocker = () => {
        try {
            const token = JSON.parse(localStorage.getItem('best-days-auth-auth-token'));
            return token?.user || null;
        } catch (e) { return null; }
    }

    const style = document.createElement('style');
    style.innerHTML = `
        #custom-comment-section { max-width: 800px; margin: 40px auto; font-family: 'Montserrat', sans-serif !important; }
        .comment-card { background: #f8fafc !important; border: 1px solid #e2e8f0 !important; border-radius: 20px !important; padding: 20px !important; margin-bottom: 25px !important; box-shadow: 0 4px 12px rgba(0,0,0,0.03) !important; display: flex; gap: 15px; }
        .comment-emoji { font-size: 24px; padding-top: 5px; }
        .comment-body-wrap { flex: 1; }
        .comment-author-name { color: #334155 !important; font-weight: 800 !important; font-size: 16px !important; }
        .verified-reader-badge { background-color: #e2e8f0 !important; color: #334155 !important; font-size: 9px !important; font-weight: 800 !important; padding: 4px 8px !important; border-radius: 12px !important; margin-left: 8px; }
        .comment-actions { display: flex; align-items: center; gap: 15px; margin-top: 12px; }
        .executive-btn { background: transparent; border: none; font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 800; text-transform: uppercase; cursor: pointer; color: #64748b; transition: 0.2s; padding: 0; }
        .executive-btn:hover { color: #334155; text-decoration: underline; }
        .executive-btn.is-active { color: #ef4444 !important; }
        .submit-review-btn { background: #334155 !important; color: #ffffff !important; border-radius: 8px !important; padding: 12px 32px !important; font-weight: 700; text-transform: uppercase; cursor: pointer; border: none; margin-top: 10px; }
        #custom-comment-section input, #custom-comment-section textarea { width: 100%; padding: 14px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 12px; font-family: inherit; }
    `;
    document.head.appendChild(style);

    // 2. RENDER LOGIC
    const render = async () => {
        const container = document.getElementById('custom-comment-section');
        if (!container) return;

        currentUser = getBadgeFromLocker();
        
        // Fetch comments from your Vercel API
        const res = await fetch('https://cusdis-jet-one.vercel.app/api/public-comments');
        const comments = await res.json();

        // Fetch likes from Supabase directly for the hearts
        if (currentUser?.id && window.supabaseClient) {
            const { data } = await window.supabaseClient.from('comment_likes').select('comment_id').eq('id', currentUser.id);
            if (data) userLikes = new Set(data.map(l => String(l.comment_id)));
        }

        let html = `
            <div style="margin-top: 30px;">
                <div style="margin-bottom: 40px; text-align: center;">
                    <input type="text" id="nickname" placeholder="Your Nickname" value="${currentUser ? 'Adam' : ''}" />
                    <textarea id="comment-body" placeholder="Share your experience..."></textarea>
                    <button class="submit-review-btn" onclick="window.submitReview()">Post Review</button>
                    <p id="submit-msg" style="display:none; color: green; font-size: 12px; margin-top: 15px; font-weight:bold;"></p>
                </div>
                <div id="comment-list">
                    ${comments.map(c => {
                        const isLiked = userLikes.has(String(c.id));
                        const voteCount = c.votes_count || 0;
                        return `
                        <div class="comment-card">
                            <div class="comment-emoji">👤</div>
                            <div class="comment-body-wrap">
                                <div style="display:flex; align-items:center; margin-bottom:5px;">
                                    <span class="comment-author-name">${c.by_nickname}</span>
                                    <span class="verified-reader-badge">Verified Reader</span>
                                </div>
                                <p style="font-size: 14px; color: #475569; line-height:1.6; margin:0;">${c.content}</p>
                                <div class="comment-actions">
                                    <button class="executive-btn" onclick="window.prepareReply('${c.by_nickname}')">Reply</button>
                                    <button class="executive-btn ${isLiked ? 'is-active' : ''}" onclick="window.handleLikeAction('${c.id}', ${isLiked})">
                                        ${isLiked ? '❤️ HELPFUL' : '🤍 MARK AS HELPFUL'} ${voteCount > 0 ? `(${voteCount})` : ''}
                                    </button>
                                </div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
        container.innerHTML = html;
    };

    // 3. GLOBAL ACTIONS
    window.prepareReply = (name) => {
        const area = document.getElementById('comment-body');
        area.value = `@${name} `;
        area.focus();
    };

    window.handleLikeAction = async (commentId, alreadyLiked) => {
        if (!currentUser) { alert("Join the community to mark this as helpful!"); return; }
        const rpcName = alreadyLiked ? 'handle_remove_like' : 'handle_new_like';
        const { error } = await window.supabaseClient.rpc(rpcName, { c_id: String(commentId), u_id: currentUser.id });
        if (!error) render(); // Re-render to show updated heart
    };

    window.submitReview = async function() {
        const content = document.getElementById('comment-body').value;
        const nickname = document.getElementById('nickname').value;
        if (!content) return;

        const res = await fetch('https://cusdis-jet-one.vercel.app/api/public-comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, nickname })
        });
        if (res.ok) {
            document.getElementById('submit-msg').innerText = "Thanks! Your review is awaiting moderation.";
            document.getElementById('submit-msg').style.display = "block";
            document.getElementById('comment-body').value = "";
            setTimeout(render, 2000);
        }
    };

    // Initialize
    if (document.readyState === 'complete') render();
    else window.addEventListener('load', render);
})();
