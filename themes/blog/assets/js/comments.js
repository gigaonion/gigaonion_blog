/**
 * @file comments.js
 * @description
 *  記事のコメント機能に関するすべての動作を管理する。
 *  主な機能は以下の通り:
 *  - APIサーバーから特定のスラグを持つコメントを取得し、ツリー形式で表示する。
 *  - コメント投稿フォームの処理（reCAPTCHA v3による検証を含む）。
 *  - 他のコメントへの返信機能。
 *  - 管理人バッジの表示。
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素と設定の取得 ---
    const commentsSection = document.getElementById('comments-section');
    if (!commentsSection) return;

    const API_BASE_URL = 'https://api.gigaonion.com/blog'; // APIサーバーのベースURL
    const postSlug = commentsSection.dataset.postSlug; // 記事のスラグ
    const commentsList = document.getElementById('comments-list');
    const commentForm = document.getElementById('comment-form');
    const statusMessage = document.getElementById('comment-status');
    const submitButton = document.getElementById('submit-comment');
    const parentIdInput = document.getElementById('comment-parent-id');
    const replyIndicator = document.getElementById('reply-to-indicator');
    const cancelReplyButton = document.getElementById('cancel-reply');

    if (!postSlug || !commentsList || !commentForm) return;

    // --- ユーティリティ関数 ---

    /**
     * ISO形式の日付文字列を日本のロケールに合わせた読みやすい形式に変換する。
     * @param {string} dateString - ISO 8601形式の日付文字列。
     * @returns {string} - フォーマットされた日付文字列 (例: 2023年8月21日 14:30)。
     */
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('ja-JP', options);
    };

    /**
     * XSS (クロスサイトスクリプティング) を防ぐため、HTML特殊文字をエスケープする。
     * @param {string} str - エスケープ対象の文字列。
     * @returns {string} - 安全なHTML文字列。
     */
    const escapeHTML = (str) => {
        if (!str) return '';
        return str.replace(/[&<>()"'\/]/g, (match) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;' // スラッシュもエスケープして安全性を高める
        }[match]));
    };

    // --- コメントデータの処理 ---

    /**
     * フラットなコメントリストを、返信関係に基づいたツリー構造に変換する。
     * 計算量をO(N)に抑えるため、Mapを使用している。
     * @param {Array<Object>} comments - APIから取得したコメントの配列。
     * @returns {Array<Object>} - ツリー構造化されたコメントの配列。
     */
    const buildCommentTree = (comments) => {
        const commentMap = new Map(comments.map(c => [c.id, { ...c, children: [] }]));
        const tree = [];
        for (const comment of commentMap.values()) {
            if (comment.parent_id && commentMap.has(comment.parent_id)) {
                // 親コメントが存在すれば、そのchildren配列に追加
                commentMap.get(comment.parent_id).children.push(comment);
            } else {
                // 親がいないコメントはルートレベルのコメントとしてtreeに追加
                tree.push(comment);
            }
        }
        return tree;
    };

    /**
     * ツリー構造化されたコメントデータを再帰的にHTMLとしてレンダリングする。
     * @param {Array<Object>} comments - 表示するコメントのツリー配列。
     * @param {HTMLElement} container - コメントを描画する親コンテナ要素。
     */
    const renderComments = (comments, container) => {
        comments.forEach(comment => {
            const isAdmin = comment.is_admin;
            const commentEl = document.createElement('div');
            commentEl.className = 'comment';
            commentEl.id = `comment-${comment.id}`;

            const adminBadge = isAdmin ? '<span class="admin-badge">管理人</span>' : '';

commentEl.innerHTML = `
                <div class="comment-header">
                    <strong>${escapeHTML(comment.author)} ${adminBadge}</strong>
                    <time>${formatDate(comment.created_at)}</time>
                </div>
                <p>${escapeHTML(comment.body).replace(/\n/g, '<br>')}</p>
                <div class="comment-footer">
                  <button class="reply-btn" data-comment-id="${comment.id}" data-comment-author="${escapeHTML(comment.author)}">返信する</button>
                </div>
            `;
            // 子コメント（返信）があれば、再帰的にレンダリング
            if (comment.children.length > 0) {
                const repliesContainer = document.createElement('div');
                repliesContainer.className = 'comment-replies';
                renderComments(comment.children, repliesContainer);
                commentEl.appendChild(repliesContainer);
            }
            container.appendChild(commentEl);
        });
    };

    /**
     * APIからコメントデータを非同期で取得し、表示を更新する。
     */
    const fetchComments = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/comments?slug=${postSlug}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const comments = await response.json();
            const commentTree = buildCommentTree(comments);

            commentsList.innerHTML = ''; // 表示を初期化
            if (commentTree.length > 0) {
                renderComments(commentTree, commentsList);
            } else {
                commentsList.innerHTML = '<p>まだコメントはありません。</p>';
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
            commentsList.innerHTML = '<p>コメントの読み込みに失敗しました。</p>';
        }
    };

    // --- イベントリスナーの設定 ---

    // コメント投稿フォームのsubmitイベント
    commentForm.addEventListener('submit', (e) => {
        e.preventDefault(); // デフォルトのフォーム送信をキャンセル
        if (submitButton) submitButton.disabled = true;
        if (statusMessage) statusMessage.textContent = '送信中...';

        // reCAPTCHA v3の実行
        grecaptcha.ready(() => {
            grecaptcha.execute('6Lc1k6wrAAAAALRpeHnSCRriq5SEO2yAahUufY1T', { action: 'submit' }).then(async (token) => {
                const formData = new FormData(commentForm);
                const data = {
                    author: formData.get('author'),
                    body: formData.get('body'),
                    slug: postSlug,
                    honeypot: formData.get('username'), // スパム対策のハニーポット
                    token: token, // reCAPTCHAトークン
                    parent_id: formData.get('parent_id')
                };

                try {
                    const response = await fetch(`${API_BASE_URL}/comments`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                        credentials: 'include' // 管理人判定のため、Cookieを送信する
                    });
                    const responseData = await response.json();
                    if (!response.ok) {
                        throw new Error(responseData.error || 'Failed to submit comment');
                    }
                    if (statusMessage) {
                        statusMessage.textContent = 'コメントが投稿されました！';
                        statusMessage.style.color = 'var(--accent-color-primary)';
                    }
                    commentForm.reset(); // フォームをリセット
                    // 返信状態を解除
                    if (parentIdInput) parentIdInput.value = '';
                    if (replyIndicator) replyIndicator.style.display = 'none';
                    if (cancelReplyButton) cancelReplyButton.style.display = 'none';
                    fetchComments(); // コメントリストを再読み込みして更新
                } catch (error) {
                    console.error('Error submitting comment:', error);
                    if (statusMessage) {
                        statusMessage.textContent = `エラー: ${error.message}`;
                        statusMessage.style.color = 'var(--danger-color)';
                    }
                } finally {
                    if (submitButton) submitButton.disabled = false;
                    if (statusMessage) setTimeout(() => { statusMessage.textContent = ''; }, 5000);
                }
            });
        });
    });

    // コメントリスト内のクリックイベント（イベント委譲）
    commentsList.addEventListener('click', (e) => {
        // クリックされたのが「返信する」ボタンの場合
        if (e.target.classList.contains('reply-btn')) {
            const commentId = e.target.dataset.commentId;
            const commentAuthor = e.target.dataset.commentAuthor;

            // フォームに返信先IDを設定し、インジケータを表示
            if (parentIdInput) parentIdInput.value = commentId;
            if (replyIndicator) {
                replyIndicator.textContent = `${commentAuthor}さんへ返信中...`;
                replyIndicator.style.display = 'inline';
            }
            if (cancelReplyButton) cancelReplyButton.style.display = 'inline-block';

            // フォームが見える位置までスクロール
            commentForm.scrollIntoView({ behavior: 'smooth' });
        }
    });

    // 「返信をキャンセル」ボタンのクリックイベント
    if (cancelReplyButton) {
        cancelReplyButton.addEventListener('click', () => {
            if (parentIdInput) parentIdInput.value = '';
            if (replyIndicator) replyIndicator.style.display = 'none';
            cancelReplyButton.style.display = 'none';
        });
    }

    // --- 外部スクリプトの読み込み ---

    // reCAPTCHAのスクリプトがまだ読み込まれていなければ、動的に追加する
    if (!document.querySelector('script[src^="https://www.google.com/recaptcha/api.js"]')) {
        const recaptchaScript = document.createElement('script');
        recaptchaScript.src = 'https://www.google.com/recaptcha/api.js?render=6Lc1k6wrAAAAALRpeHnSCRriq5SEO2yAahUufY1T';
        document.head.appendChild(recaptchaScript);
    }

    // --- 初期化処理 ---
    fetchComments();
});
