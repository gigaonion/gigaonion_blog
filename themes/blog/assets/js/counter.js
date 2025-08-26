/**
 * @file counter.js
 * @description
 *  サイトのアクセスカウンター機能を提供する。
 *  APIエンドポイントにPOSTリクエストを送信してカウントアップと現在値の取得を行い、
 *  取得した数値を7桁のデジタル数字風にフォーマットして表示する。
 *  また、APIからキリ番（特定の記念となる番号）であるというフラグが返された場合、
 *  特別なCSSクラスを付与して見た目を変更する。
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素と設定の取得 ---
    const API_BASE_URL = 'https://api.gigaonion.com/blog';
    const counterContainer = document.getElementById('retro-counter-container');
    const counterElement = document.getElementById('retro-counter');

    if (!counterContainer || !counterElement) {
        return; // 必要な要素がなければ処理を終了
    }

    /**
     * 指定された数値を7桁の文字列にフォーマットし、各桁を個別のspan要素として表示する。
     * @param {number|string} count - 表示するカウント数または'ERROR'などの文字列。
     */
    const displayCount = (count) => {
        // カウント数を7桁に固定し、足りない部分は0で埋める (e.g., 123 -> "0000123")
        const countString = String(count).padStart(7, '0');
        counterElement.innerHTML = ''; // 既存の数字をクリア

        // 文字列を1文字ずつに分割し、それぞれをspan要素で囲む
        for (const digit of countString) {
            const digitSpan = document.createElement('span');
            digitSpan.className = 'digit';
            digitSpan.textContent = digit;
            counterElement.appendChild(digitSpan);
        }
    };

    /**
     * APIサーバーからカウンターのデータを非同期で取得し、表示を更新する。
     */
    const fetchCounter = async () => {
        try {
            // APIにPOSTリクエストを送信してカウンターをインクリメントし、最新の値を取得
            const response = await fetch(`${API_BASE_URL}/counter/`, { method: 'POST' });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            if (data.count) {
                displayCount(data.count);
                // キリ番フラグがtrueの場合、特別なCSSクラスをコンテナに追加
                if (data.isKiriban) {
                    counterContainer.classList.add('is-kiriban');
                }
            }
        } catch (error) {
            console.error('Failed to fetch access counter:', error);
            // エラーが発生した場合は、カウンターに'ERROR'と表示
            displayCount('ERROR');
        }
    };

    // 初期化処理
    fetchCounter();
});
