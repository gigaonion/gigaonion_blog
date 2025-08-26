/**
 * @file code-copy.js
 * @description
 * コードブロックにコピーボタンを追加し、クリックで内容をクリップボードにコピーする機能。
 */
function createCopyButton(highlightDiv) {
  const button = document.createElement("button");
  button.className = "copy-code-button";
  button.innerText = "Copy";
  button.addEventListener("click", () => copyCodeToClipboard(button, highlightDiv));
  highlightDiv.appendChild(button);
}
async function copyCodeToClipboard(button, highlightDiv) {
  // 修正箇所: セレクタをより汎用的なものに変更
  const codeElement = highlightDiv.querySelector("code[data-lang]");
  if (!codeElement) return; // 対象のコード要素が見つからなければ何もしない

  // replace処理は不要な場合が多いため、innerTextを直接取得
  const codeToCopy = codeElement.innerText;
  
  await navigator.clipboard.writeText(codeToCopy).then (() => {
    button.blur();
    button.innerText = "Copied!";
    setTimeout(function() {
      button.innerText = "Copy";
    }, 2000);
  });
}
document.querySelectorAll(".highlight")
  .forEach(highlightDiv => createCopyButton(highlightDiv));
