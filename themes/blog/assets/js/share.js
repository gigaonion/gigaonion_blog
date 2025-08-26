/**
 * @file share.js
 * @description
 *  記事ページのSNS共有ボタンのインタラクティブな機能を提供する。
 *  分散型SNS（Mastodon, Misskey）については、ユーザーにインスタンスドメインを尋ねてから
 *  共有URLを生成する。また、ページのURLをクリップボードにコピーする機能も実装している。
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素の取得 ---
    const shareButtonsContainer = document.querySelector('.share-buttons');
    if (!shareButtonsContainer) return;

    const copyBtn = document.getElementById('copy-url-btn');
    const mastodonBtn = shareButtonsContainer.querySelector('.share-btn.mastodon');
    const misskeyBtn = shareButtonsContainer.querySelector('.share-btn.misskey');

    /**
     * 分散型SNSの共有URLを生成し、新しいタブで開く汎用関数。
     * @param {string} title - 共有するページのタイトル。
     * @param {string} url - 共有するページのURL。
     * @param {string} service - サービス名 ('Mastodon' or 'Misskey')。
     */
    const shareToInstance = (title, url, service) => {
        const instancePrompt = `あなたの${service}インスタンスのドメインを入力してください (例: ${service === 'Mastodon' ? 'mastodon.social' : 'misskey.io'})`;
        const instance = prompt(instancePrompt);
        // ユーザーがプロンプトをキャンセルしなかった場合のみ処理を続行
        if (instance) {
            const shareUrl = `https://${instance}/share?text=${encodeURIComponent(title + '\n' + url)}`;
            window.open(shareUrl, '_blank', 'noopener,noreferrer');
        }
    };

    // --- イベントリスナーの設定 ---

    // Mastodon共有ボタンのクリックイベント
    if (mastodonBtn) {
        mastodonBtn.addEventListener('click', (e) => {
            e.preventDefault(); // aタグのデフォルトの画面遷移をキャンセル
            const target = e.currentTarget;
            shareToInstance(target.dataset.title, target.dataset.url, 'Mastodon');
        });
    }

    // Misskey共有ボタンのクリックイベント
    if (misskeyBtn) {
        misskeyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.currentTarget;
            shareToInstance(target.dataset.title, target.dataset.url, 'Misskey');
        });
    }

    // URLコピーボタンのクリックイベント
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const notification = document.getElementById('copy-notification');
            const permalink = copyBtn.dataset.permalink;
            if (!permalink || !notification) return;

            // Clipboard APIを使用して非同期でURLをコピー
            navigator.clipboard.writeText(permalink).then(() => {
                // 成功時の処理
                notification.textContent = 'URLをコピーしました！';
                notification.classList.remove('error');
                notification.classList.add('show');
                setTimeout(() => notification.classList.remove('show'), 2000); // 2秒後に通知を消す
            }, () => {
                // 失敗時の処理
                notification.textContent = 'コピーに失敗しました';
                notification.classList.add('error', 'show');
                setTimeout(() => notification.classList.remove('show', 'error'), 2000);
            });
        });
    }
});