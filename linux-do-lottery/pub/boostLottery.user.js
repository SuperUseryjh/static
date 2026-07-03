// ==UserScript==
// @name         LINUX DO Boost 抽奖
// @namespace    https://github.com/linux-do-lottery
// @version      1.0.0
// @description  从 LINUX DO 话题选定楼层的 Boost 中随机抽取用户
// @author       YaoOnion
// @match        *://linux.do/t/*
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        GM_info
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      static.yaoonion.fun
// ==/UserScript==
// dist/constants.js
var TOGGLE_BTN_ID = "boostLotteryToggleBtn";
var PANEL_ID = "boostLotteryPanel";
var RESULT_ID = "boostLotteryResult";
var POST_LIST_ID = "boostLotteryPostList";
var LOCAL_STORAGE_POS_X = "boostLotteryToggleBtnPosX";
var LOCAL_STORAGE_POS_Y = "boostLotteryToggleBtnPosY";
var POST_SELECTOR = ".topic-post";
var POST_ARTICLE_SELECTOR = "article.onscreen-post";
var BOOST_LIST_SELECTOR = ".discourse-boosts__list";
var BOOST_BUBBLE_SELECTOR = ".discourse-boosts__bubble";
var BOOST_USER_SELECTOR = "a[data-user-card]";
var STATIC_BASE_URL = "https://static.yaoonion.fun/linux-do-lottery";
var LOCAL_STORAGE_LAST_CHECK_TIME = "boostLotteryLastUpdateCheck";
var UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1e3;
var PREVIEW_UPDATE_CHECK_INTERVAL = 1 * 60 * 60 * 1e3;

