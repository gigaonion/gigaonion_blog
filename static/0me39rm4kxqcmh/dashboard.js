document.addEventListener('DOMContentLoaded', async () => {
    const dashboard = document.getElementById('comments-dashboard');
    const apiUrl = 'https://api.gigaonion.com/blog/admin/comments';

    const fetchAdminComments = async () => {
        try {
            // credentials: 'include' を追加して認証Cookieを送信する
            const response = await fetch(apiUrl, { credentials: 'include' });
            if (response.status === 401) {
                window.location.href = '/0me39rm4kxqcm/index.html'; // 未認証ならログインページへ
                return;
            }
            if (!response.ok) throw new Error('Failed to fetch comments');
            
            const comments = await response.json();
            renderDashboard(comments);

        } catch (error) {
            dashboard.innerHTML = `<p>エラー: ${error.message}</p>`;
        }
    };

    const renderDashboard = (comments) => {
        if (comments.length === 0) {
            dashboard.innerHTML = '<p>コメントはまだありません。</p>';
            return;
        }

        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>投稿者</th>
                    <th>コメント</th>
                    <th>記事Slug</th>
                    <th>状態</th>
                    <th>投稿日時</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                ${comments.map(c => `
                    <tr id="comment-row-${c.id}">
                        <td>${c.id}</td>
                        <td>${escapeHTML(c.author)}${c.is_admin ? ' (管理人)' : ''}</td>
                        <td>${escapeHTML(c.body)}</td>
                        <td>${escapeHTML(c.post_slug)}</td>
                        <td>${c.is_approved ? '承認済み' : '未承認'}</td>
                        <td>${new Date(c.created_at).toLocaleString('ja-JP')}</td>
                        <td class="actions">
                            <button class="delete-btn" data-id="${c.id}">削除</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        dashboard.innerHTML = '';
        dashboard.appendChild(table);
    };
    
    dashboard.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const commentId = e.target.dataset.id;
            if (!confirm(`コメントID: ${commentId} を本当に削除しますか？`)) return;

            try {
                // こちらのfetchにも credentials: 'include' を追加
                const response = await fetch(`${apiUrl}/${commentId}`, { 
                    method: 'DELETE',
                    credentials: 'include'
                });
                if (!response.ok) throw new Error('削除に失敗しました');
                document.getElementById(`comment-row-${commentId}`).remove();
            } catch (error) {
                alert(`エラー: ${error.message}`);
            }
        }
    });

    const escapeHTML = (str) => {
        if (!str) return '';
        return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]);
    };

    fetchAdminComments();
});
