// ==UserScript==
// @version     1.0.0-alpha1
// @name        Better Hetao
// @namespace   https://github.com/SuperUseryjh/Better-Hetao
// @description 更好的核桃 OJ
// @author      YaoOnio & mywwzh
// @match       https://htoj.com.cn/cpp/oj/problem/detail?pid=*
// @match       https://htoj.com.cn/python/oj/problem/detail?pid=*
// @grant       GM_xmlhttpRequest
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_notification
// @grant       GM_info
// @connect     static.yaoonion.fun
// @connect     api.htoj.com.cn
// @connect     localhost
// @run-at      document-start
// @updateURL   https://static.yaoonion.fun/better-hetao/perview/script.user.js
// @downloadURL https://static.yaoonion.fun/better-hetao/perview/script.user.js
// ==/UserScript==
"use strict";
(() => {
  // dist/config.js
  var CONFIG = {
    NAMESPACE: "https://github.com/SuperUseryjh/Better-Hetao",
    UPDATE_BASE_URL: "https://static.yaoonion.fun/better-hetao",
    PUB_UPDATE_INTERVAL_MS: 24 * 60 * 60 * 1e3,
    PERVIEW_UPDATE_INTERVAL_MS: 60 * 60 * 1e3,
    PROBLEM_DETAIL_API: "https://api.htoj.com.cn/api/code-community/api/get-problem-detail",
    CONTEST_PROBLEM_DETAIL_API: "https://api.htoj.com.cn/api/htoj-biz-gateway/api/get-problem-detail",
    CPH_HOST: "http://localhost:27121/competitive-companion",
    LOG_PREFIX: "[Better Hetao]"
  };

  // dist/utils.js
  function log(...args) {
    console.log(CONFIG.LOG_PREFIX, ...args);
  }
  function error(...args) {
    console.error(CONFIG.LOG_PREFIX, ...args);
  }
  function compareVersion(v1, v2) {
    const parts1 = v1.split(".");
    const parts2 = v2.split(".");
    for (let i = 0; i < 3; i++) {
      const num1 = parseInt(parts1[i] || "0", 10);
      const num2 = parseInt(parts2[i] || "0", 10);
      if (num1 > num2)
        return 1;
      if (num1 < num2)
        return -1;
    }
    return 0;
  }
  function getVersionStatus(version) {
    return /^\d+\.\d+\.\d+$/.test(version) ? "pub" : "perview";
  }
  function waitElement(selector, callback, cntLimit = 50) {
    let cnt = 0;
    const checkElement = () => {
      cnt++;
      const element = document.querySelector(selector);
      if (element) {
        callback(element);
        return;
      }
      if (cnt < cntLimit) {
        setTimeout(checkElement, 200);
      }
    };
    checkElement();
  }
  function getProblemId() {
    const url = new URL(window.location.href);
    return url.searchParams.get("pid");
  }
  function getContestId() {
    const url = new URL(window.location.href);
    return url.searchParams.get("cid");
  }
  function getZone() {
    return window.location.href.includes("/cpp/") ? "cpp" : "python";
  }
  function getAuthorization() {
    const savedAuth = GM_getValue("authorization", "");
    if (savedAuth) {
      return savedAuth;
    }
    const cookieRow = document.cookie.split("; ").find((row) => row.startsWith("authorization="));
    return cookieRow ? cookieRow.split("=")[1] : "";
  }
  function isProblemDetailPage() {
    const url = new URL(window.location.href);
    return url.searchParams.has("pid");
  }
  function getTitleElement() {
    return document.querySelector("h1.text-xl, h3.text-xl");
  }

  // dist/ui.js
  var STYLES = `
  .cph-button {
    display: inline-flex;
    align-items: center;
    height: 32px;
    padding: 0 15px;
    font-size: 14px;
    border-radius: 4px;
    color: white;
    border: none;
    cursor: pointer;
    margin-left: 12px;
  }
  .cph-button.blue {
    background: #1890ff;
  }
  .cph-button.green {
    background: #52c41a;
  }
  .cph-button:hover {
    opacity: 0.8;
  }

  .bh-settings-btn {
    position: fixed;
    top: 70px;
    right: 20px;
    background: #1890ff;
    color: white;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: move;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 9999;
    user-select: none;
    font-size: 20px;
  }

  .bh-settings-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    width: 400px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    z-index: 10000;
    padding: 20px;
    display: none;
  }

  .bh-settings-panel h3 {
    margin-top: 0;
    margin-bottom: 20px;
    font-size: 18px;
    color: #333;
  }

  .bh-settings-panel label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    color: #555;
  }

  .bh-settings-panel input {
    width: 100%;
    padding: 8px;
    margin-bottom: 15px;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-sizing: border-box;
  }

  .bh-settings-panel .buttons {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .bh-settings-panel button {
    padding: 8px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .bh-settings-panel button.save {
    background: #1890ff;
    color: white;
  }

  .bh-settings-panel button.cancel {
    background: #f5f5f5;
    color: #333;
  }

  .bh-toast {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    z-index: 10001;
    padding: 20px;
    min-width: 300px;
    max-width: 400px;
    text-align: center;
    animation: bhToastFadeIn 0.2s ease;
  }

  @keyframes bhToastFadeIn {
    from {
      opacity: 0;
      transform: translate(-50%, -48%);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
  }

  .bh-toast-content {
    margin-bottom: 20px;
    color: #333;
    white-space: pre-line;
  }

  .bh-toast-button {
    display: inline-block;
    padding: 8px 16px;
    background: #1890ff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  .bh-toast-button:hover {
    background: #40a9ff;
  }
`;
  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = STYLES;
    document.head.appendChild(style);
  }
  function showToast(message, duration = 3e3) {
    const existingToast = document.querySelector(".bh-toast");
    if (existingToast) {
      existingToast.remove();
    }
    const toast = document.createElement("div");
    toast.className = "bh-toast";
    const content = document.createElement("div");
    content.className = "bh-toast-content";
    content.textContent = message;
    const button = document.createElement("button");
    button.className = "bh-toast-button";
    button.textContent = "\u786E\u5B9A";
    button.onclick = () => toast.remove();
    toast.appendChild(content);
    toast.appendChild(button);
    document.body.appendChild(toast);
    const closeToast = (e) => {
      if (!toast.contains(e.target)) {
        toast.remove();
        document.removeEventListener("mousedown", closeToast);
      }
    };
    document.addEventListener("mousedown", closeToast);
    if (duration > 0) {
      setTimeout(() => {
        if (document.body.contains(toast)) {
          toast.remove();
        }
      }, duration);
    }
  }
  function createButton(text, className, onClick) {
    const button = document.createElement("button");
    button.textContent = text;
    button.className = `cph-button ${className}`;
    button.onclick = onClick;
    return button;
  }
  function createSettingsElements() {
    const settingsBtn = document.createElement("div");
    settingsBtn.className = "bh-settings-btn";
    settingsBtn.innerHTML = "\u2699\uFE0F";
    settingsBtn.title = "Better Hetao \u8BBE\u7F6E";
    const settingsPanel = document.createElement("div");
    settingsPanel.className = "bh-settings-panel";
    settingsPanel.innerHTML = `
    <h3>Better Hetao \u8BBE\u7F6E</h3>
    <label for="bh-authorization">Authorization \u4EE4\u724C:</label>
    <input type="text" id="bh-authorization" placeholder="\u8BF7\u8F93\u5165 authorization \u4EE4\u724C...">
    <div class="buttons">
      <button class="cancel">\u53D6\u6D88</button>
      <button class="save">\u4FDD\u5B58</button>
    </div>
  `;
    document.body.appendChild(settingsBtn);
    document.body.appendChild(settingsPanel);
    const savedAuth = GM_getValue("authorization", "");
    const authInput = document.getElementById("bh-authorization");
    if (authInput)
      authInput.value = savedAuth;
    let isDragging = false;
    let hasDragged = false;
    let offsetX = 0;
    let offsetY = 0;
    let startX = 0;
    let startY = 0;
    settingsBtn.addEventListener("mousedown", (e) => {
      isDragging = true;
      hasDragged = false;
      const rect = settingsBtn.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      startX = e.clientX;
      startY = e.clientY;
      e.preventDefault();
    });
    document.addEventListener("mousemove", (e) => {
      if (!isDragging)
        return;
      if (Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5) {
        hasDragged = true;
      }
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;
      const maxX = window.innerWidth - settingsBtn.offsetWidth;
      const maxY = window.innerHeight - settingsBtn.offsetHeight;
      settingsBtn.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
      settingsBtn.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
      settingsBtn.style.right = "auto";
    });
    document.addEventListener("mouseup", () => {
      isDragging = false;
    });
    settingsBtn.addEventListener("click", () => {
      if (!hasDragged) {
        settingsPanel.style.display = "block";
      }
      hasDragged = false;
    });
    const saveButton = settingsPanel.querySelector("button.save");
    saveButton?.addEventListener("click", () => {
      const authorization = document.getElementById("bh-authorization")?.value ?? "";
      GM_setValue("authorization", authorization);
      settingsPanel.style.display = "none";
      showToast("\u8BBE\u7F6E\u5DF2\u4FDD\u5B58");
    });
    const cancelButton = settingsPanel.querySelector("button.cancel");
    cancelButton?.addEventListener("click", () => {
      const authInput2 = document.getElementById("bh-authorization");
      if (authInput2)
        authInput2.value = GM_getValue("authorization", "");
      settingsPanel.style.display = "none";
    });
    document.addEventListener("mousedown", (e) => {
      if (!settingsPanel.contains(e.target) && e.target !== settingsBtn) {
        settingsPanel.style.display = "none";
      }
    });
  }

  // dist/api.js
  function checkUpdate() {
    const currentVersion = GM_info.script.version;
    const status = getVersionStatus(currentVersion);
    const checkInterval = status === "pub" ? CONFIG.PUB_UPDATE_INTERVAL_MS : CONFIG.PERVIEW_UPDATE_INTERVAL_MS;
    const lastCheck = GM_getValue("lastUpdateCheck", 0);
    const now = Date.now();
    if (now - lastCheck <= checkInterval) {
      return;
    }
    const remoteUrl = `${CONFIG.UPDATE_BASE_URL}/${status}/version.json`;
    GM_xmlhttpRequest({
      method: "GET",
      url: remoteUrl,
      onload: (response) => {
        if (response.status !== 200) {
          error("Failed to fetch remote version.json:", response.statusText);
          return;
        }
        log("Remote version.json response:", response.responseText);
        try {
          const data = JSON.parse(response.responseText);
          const remoteVersion = data.version;
          if (!remoteVersion) {
            error("Remote version.json has no version field.");
            return;
          }
          if (compareVersion(remoteVersion, currentVersion) > 0) {
            const downloadUrl = `${CONFIG.UPDATE_BASE_URL}/${status}/script.user.js`;
            const description = data.description || "";
            GM_notification({
              title: "Better Hetao \u66F4\u65B0\u53EF\u7528",
              text: `\u65B0\u7248\u672C ${remoteVersion} \u5DF2\u53D1\u5E03
${description}`,
              onclick: () => window.open(downloadUrl, "_blank")
            });
          }
        } catch (e) {
          error("Failed to parse remote version.json:", e);
        }
        GM_setValue("lastUpdateCheck", now);
      },
      onerror: (err) => {
        error("Error fetching remote version.json:", err);
      }
    });
  }
  async function copyMarkdown() {
    const pid = getProblemId();
    const cid = getContestId();
    if (!pid) {
      showToast("\u65E0\u6CD5\u83B7\u53D6\u9898\u76EEID\uFF01");
      return;
    }
    const zone = getZone();
    const cidParam = cid ? `&cid=${encodeURIComponent(cid)}` : "";
    const apiUrl = cid ? CONFIG.CONTEST_PROBLEM_DETAIL_API : CONFIG.PROBLEM_DETAIL_API;
    const url = `${apiUrl}?problemId=${encodeURIComponent(pid)}${cidParam}`;
    try {
      const response = await new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: "GET",
          url,
          headers: {
            authorization: getAuthorization(),
            "hetao-oj-zone": zone
          },
          onload: (response2) => resolve(response2),
          onerror: (error2) => reject(error2)
        });
      });
      const data = JSON.parse(response.responseText);
      if (data.errCode === 0 && data.data?.problemBaseVO.content) {
        await navigator.clipboard.writeText(data.data.problemBaseVO.content);
        showToast("\u9898\u9762markdown\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F\uFF01");
      } else {
        error("Failed to get markdown content:", data);
        showToast(`\u83B7\u53D6\u9898\u9762\u5931\u8D25\uFF01
\u9519\u8BEF\u7801: ${data.errCode}
\u9519\u8BEF\u4FE1\u606F: ${data.errMsg || "\u672A\u77E5\u9519\u8BEF"}`, 5e3);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      error("Error copying markdown:", err);
      showToast(`\u83B7\u53D6\u9898\u9762\u5931\u8D25\uFF01
\u9519\u8BEF\u8BE6\u60C5: ${message}`, 5e3);
    }
  }

  // dist/samples.js
  function extractSamples() {
    log("Extracting samples from page...");
    const samples = [];
    const containers = document.querySelectorAll(".hetao-inout-container");
    containers.forEach((container, index) => {
      let input = container.querySelector(`.language-input${index + 1} .md-editor-code-block`);
      let output = container.querySelector(`.language-output${index + 1} .md-editor-code-block`);
      if (!input || !output) {
        log(`Failed to get sample by finding language-input, trying to get any codeblocks...`);
        const items = container.querySelectorAll(".hetao-inout-item");
        if (items.length >= 2) {
          input = items[0].querySelector(".md-editor-code-block");
          output = items[1].querySelector(".md-editor-code-block");
        }
      }
      if (input && output) {
        const sample = {
          input: input.textContent?.trim() ?? "",
          output: output.textContent?.trim() ?? ""
        };
        samples.push(sample);
        log(`Got sample ${index + 1}:`, sample);
      }
    });
    return samples;
  }

  // dist/cph.js
  function sendToCPH() {
    const titleEl = getTitleElement();
    const spans = titleEl?.querySelectorAll("span") ?? [];
    const pid = spans.length > 0 ? spans[0].textContent?.trim() ?? "" : "";
    const title = spans.length > 1 ? spans[1].textContent?.trim() ?? "\u672A\u77E5\u9898\u76EE" : "\u672A\u77E5\u9898\u76EE";
    const fullTitle = `${pid}-${title}`;
    const samples = extractSamples();
    if (!samples.length) {
      showToast("\u672A\u627E\u5230\u6837\u4F8B\uFF01");
      error("No samples found.");
      return;
    }
    const payload = {
      name: fullTitle,
      group: "Hetao OJ",
      url: window.location.href,
      tests: samples
    };
    GM_xmlhttpRequest({
      method: "POST",
      url: CONFIG.CPH_HOST,
      headers: {
        "Content-Type": "application/json"
      },
      data: JSON.stringify(payload),
      onload: (response) => {
        if (response.status === 200) {
          showToast("\u6837\u4F8B\u5DF2\u53D1\u9001\u5230 CPH\uFF01");
          log2("Samples sent to CPH successfully.");
        } else {
          error("Failed to send samples to CPH.");
        }
      },
      onerror: (err) => {
        showToast("\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u786E\u4FDD CPH \u6B63\u5728\u8FD0\u884C\uFF01");
        error("Error sending samples to CPH:", err);
      }
    });
  }
  function log2(...args) {
    console.log(CONFIG.LOG_PREFIX, ...args);
  }

  // dist/main.js
  function insertButtons() {
    if (!isProblemDetailPage()) {
      return;
    }
    waitElement("h1.text-xl, h3.text-xl", (target) => {
      if (target.querySelector(".cph-button")) {
        return;
      }
      const titleSpans = target.querySelectorAll("span");
      if (titleSpans.length < 2) {
        error("Failed to find title spans.");
        return;
      }
      const buttonWrapper = document.createElement("div");
      buttonWrapper.style.display = "inline-flex";
      buttonWrapper.style.alignItems = "center";
      buttonWrapper.style.marginLeft = "12px";
      buttonWrapper.appendChild(createButton("\u53D1\u9001\u5230 CPH", "blue", sendToCPH));
      buttonWrapper.appendChild(createButton("\u590D\u5236\u9898\u9762", "green", copyMarkdown));
      target.appendChild(buttonWrapper);
      log("Buttons inserted successfully.");
    });
  }
  function main() {
    checkUpdate();
    log("Script initialization started.");
    injectStyles();
    log("Button style added.");
    insertButtons();
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        insertButtons();
      }
    }).observe(document, { subtree: true, childList: true });
    window.addEventListener("load", () => {
      createSettingsElements();
    });
  }
  main();
})();
