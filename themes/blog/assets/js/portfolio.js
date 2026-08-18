/**
 * @file portfolio.js
 * @description
 *  ポートフォリオページのアニメーション(タイピングの演出など)を定義する．
 *  また，このページはテンプレートを使用しないので，アクセスカウンタも独自に実装している．
 *  最初にクエリパラメタを読み込み，初期で表示するページを指定する．
 *  注:command-outputでの出力は，スペース，改行をそのまま出力するのでレイアウト崩れが起こる．
 */
document.addEventListener('DOMContentLoaded', async () => {
  // --- Elements ---
  const term = document.getElementById('terminal');
  const bootSeq = document.getElementById('boot-sequence');
  const mainContent = document.getElementById('main-content');
  const templateBio = document.getElementById('template-bio').innerHTML;
  const templateLinks = document.getElementById('template-links').innerHTML;
  const counterDisplay = document.getElementById('counter-display');
  
  // --- State ---
  let isProcessing = false;

  // --- Access Counter ---
  const API_BASE_URL = 'https://api.gigaonion.com/blog';
  const fetchCounter = async () => {
      try {
          const response = await fetch(`${API_BASE_URL}/counter/`, { method: 'POST' });
          if (!response.ok) throw new Error('Network response was not ok');
          const data = await response.json();
          const total = String(data.total).padStart(6, '0');
          const today = String(data.today).padStart(4, '0');
          counterDisplay.textContent = `TOTAL: ${total} | TODAY: ${today}`;
      } catch (error) {
          console.error('Failed to fetch counter:', error);
          counterDisplay.textContent = "VISITORS: [OFFLINE]";
      }
  };
  fetchCounter();

  // --- Utils ---
  const delay = ms => new Promise(res => setTimeout(res, ms));
  const scrollToBottom = () => { term.scrollTop = term.scrollHeight; };

  // タイピングアニメーション関数
  const typeText = async (element, text, speed = 20) => {
    for (let char of text) {
      element.textContent += char;
      await delay(speed);
      scrollToBottom();
    }
  };

  const executeCommand = async (commandName, actionType, payload, target = null, typeSpeed = 20) => {
      if (isProcessing) return;
      isProcessing = true;

      const cmdLog = document.createElement('div');
      cmdLog.className = "prompt";
      cmdLog.innerHTML = `<span class="prompt-text">guest@gigaonion:~$</span> <span class="typing-area"></span><span class="cursor"></span>`;
      mainContent.appendChild(cmdLog);
      scrollToBottom();

      const typingArea = cmdLog.querySelector('.typing-area');
      await typeText(typingArea, commandName, typeSpeed);
      
      await delay(40);
      cmdLog.querySelector('.cursor').remove();
      if (actionType === 'html') {
          const outputDiv = document.createElement('div');
          outputDiv.className = 'command-output fade-in';
          outputDiv.innerHTML = payload;
          mainContent.appendChild(outputDiv);
          // コマンド行が上に来るようスクロール
          cmdLog.scrollIntoView({ behavior: 'smooth', block: 'start' });

          await delay(60);
          
          const readyMsg = document.createElement('div');
          readyMsg.className = 'prompt';
          readyMsg.style.color = '#555';
          readyMsg.innerHTML = '> AWAITING SELECTION...';
          mainContent.appendChild(readyMsg);
          
          isProcessing = false;

      } else if (actionType === 'link') {
          await delay(70);
          const redirectMsg = document.createElement('div');
          redirectMsg.className = 'command-output';
          redirectMsg.textContent = `> Redirecting to ${payload}...`;
          mainContent.appendChild(redirectMsg);
          scrollToBottom();
          
          await delay(80);
          
          if (target === '_blank') {
              window.open(payload, '_blank');
              isProcessing = false;
              const readyMsg = document.createElement('div');
              readyMsg.className = 'prompt';
              readyMsg.style.color = '#555';
              readyMsg.innerHTML = '> AWAITING SELECTION...';
              mainContent.appendChild(readyMsg);
              scrollToBottom();
          } else {
              window.location.href = payload;
          }
      }
  };

  const bootMessages = [
    "Initializing GigaOnion Kernel v1.0.1...",
    "Loading modules: [ cpu mem net io video ]... OK",
    "Mounting filesystems... OK",
    "Checking network interfaces... eth0 up",
    "Starting SSH daemon... OK",
    "Establishing secure connection... OK",
    "Welcome to GigaOnion!",
    " "
  ];

  for (let msg of bootMessages) {
      const p = document.createElement('div');
      bootSeq.appendChild(p);
      p.textContent = msg;
      await delay(Math.random() * 50 + 10);
      scrollToBottom();
  }

  await delay(10);
  mainContent.classList.remove('hidden');
  
  const urlParams = new URLSearchParams(window.location.search);
  const sectionParam = urlParams.get('section');
  let initialCmdText = "gigaonion --help";
  let initialOutputContent = 'Choose links below.';

  if (sectionParam === 'network') {
      initialCmdText = "./links.sh";
      initialOutputContent = templateLinks;
  }
  
  const initialCmd = document.createElement('div');
  initialCmd.className = "prompt";
  initialCmd.innerHTML = `<span class="prompt-text">guest@gigaonion:~$</span> <span id="auto-type"></span><span class="cursor"></span>`;
  mainContent.appendChild(initialCmd);
  
  const autoTypeSpan = document.getElementById('auto-type');
  await typeText(autoTypeSpan, initialCmdText, 20);
  
  await delay(10);
  initialCmd.querySelector('.cursor').remove();
  
  const Output = document.createElement('div');
  Output.className = 'command-output fade-in';
  Output.innerHTML = initialOutputContent;
  mainContent.appendChild(Output);
  
  // Show Menu
  const menuList = document.createElement('div');
  menuList.className = 'command-output';
  menuList.innerHTML = `
> ACCESS GRANTED.
> PLEASE SELECT A FUNCTION:

[ <a href="#" id="cmd-bio">BIO</a> ]         :: 私について
[ <a href="/blog/">BLOG</a> ]        :: ブログを読む
[ <a href="#" id="cmd-links">LINKs</a> ]       :: 相互リンク
[ <a href="https://github.com/gigaonion" target="_blank">GITHUB</a> ]      :: Github
[ <a href="https://x.com/gigaonion" target="_blank">TWITTER</a> ]     :: Twitter
`;
  mainContent.appendChild(menuList);
  
  const standbyMsg = document.createElement('div');
  standbyMsg.className = 'prompt';
  standbyMsg.style.color = '#33ff00';
  standbyMsg.innerHTML = '> SYSTEM READY.';
  mainContent.appendChild(standbyMsg);
  

  document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;

      if (link.id === 'cmd-bio') {
          e.preventDefault();
          executeCommand('cat portfolio.txt', 'html', templateBio);
          return;
      }

      if (link.id === 'cmd-links') {
          e.preventDefault();
          executeCommand('./links.sh', 'html', templateLinks);
          return;
      }

      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

      e.preventDefault();
      
      let cmdName = '';
      const target = link.getAttribute('target');
      typeSpeed = 20;
      if (target === '_blank') {
          cmdName = `curl ${href}`;
      } else {
          let path = href;
          if (path.startsWith('http')) {
              typeSpeed = 15;
              cmdName = `curl ${path}`;
          } else {
              cmdName = `cd ${path}`;
              typeSpeed = 30;
            console.log(typeSpeed);
          }
      }

      executeCommand(cmdName, 'link', href, target, typeSpeed);
  });
});
