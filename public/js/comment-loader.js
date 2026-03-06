(function() {
    let userLikes = new Set();
    let currentUser = null;

    const getBadgeFromLocker = () => {
        try {
            const token = JSON.parse(localStorage.getItem('best-days-auth-auth-token'));
            return token?.user || null;
        } catch (e) { return null; }
    }

    // THE MASTER TEMPLATE: Organizes content into vertical stacks
    const createCommentHtml = (comment, isReply = false) => {
        const isLiked = userLikes.has(String(comment.id));
        const voteCount = comment.votes_count || 0;
        const isAdmin = currentUser?.email === 'bestdayswithdad@gmail.com';

        return `
            <div class="comment-emoji">👤</div>
            <div class="comment-content-wrapper">
                <div class="comment-header-row">
                    <span class="comment-author-name">${comment.by_nickname}</span>
                    <span class="verified-reader-badge">Verified Reader</span>
                </div>
                <div class="comment-text-row">
                    <p>${comment.content}</p>
                </div>
                <div class="comment-actions">
                    <button class="executive-btn" onclick="window.setReply('${comment.id}', '${comment.by_nickname}')">Reply</button>
                    <button class="executive-btn ${isLiked ? 'is-active' : ''}" onclick="window.handleLikeAction('${comment.id}', ${isLiked})">
                        ${isLiked ? '❤️ HELPFUL' : '🤍 MARK AS HELPFUL'} ${voteCount > 0 ? `(${voteCount})` : ''}
                    </button>
                    ${isAdmin ? `<button class="executive-btn" style="color:#ef4444;" onclick="window.adminDelete('${comment.id}')">🗑️ DELETE</button>` : ''}
                </div>
            </div>`;
    };

    // RECURSIVE BRAIN
    const renderTree = (allComments, parentId, depth = 1) => {
        const children = allComments.filter(c => String(c.parentId) === String(parentId) || String(c.parent_id) === String(parentId));
        if (children.length === 0) return '';

        const isHidden = depth > 4;
        const wrapperId = `nest-${parentId}`;

        let branchHtml = children.map(child => `
            <div class="reply-item-container">
                ${createCommentHtml(child, true)}
                ${renderTree(allComments, child.id, depth + 1)}
            </div>
        `).join('');

        if (isHidden) {
            return `
                <button class="view-more-replies" id="btn-${wrapperId}" onclick="window.toggleNest('${wrapperId}')">
                    + View ${children.length} more replies
                </button>
                <div class="reply-thread-internal" id="${wrapperId}" style="display:none;">
                    ${branchHtml}
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
                    <div id="reply-indicator" style="display:none; background:#e0f2fe; color:#0369a1; padding:10px; border-radius:6px; font-size:11px; font-weight:700; margin-bottom:10px; border:1px solid #bae6fd; text-align:left; cursor:pointer;" onclick="window.cancelReply()">Replying to someone (Click to cancel X)</div>
                    <input type="text" id="nickname" placeholder="Your Nickname" value="${currentUser ? 'Adam' : ''}" />
                    <textarea id="comment-body" placeholder="Share your experience..."></textarea>
                    <input type="hidden" id="parent-id" value="" />
                    <button class="submit-review-btn" onclick="window.submitReview()">Post Review</button>
                    <p id="submit-msg" style="display:none; color: green; font-size: 12px; margin-top: 15px; font-weight:bold;"></p>
                </div>
                <div id="comment-list">
                    ${rootComments.map(c => `
                        <div class="comment-card">
                            <div class="comment-content-wrapper">
                                <div style="display:flex; width:100%;">
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

    window.toggleNest = (id) => {
        document.getElementById(id).style.display = 'block';
        document.getElementById(`btn-${id}`).style.display = 'none';
    };

    window.setReply = (id, name) => {
        document.getElementById('parent-id').value = id;
        const indicator = document.getElementById('reply-indicator');
        indicator.innerText = `Replying to ${name} (Click to cancel X)`;
        indicator.style.display = 'block';
        document.getElementById('comment-body').focus();
        window.scrollTo({ top: document.getElementById('comment-form').offsetTop - 150, behavior: 'smooth' });
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

    window.adminDelete = async (id) => {
        if (!confirm("Delete this comment?")) return;
        const res = await fetch('https://cusdis-jet-one.vercel.app/api/admin-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commentId: id })
        });
        if (res.ok) render();
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
