/**
 * @file archive.js
 * @description
 *  アーカイブページの動的なフィルタリング機能を提供する。
 *  URLのクエリパラメータ (?year=...&month=...&date=...) を解釈し、
 *  /search.json から取得した全記事データの中から該当する記事を絞り込んで表示する。
 *  サーバーサイドでのページ生成なしに、クライアントサイドで高速なフィルタリングを実現するのが目的である。
 */
document.addEventListener('DOMContentLoaded', () => {
  // --- DOM要素の取得 ---
  const container = document.getElementById('posts-container');
  const paginationEl = document.getElementById('pagination-container');
  const archiveInfoEl = document.getElementById('archive-info');
  const archiveTitleEl = document.getElementById('archive-title');

  // 必要なDOM要素がなければ処理を中断
  if (!container) return;

  /**
   * 絞り込まれた記事リストをHTMLとしてレンダリングする関数。
   * @param {Array<Object>} posts - 表示する記事オブジェクトの配列。
   */
  const renderPosts = (posts) => {
    container.innerHTML = ''; // コンテナを初期化
    if (posts.length > 0) {
      posts.forEach(post => {
        const article = document.createElement('article');
        article.className = 'post-entry';
        // 記事データを元にHTML文字列を生成
        article.innerHTML = `
          <h2><a href="${post.RelPermalink}">${post.LinkTitle}</a></h2>
          <div class="post-meta">
            <time datetime="${post.Date}">公開日: ${post.FormattedDate}</time>
          </div>
          <p>${post.Summary || ''}</p>
        `;
        container.appendChild(article);
      });
    } else {
      container.innerHTML = '<p>該当する記事はありません。</p>';
    }
  };

  /**
   * URLクエリパラメータに基づいて記事をフィルタリングする関数。
   * @param {Array<Object>} posts - 全記事の配列。
   * @param {URLSearchParams} params - URLのクエリパラメータ。
   * @returns {Array<Object>|null} - フィルタリングされた記事の配列。フィルタが不要な場合はnullを返す。
   */
  const filterPosts = (posts, params) => {
    const date = params.get('date');
    const year = params.get('year');
    const month = params.get('month');

    let filteredPosts = [];
    let infoText = '';

    if (date) {
      // 日付指定の場合 (e.g., 2023-08-21)
      const [y, m, d] = date.split('-');
      infoText = `<h2>${y}年${m}月${d}日の記事</h2>`;
      filteredPosts = posts.filter(post => post.Date.startsWith(date));
    } else if (year && month) {
      // 年月指定の場合 (e.g., 2023-08)
      const datePrefix = `${year}-${month.padStart(2, '0')}`;
      infoText = `<h2>${year}年${month}月の記事</h2>`;
      filteredPosts = posts.filter(post => post.Date.startsWith(datePrefix));
    } else if (year) {
      // 年指定の場合 (e.g., 2023)
      const datePrefix = `${year}`;
      infoText = `<h2>${year}年の記事</h2>`;
      filteredPosts = posts.filter(post => post.Date.startsWith(datePrefix));
    } else {
      // フィルタリング条件がURLにない場合は何もしない
      return null;
    }

    // フィルタリング結果の情報をヘッダーに表示
    if (archiveInfoEl) archiveInfoEl.innerHTML = infoText;
    // 元のタイトルとページネーションは不要なため非表示にする
    if (archiveTitleEl) archiveTitleEl.style.display = 'none';
    if (paginationEl) paginationEl.innerHTML = '';

    return filteredPosts;
  };

  /**
   * アーカイブ機能の初期化を行う非同期関数。
   */
  const initArchive = async () => {
    const params = new URLSearchParams(window.location.search);
    
    // クエリパラメータに 'date' または 'year' が存在する場合のみ、フィルタリング処理を実行
    if (params.has('date') || params.has('year')) {
      try {
        // 全記事のデータをJSONファイルから取得
        const response = await fetch('/search.json');
        if (!response.ok) throw new Error('Network response was not ok.');
        
        const allPosts = await response.json();
        const filteredPosts = filterPosts(allPosts, params);

        // フィルタリングされた記事があればレンダリング
        if (filteredPosts) {
          renderPosts(filteredPosts);
        }
      } catch (e) {
        console.error('Error processing archive data:', e);
        if (container) container.innerHTML = '<p>記事の読み込み中にエラーが発生しました。</p>';
      }
    }
  };

  // 初期化関数を実行
  initArchive();
});
