/**
 * @file calendar.js
 * @description
 *  投稿データに基づいてインタラクティブなカレンダーを生成する。
 *  /layouts/_partials/monthly-archive.html で埋め込まれたJSONデータを元に、
 *  記事が投稿された日付にアーカイブページへのリンクを持つカレンダーを表示する。
 *  効率的なDOM更新とイベント委譲を用いて、パフォーマンスを最適化している。
 */
document.addEventListener('DOMContentLoaded', () => {
  // --- DOM要素と設定の取得 ---
  const calendarContainer = document.getElementById('calendar');
  if (!calendarContainer) return;

  const eventsDataEl = document.getElementById('calendar-events');
  const configEl = document.getElementById('calendar-config');
  if (!eventsDataEl || !configEl) return;

  // --- 初期データの準備 ---
  let events = [];
  let config = {};
  try {
    // HTMLに埋め込まれたJSONをパースする。データがない場合は空の配列/オブジェクトを使用する。
    events = JSON.parse(eventsDataEl.textContent || '[]');
    config = JSON.parse(configEl.textContent || '{}');
  } catch (e) {
    console.error("Failed to parse calendar JSON:", e);
    return;
  }

  // 日付をキーとするMapを作成し、イベント検索を高速化する。
  const eventMap = new Map(events.map(e => [e.date, e]));
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 時刻をリセットして日付のみで比較できるようにする

  // カレンダーの現在の年・月を保持する状態オブジェクト
  const state = {
    year: today.getFullYear(),
    month: today.getMonth(),
  };

  /**
   * 汎用的なリンク要素を生成するヘルパー関数。
   * @param {string} text - リンクのテキスト。
   * @param {string} href - リンクのURL。
   * @param {string} baseClass - 適用するCSSクラス。
   * @returns {HTMLAnchorElement} - 生成されたa要素。
   */
  const createLink = (text, href, baseClass) => {
    const link = document.createElement('a');
    link.href = href;
    link.className = baseClass;
    link.textContent = text;
    return link;
  };

  /**
   * カレンダーのヘッダー（年月セレクタ、ナビゲーションボタン）を初回のみレンダリングする。
   * この部分は年月が変更されても再生成されない。
   */
  const renderHeader = () => {
    const startYear = config.startYear ? parseInt(config.startYear, 10) : today.getFullYear();
    const endYear = config.endYear ? parseInt(config.endYear, 10) : today.getFullYear();

    // 年セレクタを生成
    const yearSelect = document.createElement('select');
    yearSelect.id = 'calendar-year-select';
    for (let y = endYear; y >= startYear; y--) {
      const option = new Option(y, y);
      if (y === state.year) option.selected = true;
      yearSelect.add(option);
    }

    // 月セレクタを生成
    const monthSelect = document.createElement('select');
    monthSelect.id = 'calendar-month-select';
    for (let m = 0; m < 12; m++) {
      const option = new Option(String(m + 1).padStart(2, '0'), m);
      if (m === state.month) option.selected = true;
      monthSelect.add(option);
    }

    // ヘッダー全体のHTML構造を定義
    const headerHtml = `
      <div class="calendar-header-row">
        ${yearSelect.outerHTML}
        <a href="/blog/archive?year=${state.year}" id="calendar-year-link" class="button-link-header">年</a>
      </div>
      <div class="calendar-header-row">
        <button id="prev-month">&lt;</button>
        ${monthSelect.outerHTML}
        <a href="/blog/archive?year=${state.year}&month=${String(state.month + 1).padStart(2, '0')}" id="calendar-month-link" class="button-link-header">月</a>
        <button id="next-month">&gt;</button>
      </div>
    `;

    // テーブルの骨格を定義（中身のtbodyは renderBody で動的に生成）
    const tableHtml = `
      <table class="calendar-table" style="margin-top: 1rem;">
        <thead>
          <tr>
            <th class="is-sunday">日</th><th>月</th><th>火</th><th>水</th><th>木</th><th>金</th><th>土</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    `;

    calendarContainer.innerHTML = headerHtml + tableHtml;
  };

  /**
   * カレンダーのボディ（日付部分）をレンダリングする。
   * stateオブジェクトに基づいて、指定された年月のカレンダーを生成する。
   */
  const renderBody = () => {
    const tbody = calendarContainer.querySelector('tbody');
    if (!tbody) return;

    const firstDay = new Date(state.year, state.month, 1).getDay(); // 月の最初の日の曜日
    const daysInMonth = new Date(state.year, state.month + 1, 0).getDate(); // 月の日数
    
    tbody.innerHTML = '';
    let dateCounter = 1;
    let tr = document.createElement('tr');

    // 1日の前の空セルを生成
    for (let i = 0; i < firstDay; i++) {
      tr.appendChild(document.createElement('td'));
    }

    // 1日から月最終日までセルを生成
    while (dateCounter <= daysInMonth) {
      const dayOfWeek = new Date(state.year, state.month, dateCounter).getDay();
      // 日曜日かつ行が空でなければ、新しい行を開始
      if (dayOfWeek === 0 && tr.children.length > 0) {
        tbody.appendChild(tr);
        tr = document.createElement('tr');
      }

      const td = document.createElement('td');
      const currentDateObj = new Date(state.year, state.month, dateCounter);
      currentDateObj.setHours(0, 0, 0, 0);

      // CSSクラスの適用
      if (dayOfWeek === 0) td.classList.add('is-sunday');
      if (currentDateObj.getTime() === today.getTime()) td.classList.add('is-today');
      if (currentDateObj > today) td.classList.add('is-future');

      // イベント（投稿）があるかチェック
      const dayStr = `${state.year}-${String(state.month + 1).padStart(2, '0')}-${String(dateCounter).padStart(2, '0')}`;
      const event = eventMap.get(dayStr);

      if (event && currentDateObj <= today) {
        // イベントがあればリンク付きの日付を生成
        td.appendChild(createLink(dateCounter, event.url, ''));
      } else {
        td.textContent = dateCounter;
      }
      
      tr.appendChild(td);
      dateCounter++;
    }

    // 最終週の残りの空セルを生成
    while (tr.children.length < 7) {
      tr.appendChild(document.createElement('td'));
    }
    tbody.appendChild(tr);
  };

  /**
   * ヘッダーの「年」「月」アーカイブリンクのURLを現在のstateに基づいて更新する。
   */
  const updateLinks = () => {
    const yearLink = document.getElementById('calendar-year-link');
    const monthLink = document.getElementById('calendar-month-link');
    if (yearLink) yearLink.href = `/blog/archive?year=${state.year}`;
    if (monthLink) monthLink.href = `/blog/archive?year=${state.year}&month=${String(state.month + 1).padStart(2, '0')}`;
  };

  /**
   * カレンダーの表示を更新する（ボディの再描画とリンクの更新）。
   */
  const updateCalendar = () => {
    renderBody();
    updateLinks();
  };

  // --- イベントリスナーの設定（イベント委譲） ---
  // カレンダーコンテナ自身にリスナーを設定し、中の要素で発生したイベントを補足する。
  // これにより、中身が再描画されてもリスナーを再設定する必要がなくなる。
  calendarContainer.addEventListener('click', (e) => {
    const targetId = e.target.id;
    if (targetId === 'prev-month') {
      state.month--;
      if (state.month < 0) { // 1月より前 -> 前年の12月
        state.month = 11;
        state.year--;
      }
      document.getElementById('calendar-year-select').value = state.year;
      document.getElementById('calendar-month-select').value = state.month;
      updateCalendar();
    } else if (targetId === 'next-month') {
      state.month++;
      if (state.month > 11) { // 12月より後 -> 次の年の1月
        state.month = 0;
        state.year++;
      }
      document.getElementById('calendar-year-select').value = state.year;
      document.getElementById('calendar-month-select').value = state.month;
      updateCalendar();
    }
  });

  calendarContainer.addEventListener('change', (e) => {
    const targetId = e.target.id;
    if (targetId === 'calendar-year-select') {
      state.year = parseInt(e.target.value, 10);
      updateCalendar();
    } else if (targetId === 'calendar-month-select') {
      state.month = parseInt(e.target.value, 10);
      updateCalendar();
    }
  });

  // --- 初期化処理 ---
  renderHeader();
  renderBody();
});
