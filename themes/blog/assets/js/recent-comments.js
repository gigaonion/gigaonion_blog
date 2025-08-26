/**
 * @file recent-comments.js
 * @description
 *  「最新のコメント」ウィジェットの機能を提供する。
 *  APIから最新のコメントデータを取得し、同時にサイトの全記事情報（search.json）も取得する。
 *  この2つの情報をクライアントサイドで結合し、各コメントがどの記事へのものかを示した
 *  リンク付きのリストを生成して表示する。
 */
document.addEventListener('DOMContentLoaded', () => {
    const recentCommentsList = document.getElementById('recent-comments-list');
    if (!recentCommentsList) return;

    // --- APIエンドポイントとデータソースURL ---
    const API_BASE_URL = 'https://api.gigaonion.com/blog';
    const commentsApiUrl = `${API_BASE_URL}/comments/recent`;
    const searchDataUrl = '/search.json';

    /**
     * 最新コメントのデータを非同期で取得し、表示を更新する。
     */
    const fetchRecentComments = async () => {
        try {
            // コメントデータと記事情報の両方を並行して取得し、効率化を図る
            const [commentsResponse, searchResponse] = await Promise.all([
                fetch(commentsApiUrl),
                fetch(searchDataUrl)
            ]);

            if (!commentsResponse.ok) throw new Error('Failed to fetch recent comments');
            if (!searchResponse.ok) throw new Error('Failed to fetch search data');

            const comments = await commentsResponse.json();
            const searchData = await searchResponse.json();

            // 記事のスラグをキーとしたMapを作成し、コメントと記事のマッチングを高速化する
            const postDataMap = new Map(searchData.map(post => [post.slug, { title: post.title, url: post.url }]));

            recentCommentsList.innerHTML = ''; // 「読み込み中...」の表示をクリア

            if (comments.length === 0) {
                recentCommentsList.innerHTML = '<li>まだコメントはありません。</li>';
                return;
            }

            // 取得した各コメントを処理し、リスト項目を生成
            comments.forEach(comment => {
                const post = postDataMap.get(comment.post_slug);
                if (post) {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    // コメントへのアンカーリンク付きのURLを生成
                    a.href = `${post.url}#comment-${comment.id}`;

                    // コメント本文が長すぎる場合は20文字で切り詰める
                    const truncatedBody = comment.body.length > 20 ? `${comment.body.substring(0, 20)}...` : comment.body;

                    a.innerHTML = `<span class="comment-body">「${truncatedBody}」</span> <span class="comment-meta">on ${post.title}</span>`;
                    li.appendChild(a);
                    recentCommentsList.appendChild(li);
                }
            });

        } catch (error) {
            console.error('Error fetching recent comments:', error);
            recentCommentsList.innerHTML = '<li>コメントの読み込みに失敗しました。</li>';
        }
    };

    // 初期化処理
    fetchRecentComments();
});
