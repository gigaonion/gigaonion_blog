/**
 * @file search.js
 * @description
 *  サイト内の記事を対象としたリアルタイム検索機能を提供する。
 *  ページの読み込み時に全記事のインデックスデータ（/search.json）を一度だけ取得し、
 *  ユーザーが検索ボックスに入力するたびに、クライアントサイドで高速なフィルタリングを実行する。
 *  検索対象は記事の「タイトル」と「タグ」である。
 */
document.addEventListener('DOMContentLoaded', () => {
  // --- DOM要素の取得 ---
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');

  if (!searchInput || !searchResults) return;

  // 取得した検索データを保持するキャッシュ変数
  let searchData = [];

  /**
   * /search.json から検索データを非同期で取得し、キャッシュに格納する。
   * 取得後は検索ボックスを有効化する。
   */
  const fetchSearchData = async () => {
    try {
      const response = await fetch('/search.json');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      searchData = await response.json();
      searchInput.disabled = false;
      searchInput.placeholder = 'タイトルまたはタグを入力';
    } catch (error) {
      console.error('Error fetching search data:', error);
      searchInput.placeholder = '検索が利用できません';
      searchInput.disabled = true;
    }
  };

  /**
   * 指定されたクエリに基づいて検索を実行し、結果をHTMLとしてレンダリングする。
   * @param {string} query - ユーザーが入力した検索クエリ。
   */
  const performSearch = (query) => {
    searchResults.innerHTML = '';

    // クエリが空の場合は結果を表示しない
    if (query.length < 1) {
      return;
    }

    const queryLower = query.toLowerCase(); // 検索クエリを小文字に変換して、大文字小文字を区別しないようにする
    
    // フィルタリング処理
    const results = searchData.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(queryLower);
      const tagsMatch = Array.isArray(item.tags) && item.tags.some(tag => tag.toLowerCase().includes(queryLower));
      return titleMatch || tagsMatch; // タイトルまたはタグのいずれかに一致すれば対象とする
    });

    if (results.length > 0) {
      const ul = document.createElement('ul');
      // 検索結果が多すぎる場合を考慮し、最初の10件のみ表示する
      results.slice(0, 10).forEach(item => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = item.url;
        a.textContent = item.title;
        li.appendChild(a);
        ul.appendChild(li);
      });
      searchResults.appendChild(ul);
    } else {
      searchResults.innerHTML = '<p>結果なし</p>';
    }
  };

  // --- イベントリスナーの設定 ---

  // 検索ボックスのinputイベントにリスナーを設定し、入力のたびに検索を実行する
  searchInput.addEventListener('input', (event) => {
    performSearch(event.target.value);
  });

  // --- 初期化処理 ---
  fetchSearchData();
});
