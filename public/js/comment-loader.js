(function() {
  // 1. ADD STYLES DYNAMICALLY
  const style = document.createElement('style');
  style.innerHTML = `
    #custom-comment-section { max-width: 800px; margin: 40px auto; font-family: 'Montserrat', sans-serif !important; }
    .comment-card { background: #f8fafc !important; border: 1px solid #e2e8f0 !important; border-radius: 20px !important; padding: 20px !important; margin-bottom: 25px !important; box-shadow: 0 4px 12px rgba(0,0,0,0.03) !important; }
    .comment-author-name { color: #334155 !important; font-weight: 800 !important; font-size: 16px !important; }
    .verified-reader-badge { background-color: #e2e8f0 !important; color: #334155 !important; font-size: 9px !important; font-weight: 800 !important; padding: 4px 8px !important; border-radius: 12px !important; margin-left: 8px; }
    .submit-review-btn { background: #334155 !important; color: #ffffff !important; border-radius: 8px !important; padding: 14px 40px !important; font-weight: 700; text-transform: uppercase; cursor: pointer; border: none; }
    #custom-comment-section input, #custom-comment-section textarea { width: 100%; padding: 14px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 12px; }
  `;
  document.head.appendChild(style);

  // 2. FETCH AND RENDER
  const container = document.getElementById('custom-comment-section');
  if (!container) return;

  fetch('https://cusdis-jet-one.vercel.app/api/public-comments')
    .then(res => res.json())
    .then(comments => {
      let html = `
        <div style="margin-top: 50px;">
          <h3 style="text-align:center; text-transform:uppercase; letter-spacing:2px; font-weight:800;">Reader Reviews</h3>
          <div style="margin-bottom: 40px; text-align: center;">
            <input type="text" id="nickname" placeholder="Your Nickname" />
            <textarea id="comment-body" placeholder="Share your experience..."></textarea>
            <button class="submit-review-btn" onclick="window.submitReview()">Post Review</button>
            <p id="submit-msg" style="display:none; color: green; font-size: 12px; margin-top: 15px; font-weight:bold;"></p>
          </div>
          <div id="comment-list">
            ${comments.map(c => `
              <div class="comment-card">
                <div style="display:flex; align-items:center; margin-bottom:10px;">
                    <span class="comment-author-name">${c.by_nickname}</span>
                    <span class="verified-reader-badge">Verified Reader</span>
                </div>
                <p style="font-size: 14px; color: #475569; line-height:1.6; margin:0;">${c.content}</p>
              </div>
            `).join('')}
          </div>
        </div>`;
      container.innerHTML = html;
    });

  // 3. ATTACH GLOBAL SUBMIT FUNCTION
  window.submitReview = async function() {
    const content = document.getElementById('comment-body').value;
    const nickname = document.getElementById('nickname').value;
    const res = await fetch('https://cusdis-jet-one.vercel.app/api/public-comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, nickname })
    });
    if (res.ok) {
      document.getElementById('submit-msg').innerText = "Thanks! Your review is awaiting moderation.";
      document.getElementById('submit-msg').style.display = "block";
      document.getElementById('comment-body').value = "";
    }
  };
})();