// dist/utils.js
function makeDraggable(element, handle) {
  let isDragging = false;
  let isMoved = false;
  let startX = 0;
  let startY = 0;
  let initialMouseX = 0;
  let initialMouseY = 0;
  let initialElementRight = 0;
  let initialElementTop = 0;
  handle.addEventListener("mousedown", (e) => {
    isDragging = true;
    isMoved = false;
    startX = e.clientX;
    startY = e.clientY;
    initialMouseX = e.clientX;
    initialMouseY = e.clientY;
    initialElementRight = parseFloat(element.style.right) || 0;
    initialElementTop = parseFloat(element.style.top) || 0;
    element.style.cursor = "grabbing";
  });
  document.addEventListener("mouseup", () => {
    isDragging = false;
    element.style.cursor = "grab";
  });
  document.addEventListener("mousemove", (e) => {
    if (!isDragging)
      return;
    e.preventDefault();
    const dx = e.clientX - initialMouseX;
    const dy = e.clientY - initialMouseY;
    const newRight = initialElementRight - dx;
    const newTop = initialElementTop + dy;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const elementWidth = element.offsetWidth;
    const elementHeight = element.offsetHeight;
    let clampedRight = Math.max(0, Math.min(newRight, viewportWidth - elementWidth));
    let clampedTop = Math.max(0, Math.min(newTop, viewportHeight - elementHeight));
    element.style.right = `${clampedRight}px`;
    element.style.top = `${clampedTop}px`;
    if (Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5) {
      isMoved = true;
    }
  });
  return { getIsMoved: () => isMoved };
}
function getRandomItems(array, count) {
  if (count >= array.length) {
    return [...array];
  }
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}
function savePosition(right, top) {
  localStorage.setItem(LOCAL_STORAGE_POS_X, right.toString());
  localStorage.setItem(LOCAL_STORAGE_POS_Y, top.toString());
}
function loadPosition() {
  const savedRight = localStorage.getItem(LOCAL_STORAGE_POS_X);
  const savedTop = localStorage.getItem(LOCAL_STORAGE_POS_Y);
  if (savedRight !== null && savedTop !== null) {
    return { right: parseFloat(savedRight), top: parseFloat(savedTop) };
  }
  return null;
}
function waitForDomReady() {
  return new Promise((resolve) => {
    if (document.readyState === "complete" || document.readyState === "interactive") {
      resolve();
      return;
    }
    document.addEventListener("DOMContentLoaded", () => resolve(), { once: true });
  });
}
function waitForElement(selector, timeout = 15e3) {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

// dist/ui.js
var CSS = `
    .boost-lottery-scope {
        --bl-primary: #f15d22;
        --bl-primary-dark: #d64d18;
        --bl-primary-light: #fff3ed;
        --bl-bg: #ffffff;
        --bl-surface: #f8f9fa;
        --bl-border: #e9ecef;
        --bl-text: #212529;
        --bl-text-secondary: #6c757d;
        --bl-error: #dc3545;
        --bl-error-bg: #f8d7da;
        --bl-info: #0d6efd;
        --bl-info-bg: #e7f1ff;
        --bl-success: #198754;
        --bl-radius: 12px;
        --bl-radius-sm: 8px;
        --bl-shadow: 0 10px 30px rgba(0,0,0,0.15);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-size: 14px;
        color: var(--bl-text);
        line-height: 1.5;
    }
    .boost-lottery-scope * {
        box-sizing: border-box;
    }
    .boost-lottery-toggle {
        position: fixed;
        top: 10px;
        right: 10px;
        background: linear-gradient(135deg, var(--bl-primary) 0%, var(--bl-primary-dark) 100%);
        color: #fff;
        border: none;
        padding: 10px 16px;
        border-radius: 999px;
        z-index: 10001;
        cursor: grab;
        font-size: 14px;
        font-weight: 700;
        box-shadow: 0 4px 12px rgba(241, 93, 34, 0.35);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        user-select: none;
    }
    .boost-lottery-toggle:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(241, 93, 34, 0.45);
    }
    .boost-lottery-toggle:active {
        cursor: grabbing;
    }
    .boost-lottery-panel {
        position: fixed;
        top: 60px;
        right: 10px;
        width: 360px;
        max-height: 85vh;
        overflow: hidden;
        background: var(--bl-bg);
        border-radius: var(--bl-radius);
        box-shadow: var(--bl-shadow);
        z-index: 10000;
        display: none;
        flex-direction: column;
    }
    .boost-lottery-header {
        background: linear-gradient(135deg, var(--bl-primary) 0%, var(--bl-primary-dark) 100%);
        color: #fff;
        padding: 14px 16px;
        border-top-left-radius: var(--bl-radius);
        border-top-right-radius: var(--bl-radius);
        cursor: move;
        display: flex;
        justify-content: space-between;
        align-items: center;
        user-select: none;
    }
    .boost-lottery-header h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
    }
    .boost-lottery-close {
        background: rgba(255,255,255,0.2);
        border: none;
        color: #fff;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        font-size: 20px;
        cursor: pointer;
        line-height: 1;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s ease;
    }
    .boost-lottery-close:hover {
        background: rgba(255,255,255,0.35);
    }
    .boost-lottery-body {
        padding: 16px;
        overflow-y: auto;
    }
    .boost-lottery-desc {
        margin-bottom: 14px;
        color: var(--bl-text-secondary);
        font-size: 13px;
    }
    .boost-lottery-actions {
        margin-bottom: 14px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }
    .boost-lottery-btn-sm {
        padding: 6px 12px;
        border: 1px solid var(--bl-border);
        background: var(--bl-surface);
        border-radius: var(--bl-radius-sm);
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        color: var(--bl-text);
        transition: all 0.15s ease;
    }
    .boost-lottery-btn-sm:hover {
        background: var(--bl-primary-light);
        border-color: var(--bl-primary);
        color: var(--bl-primary);
    }
    .boost-lottery-options {
        margin-bottom: 14px;
        padding: 12px;
        background: var(--bl-surface);
        border-radius: var(--bl-radius-sm);
        border: 1px solid var(--bl-border);
    }
    .boost-lottery-option {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        cursor: pointer;
        font-size: 13px;
        color: var(--bl-text);
    }
    .boost-lottery-option:last-child {
        margin-bottom: 0;
    }
    .boost-lottery-option input[type="checkbox"] {
        width: 16px;
        height: 16px;
        accent-color: var(--bl-primary);
        cursor: pointer;
    }
    .boost-lottery-winner-count {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 10px;
        font-size: 13px;
    }
    .boost-lottery-winner-count input {
        width: 60px;
        padding: 6px 8px;
        border: 1px solid var(--bl-border);
        border-radius: var(--bl-radius-sm);
        font-size: 13px;
        text-align: center;
    }
    .boost-lottery-list {
        max-height: 260px;
        overflow-y: auto;
        border: 1px solid var(--bl-border);
        border-radius: var(--bl-radius-sm);
        margin-bottom: 14px;
        background: var(--bl-bg);
    }
    .boost-lottery-list-empty,
    .boost-lottery-list-loading {
        color: var(--bl-text-secondary);
        text-align: center;
        padding: 28px 16px;
        font-size: 13px;
    }
    .boost-lottery-list-loading::before {
        content: "";
        display: block;
        width: 28px;
        height: 28px;
        margin: 0 auto 10px;
        border: 3px solid var(--bl-border);
        border-top-color: var(--bl-primary);
        border-radius: 50%;
        animation: boost-lottery-spin 0.8s linear infinite;
    }
    @keyframes boost-lottery-spin {
        to { transform: rotate(360deg); }
    }
    .boost-lottery-post {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-bottom: 1px solid var(--bl-border);
        cursor: pointer;
        transition: background 0.12s ease;
    }
    .boost-lottery-post:last-child {
        border-bottom: none;
    }
    .boost-lottery-post:hover {
        background: var(--bl-primary-light);
    }
    .boost-lottery-post.disabled {
        opacity: 0.45;
        cursor: not-allowed;
    }
    .boost-lottery-post input[type="checkbox"] {
        width: 16px;
        height: 16px;
        accent-color: var(--bl-primary);
        cursor: pointer;
        flex-shrink: 0;
    }
    .boost-lottery-post.disabled input {
        cursor: not-allowed;
    }
    .boost-lottery-post-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        overflow: hidden;
    }
    .boost-lottery-post-number {
        font-weight: 700;
        color: var(--bl-text);
        font-size: 13px;
    }
    .boost-lottery-post-author {
        font-size: 12px;
        color: var(--bl-text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .boost-lottery-post-boosts {
        color: var(--bl-primary);
        font-size: 12px;
        font-weight: 700;
        flex-shrink: 0;
    }
    .boost-lottery-start {
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, var(--bl-primary) 0%, var(--bl-primary-dark) 100%);
        color: #fff;
        border: none;
        border-radius: var(--bl-radius-sm);
        cursor: pointer;
        font-size: 15px;
        font-weight: 700;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .boost-lottery-start:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(241, 93, 34, 0.35);
    }
    .boost-lottery-result {
        margin-top: 14px;
    }
    .boost-lottery-result-title {
        font-weight: 700;
        margin-bottom: 10px;
        color: var(--bl-primary);
        font-size: 14px;
    }
    .boost-lottery-winner {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        background: var(--bl-primary-light);
        border-radius: var(--bl-radius-sm);
        margin-bottom: 8px;
        border: 1px solid rgba(241, 93, 34, 0.15);
    }
    .boost-lottery-winner img {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        object-fit: cover;
        background: var(--bl-surface);
    }
    .boost-lottery-winner-name {
        font-weight: 700;
        color: var(--bl-primary-dark);
    }
    .boost-lottery-status {
        padding: 12px;
        border-radius: var(--bl-radius-sm);
        font-size: 13px;
    }
    .boost-lottery-status.info {
        background: var(--bl-info-bg);
        color: var(--bl-info);
    }
    .boost-lottery-status.error {
        background: var(--bl-error-bg);
        color: var(--bl-error);
    }
    .boost-lottery-highlight {
        animation: boost-lottery-pulse 1.5s ease-in-out infinite;
    }
    @keyframes boost-lottery-pulse {
        0%, 100% { box-shadow: 0 0 0 3px var(--bl-primary), 0 0 0 6px rgba(241, 93, 34, 0.3); }
        50% { box-shadow: 0 0 0 4px #ff8a50, 0 0 0 10px rgba(241, 93, 34, 0); }
    }
`;
function injectStyles() {
  if (document.getElementById("boostLotteryStyles"))
    return;
  const style = document.createElement("style");
  style.id = "boostLotteryStyles";
  style.textContent = CSS;
  document.head.appendChild(style);
}
function createToggleButton() {
  injectStyles();
  const btn = document.createElement("button");
  btn.id = TOGGLE_BTN_ID;
  btn.className = "boost-lottery-toggle";
  btn.textContent = "Boost \u62BD\u5956";
  btn.title = "\u6253\u5F00 Boost \u62BD\u5956\u9762\u677F";
  document.body.appendChild(btn);
  return btn;
}
function createPanel() {
  let panel = document.getElementById(PANEL_ID);
  if (panel)
    return panel;
  panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.className = "boost-lottery-panel boost-lottery-scope";
  panel.innerHTML = `
        <div id="${PANEL_ID}Header" class="boost-lottery-header">
            <h4>Boost \u62BD\u5956</h4>
            <button id="${PANEL_ID}CloseBtn" class="boost-lottery-close">&times;</button>
        </div>
        <div class="boost-lottery-body">
            <div class="boost-lottery-desc">
                \u9009\u62E9\u8981\u53C2\u4E0E\u62BD\u5956\u7684\u697C\u5C42\uFF0C\u5C06\u4ECE\u8FD9\u4E9B\u697C\u7684 Boost \u7528\u6237\u4E2D\u968F\u673A\u62BD\u53D6\u3002
            </div>
            <div class="boost-lottery-actions">
                <button id="boostLotterySelectAll" class="boost-lottery-btn-sm">\u5168\u9009</button>
                <button id="boostLotteryInvert" class="boost-lottery-btn-sm">\u53CD\u9009</button>
                <button id="boostLotterySelectWithBoost" class="boost-lottery-btn-sm">\u4EC5\u9009\u6709 Boost</button>
            </div>
            <div class="boost-lottery-options">
                <label class="boost-lottery-option">
                    <input type="checkbox" id="boostLotteryExcludeDuplicates" checked>
                    <span>\u53BB\u91CD\uFF08\u540C\u4E00\u7528\u6237\u53EA\u7B97\u4E00\u6B21\uFF09</span>
                </label>
                <label class="boost-lottery-option">
                    <input type="checkbox" id="boostLotteryExcludeAuthor" checked>
                    <span>\u6392\u9664\u697C\u5C42\u4F5C\u8005</span>
                </label>
                <label class="boost-lottery-option">
                    <input type="checkbox" id="boostLotteryExcludeTopicOwner">
                    <span>\u6392\u9664\u697C\u4E3B</span>
                </label>
                <div class="boost-lottery-winner-count">
                    <span>\u62BD\u53D6\u4EBA\u6570\uFF1A</span>
                    <input type="number" id="boostLotteryWinnerCount" value="1" min="1" max="100">
                </div>
            </div>
            <div id="${POST_LIST_ID}" class="boost-lottery-list">
                <div class="boost-lottery-list-empty">\u672A\u627E\u5230\u4EFB\u4F55\u697C\u5C42</div>
            </div>
            <button id="boostLotteryStartBtn" class="boost-lottery-start">\u5F00\u59CB\u62BD\u53D6</button>
            <div id="${RESULT_ID}" class="boost-lottery-result" style="display: none;"></div>
        </div>
    `;
  document.body.appendChild(panel);
  return panel;
}
function setPostListLoading(loading) {
  const listContainer = document.getElementById(POST_LIST_ID);
  if (!listContainer)
    return;
  listContainer.innerHTML = loading ? '<div class="boost-lottery-list-loading">\u6B63\u5728\u52A0\u8F7D\u697C\u5C42...</div>' : '<div class="boost-lottery-list-empty">\u672A\u627E\u5230\u4EFB\u4F55\u697C\u5C42</div>';
}
function renderPostList(posts) {
  const listContainer = document.getElementById(POST_LIST_ID);
  if (!listContainer)
    return;
  if (posts.length === 0) {
    listContainer.innerHTML = '<div class="boost-lottery-list-empty">\u672A\u627E\u5230\u4EFB\u4F55\u697C\u5C42</div>';
    return;
  }
  const html = posts.map((post) => {
    const boostCount = post.boosters.length;
    const disabled = boostCount === 0;
    const disabledClass = disabled ? "disabled" : "";
    const checkedAttr = boostCount > 0 ? "checked" : "";
    const disabledAttr = disabled ? "disabled" : "";
    return `
            <label class="boost-lottery-post ${disabledClass}">
                <input type="checkbox" class="boost-lottery-post-checkbox" value="${post.postNumber}" ${checkedAttr} ${disabledAttr}>
                <div class="boost-lottery-post-info">
                    <span class="boost-lottery-post-number">#${post.postNumber}</span>
                    <span class="boost-lottery-post-author">@${post.authorUsername || "\u672A\u77E5\u7528\u6237"}</span>
                </div>
                <span class="boost-lottery-post-boosts">${boostCount} \u4E2A Boost</span>
            </label>
        `;
  }).join("");
  listContainer.innerHTML = html;
}
function getSelectedPostNumbers() {
  const checkboxes = document.querySelectorAll(".boost-lottery-post-checkbox:checked");
  return Array.from(checkboxes).map((cb) => parseInt(cb.value, 10));
}
function getLotteryOptions() {
  var _a, _b, _c, _d, _e, _f;
  const excludeDuplicates = (_b = (_a = document.getElementById("boostLotteryExcludeDuplicates")) === null || _a === void 0 ? void 0 : _a.checked) !== null && _b !== void 0 ? _b : true;
  const excludeTopicOwner = (_d = (_c = document.getElementById("boostLotteryExcludeTopicOwner")) === null || _c === void 0 ? void 0 : _c.checked) !== null && _d !== void 0 ? _d : false;
  const excludeAuthor = (_f = (_e = document.getElementById("boostLotteryExcludeAuthor")) === null || _e === void 0 ? void 0 : _e.checked) !== null && _f !== void 0 ? _f : true;
  const winnerCountInput = document.getElementById("boostLotteryWinnerCount");
  const winnerCount = Math.max(1, parseInt((winnerCountInput === null || winnerCountInput === void 0 ? void 0 : winnerCountInput.value) || "1", 10));
  return { excludeDuplicates, excludeTopicOwner, excludeAuthor, winnerCount };
}
function renderWinners(winners) {
  const resultContainer = document.getElementById(RESULT_ID);
  if (!resultContainer)
    return;
  if (winners.length === 0) {
    resultContainer.innerHTML = '<div class="boost-lottery-status error">\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u7528\u6237\u3002</div>';
    resultContainer.style.display = "block";
    return;
  }
  const winnerHtml = winners.map((winner) => `
        <div class="boost-lottery-winner">
            <img src="${winner.avatarUrl}" alt="${winner.username}" onerror="this.style.display='none'">
            <div class="boost-lottery-winner-name">@${winner.username}</div>
        </div>
    `).join("");
  resultContainer.innerHTML = `
        <div class="boost-lottery-result-title">\u62BD\u5956\u7ED3\u679C</div>
        ${winnerHtml}
    `;
  resultContainer.style.display = "block";
}
function showStatus(message, type = "info") {
  const resultContainer = document.getElementById(RESULT_ID);
  if (!resultContainer)
    return;
  resultContainer.innerHTML = `<div class="boost-lottery-status ${type}">${message}</div>`;
  resultContainer.style.display = "block";
}
function setupToggleButton(toggleBtn, panel) {
  const savedPos = loadPosition();
  if (savedPos) {
    toggleBtn.style.right = `${savedPos.right}px`;
    toggleBtn.style.top = `${savedPos.top}px`;
  }
  const draggable = makeDraggable(toggleBtn, toggleBtn);
  toggleBtn.addEventListener("click", (e) => {
    if (draggable.getIsMoved())
      return;
    const isVisible = panel.style.display === "flex";
    panel.style.display = isVisible ? "none" : "flex";
  });
  toggleBtn.addEventListener("mouseup", () => {
    const right = parseFloat(toggleBtn.style.right) || 0;
    const top = parseFloat(toggleBtn.style.top) || 0;
    savePosition(right, top);
  });
}
function setupPanelDrag(panel) {
  const header = document.getElementById(`${PANEL_ID}Header`);
  if (!header)
    return;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialRight = 0;
  let initialTop = 0;
  header.addEventListener("mousedown", (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initialRight = parseFloat(panel.style.right) || 0;
    initialTop = parseFloat(panel.style.top) || panel.offsetTop;
    header.style.cursor = "grabbing";
  });
  document.addEventListener("mouseup", () => {
    isDragging = false;
    header.style.cursor = "move";
  });
  document.addEventListener("mousemove", (e) => {
    if (!isDragging)
      return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const newRight = initialRight - dx;
    const newTop = initialTop + dy;
    panel.style.right = `${Math.max(0, newRight)}px`;
    panel.style.top = `${Math.max(0, newTop)}px`;
  });
}

// dist/domSelectors.js
function extractAuthorUsername(article) {
  const names = article.querySelector(".names");
  if (!names)
    return "";
  const usernameLink = names.querySelector("a[data-user-card]");
  return (usernameLink === null || usernameLink === void 0 ? void 0 : usernameLink.getAttribute("data-user-card")) || "";
}
function extractBoosters(article) {
  const boostList = article.querySelector(BOOST_LIST_SELECTOR);
  if (!boostList)
    return [];
  const boosters = [];
  const bubbles = boostList.querySelectorAll(BOOST_BUBBLE_SELECTOR);
  bubbles.forEach((bubble) => {
    const userLink = bubble.querySelector(BOOST_USER_SELECTOR);
    if (!userLink)
      return;
    const username = userLink.getAttribute("data-user-card") || "";
    if (!username)
      return;
    const img = userLink.querySelector("img.avatar");
    const avatarUrl = (img === null || img === void 0 ? void 0 : img.src) || "";
    boosters.push({ username, avatarUrl });
  });
  return boosters;
}
function extractPosts() {
  const posts = [];
  const postElements = document.querySelectorAll(POST_SELECTOR);
  postElements.forEach((postEl) => {
    const postNumberAttr = postEl.getAttribute("data-post-number");
    if (!postNumberAttr)
      return;
    const postNumber = parseInt(postNumberAttr, 10);
    if (Number.isNaN(postNumber))
      return;
    const article = postEl.querySelector(POST_ARTICLE_SELECTOR);
    if (!article)
      return;
    const postId = article.getAttribute("data-post-id") || "";
    const authorUsername = extractAuthorUsername(article);
    const boosters = extractBoosters(article);
    posts.push({ postNumber, postId, authorUsername, boosters });
  });
  return posts.sort((a, b) => a.postNumber - b.postNumber);
}
function getTopicOwnerUsername() {
  const ownerPost = document.querySelector(".topic-post.topic-owner article.onscreen-post");
  if (!ownerPost)
    return "";
  const usernameLink = ownerPost.querySelector("a[data-user-card]");
  return (usernameLink === null || usernameLink === void 0 ? void 0 : usernameLink.getAttribute("data-user-card")) || "";
}
var HIGHLIGHT_CLASS = "boost-lottery-highlight";
function clearBoostHighlights() {
  document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => {
    el.classList.remove(HIGHLIGHT_CLASS);
  });
}
function highlightWinnerBoosts(winners, postNumbers) {
  clearBoostHighlights();
  if (winners.length === 0 || postNumbers.length === 0)
    return;
  const winnerUsernames = new Set(winners.map((w) => w.username));
  const posts = document.querySelectorAll(POST_SELECTOR);
  let firstHighlighted = null;
  posts.forEach((postEl) => {
    const postNumberAttr = postEl.getAttribute("data-post-number");
    if (!postNumberAttr)
      return;
    const postNumber = parseInt(postNumberAttr, 10);
    if (Number.isNaN(postNumber) || !postNumbers.includes(postNumber))
      return;
    const boostList = postEl.querySelector(BOOST_LIST_SELECTOR);
    if (!boostList)
      return;
    const bubbles = boostList.querySelectorAll(BOOST_BUBBLE_SELECTOR);
    bubbles.forEach((bubble) => {
      const userLink = bubble.querySelector(BOOST_USER_SELECTOR);
      const username = (userLink === null || userLink === void 0 ? void 0 : userLink.getAttribute("data-user-card")) || "";
      if (winnerUsernames.has(username)) {
        bubble.classList.add(HIGHLIGHT_CLASS);
        if (!firstHighlighted) {
          firstHighlighted = bubble;
        }
      }
    });
  });
  if (firstHighlighted) {
    firstHighlighted.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// dist/eventHandlers.js
var cachedPosts = [];
function refreshPostList() {
  cachedPosts = extractPosts();
  renderPostList(cachedPosts);
}
function collectCandidates(selectedPostNumbers, options) {
  const topicOwner = getTopicOwnerUsername();
  const selectedPosts = cachedPosts.filter((p) => selectedPostNumbers.includes(p.postNumber));
  let candidates = [];
  selectedPosts.forEach((post) => {
    post.boosters.forEach((booster) => {
      if (options.excludeAuthor && booster.username === post.authorUsername)
        return;
      if (options.excludeTopicOwner && booster.username === topicOwner)
        return;
      candidates.push(booster);
    });
  });
  if (options.excludeDuplicates) {
    const seen = /* @__PURE__ */ new Set();
    candidates = candidates.filter((booster) => {
      if (seen.has(booster.username))
        return false;
      seen.add(booster.username);
      return true;
    });
  }
  return candidates;
}
function handleStartLottery() {
  const selectedPostNumbers = getSelectedPostNumbers();
  clearBoostHighlights();
  if (selectedPostNumbers.length === 0) {
    showStatus("\u8BF7\u81F3\u5C11\u9009\u62E9\u4E00\u4E2A\u697C\u5C42\u3002", "error");
    return;
  }
  const options = getLotteryOptions();
  const candidates = collectCandidates(selectedPostNumbers, options);
  if (candidates.length === 0) {
    showStatus("\u6240\u9009\u697C\u5C42\u6CA1\u6709\u7B26\u5408\u8FC7\u6EE4\u6761\u4EF6\u7684 Boost \u7528\u6237\u3002", "error");
    return;
  }
  const winners = getRandomItems(candidates, options.winnerCount);
  renderWinners(winners);
  highlightWinnerBoosts(winners, selectedPostNumbers);
}
function handleSelectAll(checked) {
  const checkboxes = document.querySelectorAll(".boost-lottery-post-checkbox");
  checkboxes.forEach((cb) => {
    if (!cb.disabled)
      cb.checked = checked;
  });
}
function handleInvertSelection() {
  const checkboxes = document.querySelectorAll(".boost-lottery-post-checkbox");
  checkboxes.forEach((cb) => {
    if (!cb.disabled)
      cb.checked = !cb.checked;
  });
}
function handleSelectWithBoost() {
  const checkboxes = document.querySelectorAll(".boost-lottery-post-checkbox");
  checkboxes.forEach((cb) => {
    if (!cb.disabled)
      cb.checked = true;
  });
}
function bindPanelEvents(panel) {
  var _a, _b, _c, _d;
  setupPanelDrag(panel);
  const closeBtn = document.getElementById(`${PANEL_ID}CloseBtn`);
  closeBtn === null || closeBtn === void 0 ? void 0 : closeBtn.addEventListener("click", () => {
    panel.style.display = "none";
  });
  (_a = document.getElementById("boostLotterySelectAll")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => handleSelectAll(true));
  (_b = document.getElementById("boostLotteryInvert")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", handleInvertSelection);
  (_c = document.getElementById("boostLotterySelectWithBoost")) === null || _c === void 0 ? void 0 : _c.addEventListener("click", handleSelectWithBoost);
  (_d = document.getElementById("boostLotteryStartBtn")) === null || _d === void 0 ? void 0 : _d.addEventListener("click", handleStartLottery);
  const postStream = document.querySelector(".post-stream");
  if (postStream) {
    const observer = new MutationObserver(() => {
      refreshPostList();
    });
    observer.observe(postStream, { childList: true, subtree: true });
  }
}
function initializeLottery() {
  const panel = createPanel();
  bindPanelEvents(panel);
  setPostListLoading(true);
  waitForElement(".topic-post").then((postElement) => {
    setPostListLoading(false);
    if (!postElement) {
      showStatus("\u672A\u627E\u5230\u697C\u5C42\uFF0C\u8BF7\u786E\u8BA4\u9875\u9762\u5DF2\u52A0\u8F7D\u5B8C\u6210\u3002", "error");
      return;
    }
    refreshPostList();
  });
  return panel;
}

// dist/checkUpdate.js
async function checkUpdate() {
  const currentScriptVersion = window.GM_info.script.version;
  const lastCheckTime = parseInt(localStorage.getItem(LOCAL_STORAGE_LAST_CHECK_TIME) || "0", 10);
  const now = Date.now();
  const isStandardVersion = /^[0-9]+\.[0-9]+\.[0-9]+$/.test(currentScriptVersion);
  const currentCheckInterval = isStandardVersion ? UPDATE_CHECK_INTERVAL : PREVIEW_UPDATE_CHECK_INTERVAL;
  if (now - lastCheckTime < currentCheckInterval) {
    console.log("LINUX DO Boost \u62BD\u5956: \u8DDD\u79BB\u4E0A\u6B21\u68C0\u67E5\u66F4\u65B0\u65F6\u95F4\u4E0D\u8DB3\uFF0C\u8DF3\u8FC7\u68C0\u67E5\u3002");
    return;
  }
  console.log("LINUX DO Boost \u62BD\u5956: \u6B63\u5728\u68C0\u67E5\u66F4\u65B0...");
  localStorage.setItem(LOCAL_STORAGE_LAST_CHECK_TIME, now.toString());
  const versionPath = isStandardVersion ? "pub" : "perv";
  const updateUrl = `${STATIC_BASE_URL}/${versionPath}/version.json`;
  window.GM_xmlhttpRequest({
    method: "GET",
    url: updateUrl,
    onload: (response) => {
      try {
        const remotePackageJson = JSON.parse(response.responseText);
        const remoteVersion = remotePackageJson.version;
        if (remoteVersion && remoteVersion !== currentScriptVersion) {
          console.log(`LINUX DO Boost \u62BD\u5956: \u53D1\u73B0\u65B0\u7248\u672C\uFF01\u5F53\u524D\u7248\u672C: ${currentScriptVersion}, \u6700\u65B0\u7248\u672C: ${remoteVersion}`);
          const userScriptFileName = "boostLottery.user.js";
          const userScriptUrl = `${STATIC_BASE_URL}/${versionPath}/${userScriptFileName}`;
          if (window.confirm(`LINUX DO Boost \u62BD\u5956: \u53D1\u73B0\u65B0\u7248\u672C ${remoteVersion}\uFF01\u662F\u5426\u5728\u65B0\u6807\u7B7E\u9875\u6253\u5F00\u66F4\u65B0\uFF1F`)) {
            window.GM_openInTab(userScriptUrl, false);
          }
        } else {
          console.log("LINUX DO Boost \u62BD\u5956: \u5F53\u524D\u5DF2\u662F\u6700\u65B0\u7248\u672C\u3002");
        }
      } catch (error) {
        console.error("LINUX DO Boost \u62BD\u5956: \u89E3\u6790\u66F4\u65B0\u4FE1\u606F\u5931\u8D25:", error);
      }
    },
    onerror: (response) => {
      console.error("LINUX DO Boost \u62BD\u5956: \u68C0\u67E5\u66F4\u65B0\u5931\u8D25:", response.status, response.statusText);
    }
  });
}

// dist/main.js
(function() {
  "use strict";
  if (window.self !== window.top)
    return;
  console.log("LINUX DO Boost \u62BD\u5956: \u811A\u672C\u5DF2\u52A0\u8F7D\u3002");
  waitForDomReady().then(() => {
    const toggleBtn = createToggleButton();
    const panel = initializeLottery();
    setupToggleButton(toggleBtn, panel);
    checkUpdate();
  });
})();
