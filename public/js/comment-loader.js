(function() {
    let userLikes = new Set();
    let currentUser = null;
    let supabaseClient = null;

    const VERCEL_URL = 'https://cusdis-jet-one.vercel.app';

    const getCleanUrl = () => window.location.href.split('?')[0].split('#')[0];

    const getDisplayName = (user) =>
        user?.user_metadata?.full_name
        || user?.user_metadata?.name
        || user?.email?.split('@')[0]
        || '';

    const initSupabase = () => {
        if (!window.supabase) return null;
        return window.supabase.createClient(
            'https://yfcqtkrayecpkkuzivvf.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmY3F0a3JheWVjcGtrdXppdnZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODYyMzUsImV4cCI6MjA4NzA2MjIzNX0.v6ED2QiPExy8A13HKYioHhPjW7UjNN6tJTul44cPtWg'
        );
    };

    const createCommentHtml = (comment) => {
        const isLiked = userLikes.has(String(comment.id));
        const voteCount = Number(comment.votes_count) || 0;
        const isRedHeart = isLiked || voteCount > 0;
        const isAdmin = currentUser?.email === 'bestdayswithdad@gmail.com';
        const isVerified = comment.by_email && comment.by_email !== 'guest@example.com';
        const isMod = comment.by_email === 'bestdayswithdad@gmail.com';

        return `
            <div class="comment-content-wrapper">
                <div class="comment-header-row">
                    <div class="comment-emoji">👤</div>
                    <span class="comment-author-name">${comment.by_nickname}</span>
                    ${isVerified && !isMod ? '<span class="verified-reader-badge">Guest Explorer</span>' : ''}
                    ${isMod ? '<span class="verified-reader-badge" style="background:#f59e0b !important;">MOD</span>' : ''}
                </div>
                <div class="comment-text-row">
                    <p>${comment.content}</p>
                </div>
                <div class="comment-actions">
                    <button class="executive-btn" onclick="window.setReply('${comment.id}', '${comment.by_nickname}')">Reply</button>
                    <button class="executive-btn ${isRedHeart ? 'is-active' : ''}" 
                        onclick="window.handleLikeAction('${comment.id}', ${isLiked})"
                        style="${isRedHeart ? 'color:#ef4444;' : ''}">
                        ${isRedHeart ? '❤️ HELPFUL' : '🤍 MARK AS HELPFUL'}${voteCount > 0 ? ` (${voteCount})` : ''}
                    </button>
                    ${isAdmin ? `<button class="executive-btn" style="color:#ef4444;" onclick="window.adminDelete('${comment.id}')">🗑️ DELETE</button>` : ''}
                </div>
            </div>`;
    };

    const renderTree = (allComments, parentId, depth = 1) => {
        const children = allComments.filter(c =>
            String(c.parentId) === String(parentId) || String(c.parent_id) === String(parentId)
        );
        if (children.length === 0) return '';
        const isHidden = depth > 4;
        const wrapperId = `nest-${parentId}`;
        const branchHtml = children.map(child => `
            <div class="reply-item-container">
                ${createCommentHtml(child)}
                ${renderTree(allComments, child.id, depth + 1)}
            </div>
        `).join('');

        if (isHidden) {
            return `
                <button class="view-more-replies" id="btn-${wrapperId}" onclick="window.toggleNest('${wrapperId}')">
                    + View ${children.length} replies
                </button>
                <div class="reply-thread-internal" id="${wrapperId}" style="display:none;">${branchHtml}</div>`;
        }
        return `<div class="reply-thread-internal">${branchHtml}</div>`;
    };

    const render = async () => {
        const container = document.getElementById('custom-comment-section');
        if (!container) return;

        // Get current auth state from Supabase directly (not localStorage key)
        if (supabaseClient) {
            const { data: { session } } = await supabaseClient.auth.getSession();
            currentUser = session?.user || null;
        }

        const pageId = encodeURIComponent(getCleanUrl());
        const res = await fetch(`${VERCEL_URL}/api/comments?pageId=${pageId}`);
        const comments = await res.json();
        const safeComments = Array.isArray(comments) ? comments : [];

        if (currentUser?.id && supabaseClient) {
            const { data } = await supabaseClient
                .from('comment_likes')
                .select('comment_id')
                .eq('user_id', currentUser.id);
            if (data) userLikes = new Set(data.map(l => String(l.comment_id)));
        }

        const rootComments = safeComments.filter(c => !c.parentId && !c.parent_id);
        const displayName = getDisplayName(currentUser);

        container.innerHTML = `
            <div style="margin-top:0;">
                <div class="comment-disclaimer">
                    By posting, you agree to our <a href="/p/comment-policy.html">Comment Policy</a>.<br>
                    Be kind, be helpful, and keep it family-friendly!
                </div>

                <div id="comment-form" style="margin-bottom:30px; text-align:center;">
                    <div id="reply-indicator" style="display:none; background:#e0f2fe; color:#0369a1; padding:10px; border-radius:6px; font-size:11px; font-weight:700; margin-bottom:10px; border:1px solid #bae6fd; text-align:left; cursor:pointer;" onclick="window.cancelReply()">
                        Replying to someone (Click to cancel ✕)
                    </div>

                    <input type="text" id="nickname" placeholder="Your Nickname *"
                        value="${currentUser ? displayName : ''}"
                        ${currentUser ? 'readonly style="background:#f1f5f9; color:#64748b;"' : ''} />

                    ${!currentUser ? `
                        <input type="email" id="commenter-email" placeholder="Email (optional — get member perks)" />
                        <p style="font-size:11px; color:#888; margin:-4px 0 12px; text-align:left; font-family:'Montserrat',sans-serif; line-height:1.5; padding:0 2px;">
                            ✉️ Enter your email to join the <strong>Best Days With Dad</strong> community — get early access, activity picks, and verified status. We'll send a one-click sign-in link.
                        </p>
                    ` : `
                        <p style="font-size:12px; color:#64748b; margin:0 0 12px; text-align:left; font-family:'Montserrat',sans-serif;">
                            Signed in as <strong>${displayName}</strong> · 
                            <a href="#" onclick="window.handleSignOut(event)" style="color:#007bff;">Sign out</a>
                        </p>
                    `}

                    <textarea id="comment-body" placeholder="Share your experience..."></textarea>
                    <input type="hidden" id="parent-id" value="" />
                    <button class="submit-review-btn" onclick="window.submitReview()">Post Review</button>
                    <div id="submit-msg" style="display:none; font-size:12px; margin-top:10px; font-family:'Montserrat',sans-serif;"></div>
                </div>

                <div id="comment-list">
                    ${rootComments.length === 0
                        ? '<p style="color:#888; font-size:14px; font-family:\'Montserrat\',sans-serif;">No reviews yet. Be the first!</p>'
                        : rootComments.map(c => `
                            <div class="comment-card">
                                ${createCommentHtml(c)}
                                ${renderTree(safeComments, c.id, 1)}
                            </div>
                        `).join('')
                    }
                </div>
            </div>`;

        container.classList.add('loaded');
    };

    // Auth
    window.handleSignOut = async (e) => {
        e.preventDefault();
        if (supabaseClient) await supabaseClient.auth.signOut();
        currentUser = null;
        render();
    };

    // UI helpers
    window.toggleNest = (id) => {
        document.getElementById(id).style.display = 'block';
        document.getElementById(`btn-${id}`).style.display = 'none';
    };

    window.setReply = (id, name) => {
        document.getElementById('parent-id').value = id;
        const ind = document.getElementById('reply-indicator');
        ind.innerText = `Replying to ${name} (Click to cancel ✕)`;
        ind.style.display = 'block';
        document.getElementById('comment-body').focus();
        window.scrollTo({ top: document.getElementById('comment-form').offsetTop - 150, behavior: 'smooth' });
    };

    window.cancelReply = () => {
        document.getElementById('parent-id').value = '';
        document.getElementById('reply-indicator').style.display = 'none';
    };

    // Likes — hits your existing API
    window.handleLikeAction = async (commentId, alreadyLiked) => {
        if (!currentUser) {
            const msg = document.getElementById('submit-msg');
            msg.style.color = '#007bff';
            msg.innerText = '✉️ Enter your email above and post a comment to unlock likes!';
            msg.style.display = 'block';
            return;
        }
        const rpc = alreadyLiked ? 'handle_remove_like' : 'handle_new_like';
        const { error } = await supabaseClient.rpc(rpc, { c_id: String(commentId), u_id: currentUser.id });
        if (!error) render();
    };

    // Admin delete — hits your existing DELETE /api/admin/comments route
    window.adminDelete = async (id) => {
        const modal = confirm('Delete this comment?');
        if (!modal) return;
        const { data: { session } } = await supabaseClient.auth.getSession();
        const res = await fetch(`${VERCEL_URL}/api/admin/comments?id=${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${session?.access_token}` }
        });
        if (res.ok) render();
    };

    // Submit
    window.submitReview = async function() {
        const content = document.getElementById('comment-body')?.value.trim();
        const nickname = document.getElementById('nickname')?.value.trim();
        const parentId = document.getElementById('parent-id')?.value || null;
        const email = document.getElementById('commenter-email')?.value.trim() || '';
        const msg = document.getElementById('submit-msg');
        const pageId = getCleanUrl();

        if (!content) return;

        // Send magic link if email provided and not already signed in
        if (email && !currentUser && supabaseClient) {
            const { error } = await supabaseClient.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: window.location.href,
                    shouldCreateUser: true
                }
            });
            if (!error) {
                msg.style.color = '#007bff';
                msg.innerText = '📬 Check your inbox — we sent you a sign-in link for member perks!';
                msg.style.display = 'block';
            }
        }

        const headers = { 'Content-Type': 'application/json' };
        if (supabaseClient) {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }
        }

        const res = await fetch(`${VERCEL_URL}/api/comments`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ content, nickname, parentId, pageId })
        });

        if (res.ok) {
            const data = await res.json();
            if (!email || currentUser) {
                msg.style.color = 'green';
                msg.innerText = data.approved
                    ? '✅ Your review is live!'
                    : '🕐 Thanks! Your review is awaiting moderation.';
                msg.style.display = 'block';
            }
            document.getElementById('comment-body').value = '';
            window.cancelReply();
            setTimeout(render, 1000);
        } else {
            msg.style.color = 'red';
            msg.innerText = 'Something went wrong. Please try again.';
            msg.style.display = 'block';
        }
    };

    // Boot
    const boot = () => {
        const sdkScript = document.createElement('script');
        sdkScript.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        sdkScript.onload = () => {
            supabaseClient = initSupabase();
            // Also expose for likes RPC calls
            window.supabaseClient = supabaseClient;
            // Handle magic link redirect (user returning from email click)
            supabaseClient.auth.onAuthStateChange((_event, session) => {
                currentUser = session?.user || null;
                render();
            });
            render();
        };
        document.head.appendChild(sdkScript);
    };

    if (document.readyState === 'complete') boot();
    else window.addEventListener('load', boot);
})();
