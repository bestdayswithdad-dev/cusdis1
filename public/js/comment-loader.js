(function() {
    let userLikes = new Set();
    let currentUser = null;

    const getBadgeFromLocker = () => {
        try {
            const token = JSON.parse(localStorage.getItem('best-days-auth-auth-token'));
            return token?.user || null;
        } catch (e) { return null; }
    }

    const createCommentHtml = (comment, isReply = false) => {
        const isLiked = userLikes.has(String(comment.id));
        const voteCount = comment.votes_count || 0;
        const emojiSize = isReply ? '18px' : '24px';
        const nameSize = isReply ? '14px' : '16px';
        const wrapClass = isReply ? 'reply-item-internal' : 'comment-body-wrap';

        return `
            <div class="comment-emoji" style="font-size: ${emojiSize}">👤</div>
            <div class="${wrapClass}">
                <div style="display:flex; align-items:center; margin-bottom:5px;">
                    <span class="comment-author-name" style="font-size: ${nameSize}">${comment.by_nickname}</span>
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

    // RECURSIVE BRAIN WITH DEPTH LIMIT
    const renderTree = (allComments, parentId, depth = 1) => {
        const children = allComments.filter(c => String(c.parentId) === String(parentId) || String(c.parent_id) === String(parentId));
        if (children.length === 0) return '';

        // If we are deeper than 4 levels, wrap in a hidden container
        const isHidden = depth > 4;
        const wrapperId = `nest-${parentId}`;

        let branchHtml = children.map(child => `
            <div class="reply-group">
                <div class="reply-item-internal">
                    ${createCommentHtml(child, true)}
                </div>
                ${renderTree(allComments, child.id, depth + 1)}
            </div>
        `).join('');

        if (isHidden) {
            return `
                <div class="depth-limiter">
                    <button class="view-more-replies" id="btn-${wrapperId}" onclick="window.toggleNest('${wrapperId}')">
                        + View ${children.length} more replies
                    </button>
                    <div class="hidden-nest" id="${wrapperId}" style="display:none;">
                        ${branchHtml}
                    </div>
                </div>`;
        }

        return `<div class="reply-thread-internal">${branchHtml}</div>`;
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
                    ${rootComments.map(c => `
                        <div class="comment-card">
                            <div class="comment-body-wrap" style="display:flex; flex-direction:column; width:100%;">
                                <div style="display:flex; gap:15px; width:100%;">
                                    ${createCommentHtml(c, false)}
                                </div>
                                ${renderTree(comments, c.id, 1)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        container.innerHTML = html;
        container.classList.add('loaded');
    };

    // TOGGLE LOGIC
    window.toggleNest = (id) => {
        const el = document.getElementById(id);
        const btn = document.getElementById(`btn-${id}`);
        if (el.style.display === 'none') {
            el.style.display = 'block';
            btn.style.display = 'none';
        }
    };

    // (Global handlers window.setReply, window.cancelReply, window.handleLikeAction, window.submitReview stay exactly as before)
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
