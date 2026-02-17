// ==UserScript==
// @name         OICPP sampleTester
// @namespace    https://oicpp.mywwzh.top/
// @version      1.2.4-alpha2
// @description  从 OJ 平台获取题目样例并发送到 OICPP 的油猴脚本
// @author       Mr_Onion & mywwzh
// @match        https://www.luogu.com.cn/*
// @match        https://htoj.com.cn/cpp/oj/problem/detail?pid=*
// @match        https://atcoder.jp/contests/*/tasks/*
// @match        https://codeforces.com/contest/*/problem/*
// @match        https://codeforces.com/problemset/problem/*/*
// @match        https://codeforces.com/gym/*/problem/*
// @match        https://hydro.ac/*
// @match        https://www.yanhaozhe.cn/*
// @grant        GM_info
// @grant        GM_openInTab
// @grant        GM_xmlhttpRequest
// @connect      onion-static.netlify.app
// @connect      http://127.0.0.1:20030
// @connect      127.0.0.1
// ==/UserScript==
const SCRIPT_VERSION = "1.2.4-alpha2";

// dist/constants.js
var API_URL = "http://127.0.0.1:20030/createNewProblem";
var PANEL_ID = "fetchProblemPanel";
var TOGGLE_BTN_ID = "fetchProblemToggleBtn";
var TEMP_STATUS_ID = "fetchProblemTempStatus";
var DRAG_THRESHOLD = 5;
var COOLDOWN_DURATION_MS = 3e3;
var GUIDE_POPOVER_ID = "fetchProblemGuidePopover";
var GUIDE_OVERLAY_ID = "fetchProblemGuideOverlay";
var GUIDE_STORAGE_KEY = "fetchProblemGuideShown";
var LOCAL_STORAGE_POS_X = "fetchProblemToggleBtnPosX";
var LOCAL_STORAGE_POS_Y = "fetchProblemToggleBtnPosY";
var STATE_SELECTION_PANEL_ID = "htojStateSelectionPanel";
var CONTROL_BTN_ID = "fetchProblemControlBtn";
var PROBLEM_NAME_MODE_KEY = "fetchProblemNameMode";
var PROBLEM_NAME_CUSTOM_INPUT_KEY = "fetchProblemNameCustomInput";
var STATIC_BASE_URL = "https://static.yaoonion.fun/oicpp";
var LOCAL_STORAGE_LAST_CHECK_TIME = "fetchProblemLastUpdateCheck";
var UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1e3;
var PREVIEW_UPDATE_CHECK_INTERVAL = 1 * 60 * 60 * 1e3;

// dist/utils.js
function makeDraggable(element, handle) {
  let isDragging = false;
  let isMoved = false;
  let startX, startY;
  let initialMouseX, initialMouseY;
  let initialElementRight, initialElementTop;
  handle.addEventListener("mousedown", (e) => {
    isDragging = true;
    isMoved = false;
    startX = e.clientX;
    startY = e.clientY;
    initialMouseX = e.clientX;
    initialMouseY = e.clientY;
    initialElementRight = parseFloat(element.style.right) || 0;
    initialElementTop = parseFloat(element.style.top) || 0;
    if (element.id === TOGGLE_BTN_ID) {
      element.style.cursor = "grabbing";
    }
  });
  document.addEventListener("mouseup", () => {
    isDragging = false;
    if (element.id === TOGGLE_BTN_ID) {
      element.style.cursor = "grab";
      if (isMoved) {
        const finalRight = parseFloat(element.style.right);
        const finalTop = parseFloat(element.style.top);
        localStorage.setItem(LOCAL_STORAGE_POS_X, finalRight.toString());
        localStorage.setItem(LOCAL_STORAGE_POS_Y, finalTop.toString());
        console.log(`OICPP SampleTester: \u6309\u94AE\u4F4D\u7F6E\u5DF2\u4FDD\u5B58: right=${finalRight}, top=${finalTop}`);
      }
    }
  });
  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      e.preventDefault();
      const dx = e.clientX - initialMouseX;
      const dy = e.clientY - initialMouseY;
      const newRight = initialElementRight - dx;
      const newTop = initialElementTop + dy;
      element.style.right = `${newRight}px`;
      element.style.top = `${newTop}px`;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const elementWidth = element.offsetWidth;
      const elementHeight = element.offsetHeight;
      let currentLeft = viewportWidth - newRight - elementWidth;
      let currentTop = newTop;
      if (currentLeft < 0) {
        element.style.right = `${viewportWidth - elementWidth}px`;
      }
      if (currentTop < 0) {
        element.style.top = `0px`;
      }
      if (currentLeft + elementWidth > viewportWidth) {
        element.style.right = `0px`;
      }
      if (currentTop + elementHeight > viewportHeight) {
        element.style.top = `${viewportHeight - elementHeight}px`;
      }
      if (Math.abs(e.clientX - startX) > DRAG_THRESHOLD || Math.abs(e.clientY - startY) > DRAG_THRESHOLD) {
        isMoved = true;
      }
    }
  });
  return { getIsMoved: () => isMoved };
}

// dist/domainConfig.js
var domainConfigs = {
  "luogu.com.cn": {
    ojName: "Luogu",
    codeSelectors: ["pre.lfe-code"],
    problemNameSelector: "h1.lfe-h1",
    extract: () => {
      const rawSnippets = [];
      document.querySelectorAll("pre.lfe-code").forEach((element) => {
        rawSnippets.push(element.textContent);
      });
      let timeLimit = 1e3;
      let memoryLimit = 512;
      const fields = document.querySelectorAll("div.stat.stacked.with-vr.color-inv > div.field");
      fields.forEach((field) => {
        const nameElement = field.querySelector("span.stat-text.name");
        const valueElement = field.querySelector("span.stat-text.value");
        if (nameElement && valueElement) {
          const name = nameElement.textContent.trim();
          const value = valueElement.textContent.trim();
          if (name === "\u65F6\u95F4\u9650\u5236") {
            const match = value.match(/(\d+\.?\d*)\s*(s|ms)/i);
            if (match) {
              const num = parseFloat(match[1]);
              if (match[2].toLowerCase() === "s") {
                timeLimit = num * 1e3;
              } else {
                timeLimit = num;
              }
            }
          } else if (name === "\u5185\u5B58\u9650\u5236") {
            const match = value.match(/(\d+\.?\d*)\s*(mb|gb)/i);
            if (match) {
              const num = parseFloat(match[1]);
              if (match[2].toLowerCase() === "gb") {
                memoryLimit = num * 1024;
              } else {
                memoryLimit = num;
              }
            }
          }
        }
      });
      const samples = [];
      for (let i = 0; i < rawSnippets.length; i += 2) {
        const inputContent = rawSnippets[i];
        const outputContent = rawSnippets[i + 1] || "";
        samples.push({
          id: i / 2 + 1,
          input: inputContent,
          output: outputContent,
          timeLimit,
          memoryLimit
        });
      }
      return { samples, timeLimit, memoryLimit };
    },
    buttonStateKey: "luoguButtonState"
  },
  "www.luogu.com.cn": {
    ojName: "Luogu",
    codeSelectors: ["pre.lfe-code"],
    problemNameSelector: "h1.lfe-h1",
    extract: () => {
      const rawSnippets = [];
      document.querySelectorAll("pre.lfe-code").forEach((element) => {
        rawSnippets.push(element.textContent);
      });
      let timeLimit = 1e3;
      let memoryLimit = 512;
      const fields = document.querySelectorAll("div.stat.stacked.with-vr.color-inv > div.field");
      fields.forEach((field) => {
        const nameElement = field.querySelector("span.stat-text.name");
        const valueElement = field.querySelector("span.stat-text.value");
        if (nameElement && valueElement) {
          const name = nameElement.textContent.trim();
          const value = valueElement.textContent.trim();
          if (name === "\u65F6\u95F4\u9650\u5236") {
            const match = value.match(/(\d+\.?\d*)\s*(s|ms)/i);
            if (match) {
              const num = parseFloat(match[1]);
              if (match[2].toLowerCase() === "s") {
                timeLimit = num * 1e3;
              } else {
                timeLimit = num;
              }
            }
          } else if (name === "\u5185\u5B58\u9650\u5236") {
            const match = value.match(/(\d+\.?\d*)\s*(mb|gb)/i);
            if (match) {
              const num = parseFloat(match[1]);
              if (match[2].toLowerCase() === "gb") {
                memoryLimit = num * 1024;
              } else {
                memoryLimit = num;
              }
            }
          }
        }
      });
      const samples = [];
      for (let i = 0; i < rawSnippets.length; i += 2) {
        const inputContent = rawSnippets[i];
        const outputContent = rawSnippets[i + 1] || "";
        samples.push({
          id: i / 2 + 1,
          input: inputContent,
          output: outputContent,
          timeLimit,
          memoryLimit
        });
      }
      return { samples, timeLimit, memoryLimit };
    },
    buttonStateKey: "luoguButtonState"
  },
  "htoj.com.cn": {
    ojName: "Hetao",
    codeSelectors: ["div.md-editor-code pre code span.md-editor-code-block"],
    problemNameSelector: "h3.text-xl.font-bold.text-colorText",
    specialProblemNameExtraction: (element) => {
      const titleSpans = element.querySelectorAll("span");
      if (titleSpans.length >= 2) {
        const pid = titleSpans[0].textContent.trim();
        const title = titleSpans[1].textContent.trim();
        return `${pid} ${title}`.trim();
      } else if (titleSpans.length === 1) {
        return titleSpans[0].textContent.trim();
      }
      return "";
    },
    extract: () => {
      const rawSnippets = [];
      document.querySelectorAll("div.md-editor-code pre code span.md-editor-code-block").forEach((element) => {
        rawSnippets.push(element.textContent.trim());
      });
      const timeLimitElement = document.querySelector("div.mt-3.inline-flex > div:nth-child(1) > div.mx-3 > div:nth-child(2)");
      const memoryLimitElement = document.querySelector("div.mt-3.inline-flex > div:nth-child(2) > div.mx-3 > div:nth-child(2)");
      const timeLimit = timeLimitElement ? parseInt(timeLimitElement.textContent.trim()) : 1e3;
      const memoryLimit = memoryLimitElement ? parseInt(memoryLimitElement.textContent.trim()) : 512;
      const samples = [];
      for (let i = 0; i < rawSnippets.length; i += 2) {
        const inputContent = rawSnippets[i];
        const outputContent = rawSnippets[i + 1] || "";
        samples.push({
          id: i / 2 + 1,
          input: inputContent,
          output: outputContent,
          timeLimit,
          memoryLimit
        });
      }
      return { samples, timeLimit, memoryLimit };
    },
    buttonStateKey: "htojButtonState"
  },
  "atcoder.jp": {
    ojName: "atcoder",
    codeSelectors: ['pre[id^="pre-sample"]'],
    problemNameSelector: "span.h2",
    specialProblemNameExtraction: (element) => {
      const pathname = window.location.pathname;
      const tasksMatch = pathname.match(/\/tasks\/([^/]+)$/);
      if (tasksMatch && tasksMatch[1]) {
        return tasksMatch[1];
      }
      const clonedTitle = element.cloneNode(true);
      const linkElement = clonedTitle.querySelector("a.btn");
      if (linkElement) {
        linkElement.remove();
      }
      return clonedTitle.textContent.trim();
    },
    extract: () => {
      const rawSnippets = [];
      document.querySelectorAll('pre[id^="pre-sample"]').forEach((element) => {
        rawSnippets.push(element.textContent.trim());
      });
      if (rawSnippets.length % 2 === 0 && rawSnippets.length > 0) {
        const halfLength = rawSnippets.length / 2;
        rawSnippets.splice(halfLength);
      }
      let timeLimit = 2e3;
      let memoryLimit = 1024;
      const pElement = document.querySelector("p");
      if (pElement) {
        const text = pElement.textContent;
        const timeMatch = text.match(/Time Limit:\s*(\d+\.?\d*)\s*(sec|ms)/i);
        if (timeMatch) {
          const num = parseFloat(timeMatch[1]);
          if (timeMatch[2].toLowerCase() === "sec") {
            timeLimit = num * 1e3;
          } else {
            timeLimit = num;
          }
        }
        const memoryMatch = text.match(/Memory Limit:\s*(\d+\.?\d*)\s*(mib|mb|gb)/i);
        if (memoryMatch) {
          const num = parseFloat(memoryMatch[1]);
          if (memoryMatch[2].toLowerCase() === "gb") {
            memoryLimit = num * 1024;
          } else {
            memoryLimit = num;
          }
        }
      }
      const samples = [];
      for (let i = 0; i < rawSnippets.length; i += 2) {
        const inputContent = rawSnippets[i];
        const outputContent = rawSnippets[i + 1] || "";
        samples.push({
          id: i / 2 + 1,
          input: inputContent,
          output: outputContent,
          timeLimit,
          memoryLimit
        });
      }
      return { samples, timeLimit, memoryLimit };
    },
    buttonStateKey: "atcoderButtonState"
  },
  "codeforces.com": {
    ojName: "codeforces",
    codeSelectors: ["div.input pre", "div.output pre"],
    problemNameSelector: "div.title",
    extract: () => {
      const rawSnippets = [];
      const codeforcesLineExtractor = (element) => {
        const lineElements = element.querySelectorAll("div.test-example-line");
        const lines = Array.from(lineElements).map((line) => line.textContent || "");
        if (lines.length > 0) {
          return lines.join("\n").trim();
        }
        const tempElement = element.cloneNode(true);
        const htmlContent = tempElement.innerHTML;
        const replacedHtml = htmlContent.replace(/<br\s*\/?>|<\/\s*br>/gi, "\n");
        tempElement.innerHTML = replacedHtml;
        return (tempElement.textContent || "").trim();
      };
      const inputSnippets = [];
      const outputSnippets = [];
      document.querySelectorAll("div.input pre").forEach((element) => {
        inputSnippets.push(codeforcesLineExtractor(element));
      });
      document.querySelectorAll("div.output pre").forEach((element) => {
        outputSnippets.push(codeforcesLineExtractor(element));
      });
      for (let i = 0; i < inputSnippets.length && i < outputSnippets.length; i++) {
        rawSnippets.push(inputSnippets[i]);
        rawSnippets.push(outputSnippets[i]);
      }
      let timeLimit = 2e3;
      let memoryLimit = 256;
      const timeLimitElement = document.querySelector("div.time-limit");
      if (timeLimitElement) {
        const text = timeLimitElement.textContent;
        const match = text.match(/(\d+\.?\d*)\s*(seconds|second|sec|ms)/i);
        if (match) {
          const num = parseFloat(match[1]);
          if (match[2].toLowerCase().startsWith("sec")) {
            timeLimit = num * 1e3;
          } else {
            timeLimit = num;
          }
        }
      }
      const memoryLimitElement = document.querySelector("div.memory-limit");
      if (memoryLimitElement) {
        const text = memoryLimitElement.textContent;
        const match = text.match(/(\d+\.?\d*)\s*(megabytes|megabyte|mb|gb)/i);
        if (match) {
          const num = parseFloat(match[1]);
          if (match[2].toLowerCase().startsWith("gb")) {
            memoryLimit = num * 1024;
          } else {
            memoryLimit = num;
          }
        }
      }
      const samples = [];
      for (let i = 0; i < rawSnippets.length; i += 2) {
        const inputContent = rawSnippets[i];
        const outputContent = rawSnippets[i + 1] || "";
        samples.push({
          id: i / 2 + 1,
          input: inputContent,
          output: outputContent,
          timeLimit,
          memoryLimit
        });
      }
      return { samples, timeLimit, memoryLimit };
    },
    buttonStateKey: "codeforcesButtonState"
  },
  "hydro.ac": {
    ojName: "Hydro",
    codeSelectors: ["pre.syntax-hl code"],
    problemNameSelector: "h1.section__title",
    extract: () => {
      const rawSnippets = [];
      document.querySelectorAll("div.row > div.code-toolbar.medium-6.columns.sample").forEach((sampleDiv) => {
        const inputCode = sampleDiv.querySelector('code[class^="language-input"]');
        const outputCode = sampleDiv.querySelector('code[class^="language-output"]');
        if (inputCode) {
          rawSnippets.push(inputCode.textContent.trim());
        }
        if (outputCode) {
          rawSnippets.push(outputCode.textContent.trim());
        }
      });
      let timeLimit = 1e3;
      let memoryLimit = 512;
      const timeLimitElement = document.querySelector("span.problem__tag-item.icon.icon-stopwatch");
      if (timeLimitElement) {
        const text = timeLimitElement.textContent;
        const match = text.match(/(\d+\.?\d*)\s*(s|ms)/i);
        if (match) {
          const num = parseFloat(match[1]);
          if (match[2].toLowerCase() === "s") {
            timeLimit = num * 1e3;
          } else {
            timeLimit = num;
          }
        }
      }
      const memoryLimitElement = document.querySelector("span.problem__tag-item.icon.icon-comparison");
      if (memoryLimitElement) {
        const text = memoryLimitElement.textContent;
        const match = text.match(/(\d+\.?\d*)\s*(mib|mb|gb)/i);
        if (match) {
          const num = parseFloat(match[1]);
          if (match[2].toLowerCase() === "gb") {
            memoryLimit = num * 1024;
          } else {
            memoryLimit = num;
          }
        }
      }
      const samples = [];
      for (let i = 0; i < rawSnippets.length; i += 2) {
        const inputContent = rawSnippets[i];
        const outputContent = rawSnippets[i + 1] || "";
        samples.push({
          id: i / 2 + 1,
          input: inputContent,
          output: outputContent,
          timeLimit,
          memoryLimit
        });
      }
      return { samples, timeLimit, memoryLimit };
    },
    buttonStateKey: "hydroButtonState"
  },
  "www.yanhaozhe.cn": {
    ojName: "SYZOJ",
    codeSelectors: ["div.ui.existing.segment pre code"],
    problemNameSelector: "h1.ui.header",
    extract: () => {
      const rawSnippets = [];
      document.querySelectorAll("div.ui.existing.segment pre code").forEach((element) => {
        rawSnippets.push(element.textContent.trim());
      });
      let timeLimit = 1e3;
      let memoryLimit = 256;
      const timeLimitElement = document.evaluate("//span[contains(text(), '\u65F6\u95F4\u9650\u5236\uFF1A')]/text()", document, null, XPathResult.STRING_TYPE, null).stringValue;
      if (timeLimitElement) {
        const match = timeLimitElement.match(/(\d+\.?\d*)\s*(ms|s)/i);
        if (match) {
          const num = parseFloat(match[1]);
          if (match[2].toLowerCase() === "s") {
            timeLimit = num * 1e3;
          } else {
            timeLimit = num;
          }
        }
      }
      const memoryLimitElement = document.evaluate("//span[contains(text(), '\u5185\u5B58\u9650\u5236\uFF1A')]/text()", document, null, XPathResult.STRING_TYPE, null).stringValue;
      if (memoryLimitElement) {
        const match = memoryLimitElement.match(/(\d+\.?\d*)\s*(mib|mb|gb)/i);
        if (match) {
          const num = parseFloat(match[1]);
          if (match[2].toLowerCase() === "gb") {
            memoryLimit = num * 1024;
          } else {
            memoryLimit = num;
          }
        }
      }
      const samples = [];
      for (let i = 0; i < rawSnippets.length; i += 2) {
        const inputContent = rawSnippets[i];
        const outputContent = rawSnippets[i + 1] || "";
        samples.push({
          id: i / 2 + 1,
          input: inputContent,
          output: outputContent,
          timeLimit,
          memoryLimit
        });
      }
      return { samples, timeLimit, memoryLimit };
    },
    buttonStateKey: "SYZOJButtonState"
  }
};

// dist/domSelectors.js
function extractCodeSnippets() {
  console.log("OICPP SampleTester: extractCodeSnippets - \u5F00\u59CB\u63D0\u53D6\u4EE3\u7801\u7247\u6BB5\u3002");
  const rawSnippets = [];
  const hostname = window.location.hostname;
  const config = domainConfigs[hostname];
  if (!config || !config.extract) {
    console.log("OICPP SampleTester: extractCodeSnippets - \u57DF\u540D\u65E0\u7279\u5B9A\u914D\u7F6E\u6216\u63D0\u53D6\u51FD\u6570\uFF0C\u4F7F\u7528\u9ED8\u8BA4\u9009\u62E9\u5668\u3002");
    const rawSnippets2 = [];
    document.querySelectorAll("pre.syntax-hl code").forEach((element) => {
      rawSnippets2.push(element.textContent);
    });
    const pairedSamples = [];
    for (let i = 0; i < rawSnippets2.length; i += 2) {
      const inputContent = rawSnippets2[i];
      const outputContent = rawSnippets2[i + 1] || "";
      pairedSamples.push({
        id: i / 2 + 1,
        input: inputContent,
        output: outputContent,
        timeLimit: 1e3,
        // Default
        memoryLimit: 512
        // Default
      });
    }
    return pairedSamples;
  } else {
    console.log("OICPP SampleTester: extractCodeSnippets - \u4F7F\u7528\u57DF\u540D\u7279\u5B9A\u914D\u7F6E\u548C\u63D0\u53D6\u51FD\u6570:", config);
    const result = config.extract();
    console.log("OICPP SampleTester: extractCodeSnippets - \u63D0\u53D6\u7ED3\u679C:", result);
    return result.samples;
  }
}
function getProblemName() {
  console.log("OICPP SampleTester: getProblemName - \u5F00\u59CB\u63D0\u53D6\u9898\u76EE\u540D\u79F0\u3002");
  const hostname = window.location.hostname;
  const config = domainConfigs[hostname];
  if (!config || !config.problemNameSelector) {
    console.log("OICPP SampleTester: getProblemName - \u672A\u627E\u5230\u914D\u7F6E\u6216\u9898\u76EE\u540D\u79F0\u9009\u62E9\u5668\u3002");
    return "";
  }
  const problemTitleElement = document.querySelector(config.problemNameSelector);
  if (problemTitleElement) {
    let problemName;
    if (config.specialProblemNameExtraction) {
      problemName = config.specialProblemNameExtraction(problemTitleElement);
      console.log("OICPP SampleTester: getProblemName - \u4F7F\u7528\u7279\u6B8A\u63D0\u53D6\u65B9\u6CD5\u3002\u540D\u79F0:", problemName);
    } else {
      problemName = problemTitleElement.textContent.trim();
      console.log("OICPP SampleTester: getProblemName - \u4F7F\u7528\u9ED8\u8BA4\u63D0\u53D6\u65B9\u6CD5\u3002\u540D\u79F0:", problemName);
    }
    return problemName;
  }
  console.log("OICPP SampleTester: getProblemName - \u672A\u627E\u5230\u9898\u76EE\u6807\u9898\u5143\u7D20\u3002");
  return "";
}

// dist/api.js
function sendProblemToAPI(payload, statusMessageElement) {
  console.log("OICPP SampleTester: sendProblemToAPI - \u6B63\u5728\u5411API\u53D1\u9001\u6570\u636E:", payload);
  statusMessageElement.style.color = "blue";
  statusMessageElement.textContent = "\u6B63\u5728\u63D0\u53D6\u4EE3\u7801\u5E76\u53D1\u9001\u8BF7\u6C42...";
  window.GM_xmlhttpRequest({
    method: "POST",
    url: API_URL,
    headers: {
      "Content-Type": "application/json"
    },
    data: JSON.stringify(payload),
    onload: function(response) {
      console.log("OICPP SampleTester: sendProblemToAPI - \u6536\u5230API\u54CD\u5E94\u3002\u72B6\u6001:", response.status, "\u54CD\u5E94\u6587\u672C:", response.responseText);
      try {
        const data = JSON.parse(response.responseText);
        if (response.status === 200) {
          statusMessageElement.style.color = "green";
          statusMessageElement.textContent = `\u6210\u529F: ${data.message}`;
          console.log("OICPP SampleTester: sendProblemToAPI - \u6210\u529F:", data.message);
        } else {
          let errorMessage = `\u9519\u8BEF (${response.status}): ${data.message || "\u672A\u77E5\u9519\u8BEF"}`;
          if (data.invalidField) {
            errorMessage += ` (\u5B57\u6BB5: ${data.invalidField})`;
          }
          alert(errorMessage);
          statusMessageElement.style.color = "red";
          statusMessageElement.textContent = errorMessage;
          console.error("OICPP SampleTester: sendProblemToAPI - API\u9519\u8BEF:", errorMessage, "\u6570\u636E:", data);
        }
      } catch (e) {
        alert(`\u8BF7\u6C42\u6210\u529F\uFF0C\u4F46\u89E3\u6790\u54CD\u5E94\u5931\u8D25: ${e.message}`);
        statusMessageElement.style.color = "red";
        statusMessageElement.textContent = `\u8BF7\u6C42\u6210\u529F\uFF0C\u4F46\u89E3\u6790\u54CD\u5E94\u5931\u8D25: ${e.message}`;
        console.error("OICPP SampleTester: sendProblemToAPI - JSON\u89E3\u6790\u9519\u8BEF:", e.message, "\u54CD\u5E94\u6587\u672C:", response.responseText);
      }
    },
    onerror: function(error) {
      alert(`\u8BF7\u6C42\u5931\u8D25: ${error.statusText || error.responseText || "\u7F51\u7EDC\u9519\u8BEF"}\u3002\u8BF7\u786E\u8BA4OICPP\u662F\u5426\u6B63\u5728\u8FD0\u884C\u3002`);
      statusMessageElement.style.color = "red";
      statusMessageElement.textContent = `\u8BF7\u6C42\u5931\u8D25: ${error.statusText || error.responseText || "\u7F51\u7EDC\u9519\u8BEF"}\u3002\u8BF7\u786E\u8BA4OICPP\u662F\u5426\u6B63\u5728\u8FD0\u884C\u3002`;
      console.error("OICPP SampleTester: GM_xmlhttpRequest \u9519\u8BEF:", error);
    }
  });
}

// dist/eventHandlers.js
var isCooldownActive = false;
var cooldownIntervalId = null;
async function handleToggleButtonClick(config) {
  console.log("OICPP SampleTester: handleToggleButtonClick - \u5207\u6362\u6309\u94AE\u88AB\u70B9\u51FB\u3002\u51B7\u5374\u72B6\u6001:", isCooldownActive);
  const toggleBtn = document.getElementById(TOGGLE_BTN_ID);
  const cooldownCountdownSpan = toggleBtn === null || toggleBtn === void 0 ? void 0 : toggleBtn.querySelector("#cooldownCountdown");
  const statusMessage = createTemporaryStatusMessage();
  if (!toggleBtn || !cooldownCountdownSpan) {
    console.error("OICPP SampleTester: handleToggleButtonClick - \u672A\u627E\u5230\u5207\u6362\u6309\u94AE\u6216\u5012\u8BA1\u65F6\u5143\u7D20\u3002");
    return;
  }
  const toggleBtnRect = toggleBtn.getBoundingClientRect();
  statusMessage.style.top = `${toggleBtnRect.bottom + 10}px`;
  statusMessage.style.left = `${toggleBtnRect.left}px`;
  if (isCooldownActive) {
    console.log("OICPP SampleTester: handleToggleButtonClick - \u51B7\u5374\u4E2D\uFF0C\u963B\u6B62\u65B0\u8BF7\u6C42\u3002");
    statusMessage.style.color = "orange";
    statusMessage.textContent = `\u8BF7\u7A0D\u5019\uFF0C${Math.ceil(COOLDOWN_DURATION_MS / 1e3)}\u79D2\u540E\u53EF\u518D\u6B21\u53D1\u9001\u3002`;
    statusMessage.style.display = "block";
    setTimeout(() => {
      statusMessage.style.display = "none";
    }, 3e3);
    return;
  }
  isCooldownActive = true;
  toggleBtn.disabled = true;
  toggleBtn.style.cursor = "not-allowed";
  cooldownCountdownSpan.style.display = "inline";
  let timeLeft = COOLDOWN_DURATION_MS;
  cooldownIntervalId = window.setInterval(() => {
    timeLeft -= 1e3;
    if (timeLeft <= 0) {
      window.clearInterval(cooldownIntervalId);
      isCooldownActive = false;
      toggleBtn.disabled = false;
      toggleBtn.style.cursor = "grab";
      cooldownCountdownSpan.style.display = "none";
      cooldownCountdownSpan.textContent = "";
      statusMessage.style.display = "none";
    } else {
      cooldownCountdownSpan.textContent = `(${Math.ceil(timeLeft / 1e3)}s)`;
    }
  }, 1e3);
  statusMessage.style.display = "block";
  const oj = config ? config.ojName : "";
  let problemName = "";
  const problemNameMode = localStorage.getItem(PROBLEM_NAME_MODE_KEY) || "default";
  if (problemNameMode === "custom") {
    let customName = await showCustomDialog("\u8BF7\u8F93\u5165\u9898\u76EE\u540D\u79F0 (\u4F8B\u5982: A+B Problem\uFF0C\u5C06\u4FDD\u5B58\u4E3A A+B Problem.cpp): ", localStorage.getItem(PROBLEM_NAME_CUSTOM_INPUT_KEY) || "", true, "\u9898\u76EE\u540D\u79F0");
    if (customName === null || customName.trim() === "") {
      showCustomDialog("\u9898\u76EE\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A\uFF0C\u64CD\u4F5C\u5DF2\u53D6\u6D88\u3002");
      window.clearInterval(cooldownIntervalId);
      isCooldownActive = false;
      toggleBtn.disabled = false;
      toggleBtn.style.cursor = "grab";
      cooldownCountdownSpan.style.display = "none";
      cooldownCountdownSpan.textContent = "";
      return;
    }
    localStorage.setItem(PROBLEM_NAME_CUSTOM_INPUT_KEY, customName.trim());
    problemName = customName.trim();
  } else {
    problemName = getProblemName();
  }
  if (problemName.length > 32) {
    console.warn("OICPP SampleTester: handleToggleButtonClick - \u9898\u76EE\u540D\u79F0\u8FC7\u957F\uFF0C\u5DF2\u622A\u65AD\u81F332\u5B57\u7B26\u3002");
    problemName = problemName.substring(0, 32);
  }
  if (!oj || !problemName) {
    statusMessage.style.color = "red";
    statusMessage.textContent = "OJ \u6216 \u9898\u76EE\u540D\u79F0\u65E0\u6CD5\u81EA\u52A8\u83B7\u53D6\uFF0C\u8BF7\u624B\u52A8\u64CD\u4F5C\u6216\u5237\u65B0\u9875\u9762\u3002";
    showCustomDialog("OJ \u6216 \u9898\u76EE\u540D\u79F0\u65E0\u6CD5\u81EA\u52A8\u83B7\u53D6\uFF0C\u8BF7\u624B\u52A8\u64CD\u4F5C\u6216\u5237\u65B0\u9875\u9762\u3002");
    window.clearInterval(cooldownIntervalId);
    isCooldownActive = false;
    toggleBtn.disabled = false;
    toggleBtn.style.cursor = "grab";
    cooldownCountdownSpan.style.display = "none";
    cooldownCountdownSpan.textContent = "";
    return;
  }
  const samples = extractCodeSnippets();
  if (samples.length === 0) {
    statusMessage.style.color = "red";
    statusMessage.textContent = "\u672A\u627E\u5230\u4EFB\u4F55 <code> \u6807\u7B7E\u53EF\u63D0\u53D6\u3002";
    showCustomDialog("\u672A\u627E\u5230\u4EFB\u4F55 <code> \u6807\u7B7E\u53EF\u63D0\u53D6\u3002");
    window.clearInterval(cooldownIntervalId);
    isCooldownActive = false;
    toggleBtn.disabled = false;
    toggleBtn.style.cursor = "grab";
    cooldownCountdownSpan.style.display = "none";
    cooldownCountdownSpan.textContent = "";
    return;
  }
  const payload = {
    OJ: oj,
    problemName,
    samples
  };
  console.log("OICPP SampleTester: handleToggleButtonClick - \u51C6\u5907\u53D1\u9001\u7684\u6570\u636E:", payload);
  sendProblemToAPI(payload, statusMessage);
  setTimeout(() => {
    statusMessage.style.display = "none";
    statusMessage.textContent = "";
  }, 5e3);
}

// dist/guideSteps.js
var guideSteps = [
  {
    selector: `#${TOGGLE_BTN_ID}`,
    title: "\u91CD\u8981\uFF1A\u786E\u8BA4 OICPP \u8FD0\u884C",
    description: "\u672C\u5DE5\u5177\u9700\u8981\u672C\u5730\u8FD0\u884C\u7684 OICPP \u670D\u52A1\u3002\u8BF7\u786E\u4FDD\u60A8\u7684 OICPP \u5DF2\u542F\u52A8\uFF0C\u5426\u5219\u529F\u80FD\u5C06\u65E0\u6CD5\u6B63\u5E38\u5DE5\u4F5C\u3002"
  },
  {
    selector: `#${TOGGLE_BTN_ID}`,
    title: "\u53EF\u62D6\u52A8\u7684\u6309\u94AE",
    description: "\u8FD9\u4E2A\u84DD\u8272\u7684\u4E0B\u8F7D\u6309\u94AE\u53EF\u4EE5\u968F\u610F\u62D6\u52A8\u5230\u60A8\u559C\u6B22\u7684\u4F4D\u7F6E\uFF0C\u65B9\u4FBF\u64CD\u4F5C\u3002"
  },
  {
    selector: `#${TOGGLE_BTN_ID}`,
    title: "\u70B9\u51FB\u4E0B\u8F7D\u6837\u4F8B",
    description: "\u70B9\u51FB\u6B64\u6309\u94AE\uFF0C\u811A\u672C\u5C06\u81EA\u52A8\u6293\u53D6\u5F53\u524D\u9875\u9762\u7684\u9898\u76EE\u6837\u4F8B\uFF0C\u5E76\u53D1\u9001\u5230 OICPP\u3002\u8BF7\u5C1D\u8BD5\u70B9\u51FB\u5B83\uFF01"
  }
];

// dist/guide.js
var currentGuideStep = 0;
function createGuidePopover() {
  let popover = document.getElementById(GUIDE_POPOVER_ID);
  if (!popover) {
    popover = document.createElement("div");
    popover.id = GUIDE_POPOVER_ID;
    popover.style.cssText = `
            position: absolute;
            background-color: #fff;
            border: 1px solid #007bff;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            padding: 15px;
            max-width: 300px;
            z-index: 2147483647; /* \u786E\u4FDD\u5728\u6700  \u5C42 */
            pointer-events: auto; /* \u786E\u4FDD\u53EF\u4EE5\u70B9\u51FB */
            font-family: Arial, sans-serif;
            font-size: 14px;
            color: #343a40;
            text-align: left;
        `;
    document.body.appendChild(popover);
  }
  popover.innerHTML = `
        <h4 style="margin-top: 0; color: #007bff;"></h4>
        <p style="margin-bottom: 15px;"></p>
        <div style="display: flex; justify-content: space-between;">
            <button id="guideSkipBtn" style="background-color: #6c757d; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">\u8DF3\u8FC7</button>
            <button id="guideNextBtn" style="background-color: #007bff; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">\u4E0B\u4E00\u6B65</button>
        </div>
    `;
  return popover;
}
function createHighlightOverlay() {
  let overlay = document.getElementById(GUIDE_OVERLAY_ID);
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = GUIDE_OVERLAY_ID;
    overlay.style.cssText = `
            position: absolute;
            background-color: rgba(0, 123, 255, 0.2); /* \u534A\u900F\u660E\u84DD\u8272 */
            border: 2px solid #007bff;
            border-radius: 5px;
            z-index: 99999;
            pointer-events: none; /* \u5141\u8BB8\u70B9\u51FB\u7A7F\u900F */
            transition: all 0.3s ease-in-out;
        `;
    document.body.appendChild(overlay);
  }
  return overlay;
}
function positionPopover(popover, targetElement) {
  const targetRect = targetElement.getBoundingClientRect();
  const popoverWidth = popover.offsetWidth;
  const popoverHeight = popover.offsetHeight;
  let top = targetRect.bottom + 10 + window.scrollY;
  let left = targetRect.left + window.scrollX;
  if (left + popoverWidth > window.innerWidth) {
    left = window.innerWidth - popoverWidth - 20;
  }
  if (left < 0) {
    left = 20;
  }
  if (top + popoverHeight > window.innerHeight + window.scrollY) {
    top = targetRect.top - popoverHeight - 10 + window.scrollY;
    if (top < window.scrollY) {
      top = window.scrollY + 20;
    }
  }
  popover.style.top = `${top}px`;
  popover.style.left = `${left}px`;
}
function showGuideStep(stepIndex) {
  if (stepIndex >= guideSteps.length) {
    skipGuide();
    return;
  }
  currentGuideStep = stepIndex;
  const step = guideSteps[currentGuideStep];
  const targetElement = document.querySelector(step.selector);
  if (!targetElement) {
    console.warn(`\u6307\u5F15: \u672A\u627E\u5230\u6B65\u9AA4 ${stepIndex} \u7684\u76EE\u6807\u5143\u7D20: ${step.selector}`);
    nextGuideStep();
    return;
  }
  const popover = createGuidePopover();
  const overlay = createHighlightOverlay();
  popover.querySelector("h4").textContent = step.title;
  popover.querySelector("p").textContent = step.description;
  const targetRect = targetElement.getBoundingClientRect();
  overlay.style.width = `${targetRect.width}px`;
  overlay.style.height = `${targetRect.height}px`;
  overlay.style.top = `${targetRect.top + window.scrollY}px`;
  overlay.style.left = `${targetRect.left + window.scrollX}px`;
  overlay.style.display = "block";
  targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => {
    positionPopover(popover, targetElement);
    popover.style.display = "block";
    const nextBtn = popover.querySelector("#guideNextBtn");
    const skipBtn = popover.querySelector("#guideSkipBtn");
    nextBtn === null || nextBtn === void 0 ? void 0 : nextBtn.removeEventListener("click", nextGuideStep);
    skipBtn === null || skipBtn === void 0 ? void 0 : skipBtn.removeEventListener("click", skipGuide);
    nextBtn === null || nextBtn === void 0 ? void 0 : nextBtn.addEventListener("click", nextGuideStep);
    skipBtn === null || skipBtn === void 0 ? void 0 : skipBtn.addEventListener("click", skipGuide);
    if (currentGuideStep === guideSteps.length - 1) {
      nextBtn.textContent = "\u5B8C\u6210";
    } else {
      nextBtn.textContent = "\u4E0B\u4E00\u6B65";
    }
  }, 300);
}
function nextGuideStep() {
  currentGuideStep++;
  showGuideStep(currentGuideStep);
}
function skipGuide() {
  const popover = document.getElementById(GUIDE_POPOVER_ID);
  const overlay = document.getElementById(GUIDE_OVERLAY_ID);
  if (popover)
    popover.style.display = "none";
  if (overlay)
    overlay.style.display = "none";
  localStorage.setItem(GUIDE_STORAGE_KEY, "true");
}
function startGuide() {
  if (localStorage.getItem(GUIDE_STORAGE_KEY) === "true") {
    return;
  }
  const shouldShowGuide = confirm("\u8C8C\u4F3C\u4F60\u662F\u7B2C\u4E00\u6B21\u4F7F\u7528 OICPP \u6837\u4F8B\u6293\u53D6\u5462\uFF0C\u8981\u770B\u770B\u65B0\u624B\u6559\u7A0B\u5417");
  if (shouldShowGuide) {
    createGuidePopover();
    showGuideStep(0);
  } else {
    skipGuide();
  }
}

// dist/ui.js
function createToggleButtonUI() {
  const toggleBtn = document.createElement("button");
  toggleBtn.id = TOGGLE_BTN_ID;
  toggleBtn.innerHTML = '\u53D1\u9001\u81F3 OICPP <span id="cooldownCountdown" style="display:none; margin-left: 5px;"></span>';
  toggleBtn.title = "\u6293\u53D6\u6837\u4F8B\u5E76\u53D1\u9001\u5230 OICPP";
  toggleBtn.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background-color: #007bff;
        color: white;
        border: none;
        padding: 8px 10px; /* \u8C03\u6574\u586B\u5145\u4EE5\u83B7\u5F97\u66F4\u65B9\u5F62\u7684\u5916\u89C2 */
        border-radius: 4px;
        z-index: 10001;
        cursor: grab;
        font-size: 18px; /* \u589E\u52A0\u5B57\u4F53\u5927\u5C0F\u4EE5\u63D0\u9AD8\u56FE\u6807\u53EF\u89C1\u6027 */
        line-height: 1; /* \u786E\u4FDD\u56FE\u6807\u5782\u76F4\u5C45\u4E2D */
        display: flex; /* \u4F7F\u7528flex\u5BF9\u9F50\u56FE\u6807\u548C\u5012\u8BA1\u65F6 */
        align-items: center;
        justify-content: center;
    `;
  document.body.appendChild(toggleBtn);
  return toggleBtn;
}
function createControlPanelButtonUI() {
  const controlBtn = document.createElement("button");
  controlBtn.id = CONTROL_BTN_ID;
  controlBtn.innerHTML = `\u2699\uFE0F`;
  controlBtn.title = "\u8BBE\u7F6E\u9898\u76EE\u540D\u79F0\u6A21\u5F0F";
  controlBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        z-index: 10001;
    `;
  document.body.appendChild(controlBtn);
  makeDraggable(controlBtn, controlBtn);
  return controlBtn;
}
function createTemporaryStatusMessage() {
  let statusDiv = document.getElementById(TEMP_STATUS_ID);
  if (!statusDiv) {
    statusDiv = document.createElement("div");
    statusDiv.id = TEMP_STATUS_ID;
    statusDiv.style.cssText = `
            position: fixed;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 8px 12px;
            border-radius: 44px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            z-index: 10002;
            font-family: Arial, sans-serif;
            font-size: 13px;
            color: #343a40;
            display: none;
        `;
    document.body.appendChild(statusDiv);
  }
  return statusDiv;
}
function clampButtonPosition(button, currentRight, currentTop) {
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const buttonRect = button.getBoundingClientRect();
  let newRight = currentRight;
  let newTop = currentTop;
  if (viewportWidth - currentRight < buttonRect.width) {
    newRight = viewportWidth - buttonRect.width - 10;
  }
  if (currentRight > viewportWidth - 10) {
    newRight = 10;
  }
  if (viewportHeight - currentTop < buttonRect.height) {
    newTop = viewportHeight - buttonRect.height - 10;
  }
  if (currentTop < 10) {
    newTop = 10;
  }
  newRight = Math.max(10, newRight);
  newTop = Math.max(10, newTop);
  return { right: newRight, top: newTop };
}
function createProblemNameSettingsPanel() {
  let panel = document.getElementById("problemNameSettingsPanel");
  if (panel) {
    panel.remove();
  }
  panel = document.createElement("div");
  panel.id = "problemNameSettingsPanel";
  panel.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #fff;
        border: 1px solid #007bff;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        padding: 20px;
        z-index: 2147483647;
        font-family: Arial, sans-serif;
        font-size: 14px;
        display: flex;
        flex-direction: column;
        gap: 15px;
        width: 300px;
        max-width: 90vw;
    `;
  panel.innerHTML = `
        <h4 style="margin: 0; font-size: 18px; color: #007bff; text-align: center;">\u9898\u76EE\u540D\u79F0\u8BBE\u7F6E</h4>
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <label style="display: flex; align-items: center; gap: 8px;">
                <input type="radio" name="problemNameMode" value="default" id="problemNameModeDefault">
                \u9ED8\u8BA4 (\u4F7F\u7528\u7F51\u9875\u6807\u9898)
            </label>
            <label style="display: flex; align-items: center; gap: 8px;">
                <input type="radio" name="problemNameMode" value="custom" id="problemNameModeCustom">
                \u81EA\u5B9A\u4E49 (\u6BCF\u6B21\u6293\u53D6\u65F6\u8F93\u5165)
            </label>
        </div>
        <button id="saveProblemNameSettingsBtn" style="padding: 10px 15px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 15px; font-weight: bold;">\u4FDD\u5B58</button>
    `;
  document.body.appendChild(panel);
  const savedMode = localStorage.getItem(PROBLEM_NAME_MODE_KEY) || "default";
  const defaultRadio = panel.querySelector("#problemNameModeDefault");
  const customRadio = panel.querySelector("#problemNameModeCustom");
  if (savedMode === "default") {
    defaultRadio.checked = true;
  } else {
    customRadio.checked = true;
  }
  panel.querySelector("#saveProblemNameSettingsBtn").addEventListener("click", () => {
    const selectedMode = document.querySelector('input[name="problemNameMode"]:checked').value;
    localStorage.setItem(PROBLEM_NAME_MODE_KEY, selectedMode);
    showCustomDialog("\u8BBE\u7F6E\u5DF2\u4FDD\u5B58\uFF01");
    panel.remove();
  });
}
function showCustomDialog(message, inputValue = "", showInput = false, inputPlaceholder = "") {
  return new Promise((resolve) => {
    let dialogOverlay = document.getElementById("customDialogOverlay");
    if (!dialogOverlay) {
      dialogOverlay = document.createElement("div");
      dialogOverlay.id = "customDialogOverlay";
      dialogOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 2147483647; /* \u786E\u4FDD\u5728\u6700\u4E0A\u5C42 */
                display: flex;
                align-items: center;
                justify-content: center;
            `;
      document.body.appendChild(dialogOverlay);
    }
    const dialogBox = document.createElement("div");
    dialogBox.style.cssText = `
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            max-width: 400px;
            width: 90%;
            text-align: center;
            font-family: Arial, sans-serif;
            font-size: 14px;
            color: #333;
        `;
    dialogBox.innerHTML = `
            <p style="margin-bottom: 15px; font-size: 16px;">${message}</p>
            ${showInput ? `<input type="text" id="customDialogInput" value="${inputValue}" placeholder="${inputPlaceholder}" style="width: calc(100% - 20px); padding: 8px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 4px;">` : ""}
            <div style="display: flex; justify-content: center; gap: 10px;">
                <button id="customDialogOkBtn" style="padding: 8px 15px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">\u786E\u5B9A</button>
                ${showInput ? `<button id="customDialogCancelBtn" style="padding: 8px 15px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">\u53D6\u6D88</button>` : ""}
            </div>
        `;
    dialogOverlay.appendChild(dialogBox);
    dialogOverlay.style.display = "flex";
    const okBtn = dialogBox.querySelector("#customDialogOkBtn");
    const cancelBtn = dialogBox.querySelector("#customDialogCancelBtn");
    const inputElement = dialogBox.querySelector("#customDialogInput");
    const closeDialog = (result) => {
      dialogOverlay.remove();
      resolve(result);
    };
    okBtn === null || okBtn === void 0 ? void 0 : okBtn.addEventListener("click", () => {
      if (showInput) {
        closeDialog((inputElement === null || inputElement === void 0 ? void 0 : inputElement.value) || "");
      } else {
        closeDialog("ok");
      }
    });
    cancelBtn === null || cancelBtn === void 0 ? void 0 : cancelBtn.addEventListener("click", () => {
      closeDialog(null);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        okBtn === null || okBtn === void 0 ? void 0 : okBtn.click();
      } else if (e.key === "Escape") {
        cancelBtn === null || cancelBtn === void 0 ? void 0 : cancelBtn.click();
      }
    }, { once: true });
    if (showInput && inputElement) {
      inputElement.focus();
    }
  });
}
function createStateSelectionPanel(currentToggleBtn, config, setupHtojButton, setupLuoguButton, setupAtcoderButton, setupCodeforcesButton) {
  let panel = document.getElementById(STATE_SELECTION_PANEL_ID);
  if (panel) {
    panel.remove();
  }
  panel = document.createElement("div");
  panel.id = STATE_SELECTION_PANEL_ID;
  panel.style.cssText = `
        position: fixed;
        background-color: #fff;
        border: 1px solid #007bff;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        padding: 10px;
        z-index: 2147483647;
        font-family: Arial, sans-serif;
        font-size: 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    `;
  const hostname = window.location.hostname;
  const setupButtonState = () => {
    if (hostname === "htoj.com.cn") {
      setupHtojButton();
    } else if (hostname === "www.luogu.com.cn" || hostname === "luogu.com.cn") {
      setupLuoguButton();
    } else if (hostname === "atcoder.jp") {
      setupAtcoderButton();
    } else if (hostname === "codeforces.com") {
      setupCodeforcesButton();
    }
  };
  const floatingBtn = document.createElement("button");
  floatingBtn.textContent = "\u5207\u6362\u5230\u60AC\u6D6E\u72B6\u6001";
  floatingBtn.style.cssText = `
        background-color: #007bff;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
    `;
  floatingBtn.addEventListener("click", () => {
    localStorage.setItem(config.buttonStateKey, "floating");
    setupButtonState();
    panel.remove();
  });
  panel.appendChild(floatingBtn);
  document.body.appendChild(panel);
  const btnRect = currentToggleBtn.getBoundingClientRect();
  panel.style.top = `${btnRect.top}px`;
  panel.style.left = `${btnRect.right + 10}px`;
}
function initializeUI() {
  console.log("OICPP SampleTester: initializeUI - \u6B63\u5728\u521D\u59CB\u5316UI\u3002");
  const hostname = window.location.hostname;
  const config = domainConfigs[hostname];
  console.log("OICPP SampleTester: initializeUI - \u5F53\u524D\u4E3B\u673A\u540D:", hostname, "\u914D\u7F6E:", config);
  const controlBtn = createControlPanelButtonUI();
  controlBtn.addEventListener("click", createProblemNameSettingsPanel);
  let panel = document.getElementById(PANEL_ID);
  let toggleBtn = document.getElementById(TOGGLE_BTN_ID);
  const setupHtojButton = () => {
    let existingBtn = document.getElementById(TOGGLE_BTN_ID);
    if (existingBtn) {
      existingBtn.remove();
    }
    const toggleBtn2 = createToggleButtonUI();
    const savedRight = localStorage.getItem(LOCAL_STORAGE_POS_X);
    const savedTop = localStorage.getItem(LOCAL_STORAGE_POS_Y);
    if (savedRight !== null && savedTop !== null) {
      let right = parseFloat(savedRight);
      let top = parseFloat(savedTop);
      const clampedPosition = clampButtonPosition(toggleBtn2, right, top);
      toggleBtn2.style.right = `${clampedPosition.right}px`;
      toggleBtn2.style.top = `${clampedPosition.top}px`;
      console.log(`OICPP SampleTester: \u5DF2\u52A0\u8F7D\u6309\u94AE\u4F4D\u7F6E (\u60AC\u6D6E): right=${clampedPosition.right}, top=${clampedPosition.top}`);
    } else {
      const defaultRight = 10;
      const defaultTop = 10;
      const clampedPosition = clampButtonPosition(toggleBtn2, defaultRight, defaultTop);
      toggleBtn2.style.right = `${clampedPosition.right}px`;
      toggleBtn2.style.top = `${clampedPosition.top}px`;
      console.log("OICPP SampleTester: \u5DF2\u8BBE\u7F6E\u9ED8\u8BA4\u6309\u94AE\u4F4D\u7F6E (\u60AC\u6D6E)\u3002");
    }
    const toggleBtnDraggable = makeDraggable(toggleBtn2, toggleBtn2);
    toggleBtn2.addEventListener("click", (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        createStateSelectionPanel(toggleBtn2, config, setupHtojButton, setupLuoguButton, setupAtcoderButton, setupCodeforcesButton);
      } else if (toggleBtnDraggable.getIsMoved()) {
        e.preventDefault();
        console.log("OICPP SampleTester: initializeUI - \u5207\u6362\u6309\u94AE\u88AB\u62D6\u52A8\uFF0C\u963B\u6B62\u70B9\u51FB\u4E8B\u4EF6\u3002");
      } else {
        handleToggleButtonClick(config);
      }
    });
    console.log("OICPP SampleTester: initializeUI - HTOJ \u6309\u94AE (\u60AC\u6D6E) \u5DF2\u63D2\u5165\u3002");
  };
  const setupLuoguButton = () => {
    let existingBtn = document.getElementById(TOGGLE_BTN_ID);
    if (existingBtn) {
      existingBtn.remove();
    }
    const toggleBtn2 = createToggleButtonUI();
    const savedRight = localStorage.getItem(LOCAL_STORAGE_POS_X);
    const savedTop = localStorage.getItem(LOCAL_STORAGE_POS_Y);
    if (savedRight !== null && savedTop !== null) {
      toggleBtn2.style.right = `${parseFloat(savedRight)}px`;
      toggleBtn2.style.top = `${parseFloat(savedTop)}px`;
      console.log(`OICPP SampleTester: \u5DF2\u52A0\u8F7D\u6309\u94AE\u4F4D\u7F6E (Luogu \u60AC\u6D6E): right=${savedRight}, top=${savedTop}`);
    } else {
      toggleBtn2.style.right = "10px";
      toggleBtn2.style.top = "10px";
      console.log("OICPP SampleTester: \u5DF2\u8BBE\u7F6E\u9ED8\u8BA4\u6309\u94AE\u4F4D\u7F6E (Luogu \u60AC\u6D6E)\u3002");
    }
    const toggleBtnDraggable = makeDraggable(toggleBtn2, toggleBtn2);
    toggleBtn2.addEventListener("click", (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        createStateSelectionPanel(toggleBtn2, config, setupHtojButton, setupLuoguButton, setupAtcoderButton, setupCodeforcesButton);
      } else if (toggleBtnDraggable.getIsMoved()) {
        e.preventDefault();
        console.log("OICPP SampleTester: initializeUI - \u5207\u6362\u6309\u94AE\u88AB\u62D6\u52A8\uFF0C\u963B\u6B62\u70B9\u51FB\u4E8B\u4EF6 (Luogu)\u3002");
      } else {
        handleToggleButtonClick(config);
      }
    });
    console.log("OICPP SampleTester: initializeUI - Luogu \u6309\u94AE (\u60AC\u6D6E) \u5DF2\u63D2\u5165\u3002");
  };
  const setupAtcoderButton = () => {
    let existingBtn = document.getElementById(TOGGLE_BTN_ID);
    if (existingBtn) {
      existingBtn.remove();
    }
    const toggleBtn2 = createToggleButtonUI();
    const savedRight = localStorage.getItem(LOCAL_STORAGE_POS_X);
    const savedTop = localStorage.getItem(LOCAL_STORAGE_POS_Y);
    if (savedRight !== null && savedTop !== null) {
      toggleBtn2.style.right = `${parseFloat(savedRight)}px`;
      toggleBtn2.style.top = `${parseFloat(savedTop)}px`;
      console.log(`OICPP SampleTester: \u5DF2\u52A0\u8F7D\u6309\u94AE\u4F4D\u7F6E (Atcoder \u60AC\u6D6E): right=${savedRight}, top=${savedTop}`);
    } else {
      toggleBtn2.style.right = "10px";
      toggleBtn2.style.top = "10px";
      console.log("OICPP SampleTester: \u5DF2\u8BBE\u7F6E\u9ED8\u8BA4\u6309\u94AE\u4F4D\u7F6E (\u60AC\u6D6E)\u3002");
    }
    const toggleBtnDraggable = makeDraggable(toggleBtn2, toggleBtn2);
    toggleBtn2.addEventListener("click", (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        createStateSelectionPanel(toggleBtn2, config, setupHtojButton, setupLuoguButton, setupAtcoderButton, setupCodeforcesButton);
      } else if (toggleBtnDraggable.getIsMoved()) {
        e.preventDefault();
        console.log("OICPP SampleTester: initializeUI - \u5207\u6362\u6309\u94AE\u88AB\u62D6\u52A8\uFF0C\u963B\u6B62\u70B9\u51FB\u4E8B\u4EF6 (Atcoder)\u3002");
      } else {
        handleToggleButtonClick(config);
      }
    });
    console.log("OICPP SampleTester: initializeUI - Atcoder \u6309\u94AE (\u60AC\u6D6E) \u5DF2\u63D2\u5165\u3002");
  };
  const setupCodeforcesButton = () => {
    let existingBtn = document.getElementById(TOGGLE_BTN_ID);
    if (existingBtn) {
      existingBtn.remove();
    }
    const toggleBtn2 = createToggleButtonUI();
    const savedRight = localStorage.getItem(LOCAL_STORAGE_POS_X);
    const savedTop = localStorage.getItem(LOCAL_STORAGE_POS_Y);
    if (savedRight !== null && savedTop !== null) {
      toggleBtn2.style.right = `${parseFloat(savedRight)}px`;
      toggleBtn2.style.top = `${parseFloat(savedTop)}px`;
      console.log(`OICPP SampleTester: \u5DF2\u52A0\u8F7D\u6309\u94AE\u4F4D\u7F6E (Codeforces \u60AC\u6D6E): right=${savedRight}, top=${savedTop}`);
    } else {
      toggleBtn2.style.right = "10px";
      toggleBtn2.style.top = "10px";
      console.log("OICPP SampleTester: \u5DF2\u8BBE\u7F6E\u9ED8\u8BA4\u6309\u94AE\u4F4D\u7F6E (\u60AC\u6D6E)\u3002");
    }
    const toggleBtnDraggable = makeDraggable(toggleBtn2, toggleBtn2);
    toggleBtn2.addEventListener("click", (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        createStateSelectionPanel(toggleBtn2, config, setupHtojButton, setupLuoguButton, setupAtcoderButton, setupCodeforcesButton);
      } else if (toggleBtnDraggable.getIsMoved()) {
        e.preventDefault();
        console.log("OICPP SampleTester: initializeUI - \u5207\u6362\u6309\u94AE\u88AB\u62D6\u52A8\uFF0C\u963B\u6B62\u70B9\u51FB\u4E8B\u4EF6 (Codeforces)\u3002");
      } else {
        handleToggleButtonClick(config);
      }
    });
    console.log("OICPP SampleTester: initializeUI - Codeforces \u6309\u94AE (\u60AC\u6D6E) \u5DF2\u63D2\u5165\u3002");
  };
  if (hostname === "htoj.com.cn") {
    setupHtojButton();
  } else if (hostname === "www.luogu.com.cn" || hostname === "luogu.com.cn") {
    setupLuoguButton();
  } else if (hostname === "atcoder.jp") {
    setupAtcoderButton();
  } else if (hostname === "codeforces.com") {
    setupCodeforcesButton();
  } else {
    let currentToggleBtn = document.getElementById(TOGGLE_BTN_ID);
    if (!currentToggleBtn) {
      console.log("OICPP SampleTester: initializeUI - \u672A\u627E\u5230\u5207\u6362\u6309\u94AE\uFF0C\u6B63\u5728\u521B\u5EFA\u3002");
      currentToggleBtn = createToggleButtonUI();
    }
    const savedRight = localStorage.getItem(LOCAL_STORAGE_POS_X);
    const savedTop = localStorage.getItem(LOCAL_STORAGE_POS_Y);
    if (savedRight !== null && savedTop !== null) {
      let right = parseFloat(savedRight);
      let top = parseFloat(savedTop);
      const clampedPosition = clampButtonPosition(currentToggleBtn, right, top);
      currentToggleBtn.style.right = `${clampedPosition.right}px`;
      currentToggleBtn.style.top = `${clampedPosition.top}px`;
      console.log(`OICPP SampleTester: \u5DF2\u52A0\u8F7D\u6309\u94AE\u4F4D\u7F6E: right=${clampedPosition.right}, top=${clampedPosition.top}`);
    } else {
      const defaultRight = 10;
      const defaultTop = 10;
      const clampedPosition = clampButtonPosition(currentToggleBtn, defaultRight, defaultTop);
      currentToggleBtn.style.right = `${clampedPosition.right}px`;
      currentToggleBtn.style.top = `${clampedPosition.top}px`;
      console.log("OICPP SampleTester: \u5DF2\u8BBE\u7F6E\u9ED8\u8BA4\u6309\u94AE\u4F4D\u7F6E\u3002");
    }
    const toggleBtnDraggable = makeDraggable(currentToggleBtn, currentToggleBtn);
    currentToggleBtn.addEventListener("click", (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        createStateSelectionPanel(currentToggleBtn, config, setupHtojButton, setupLuoguButton, setupAtcoderButton, setupCodeforcesButton);
      } else if (toggleBtnDraggable.getIsMoved()) {
        e.preventDefault();
        console.log("OICPP SampleTester: initializeUI - \u5207\u6362\u6309\u94AE\u88AB\u62D6\u52A8\uFF0C\u963B\u6B62\u70B9\u51FB\u4E8B\u4EF6\u3002");
        return;
      }
      handleToggleButtonClick(config);
    });
  }
  if (localStorage.getItem(GUIDE_STORAGE_KEY) !== "true") {
    console.log("OICPP SampleTester: initializeUI - \u6307\u5F15\u672A\u663E\u793A\u8FC7\uFF0C\u6B63\u5728\u542F\u52A8\u6307\u5F15\u3002");
    startGuide();
  } else {
    console.log("OICPP SampleTester: initializeUI - \u6307\u5F15\u5DF2\u663E\u793A\u3002");
  }
  window.addEventListener("resize", () => {
    const savedRight = localStorage.getItem(LOCAL_STORAGE_POS_X);
    const savedTop = localStorage.getItem(LOCAL_STORAGE_POS_Y);
    const toggleBtn2 = document.getElementById(TOGGLE_BTN_ID);
    if (toggleBtn2 && savedRight !== null && savedTop !== null) {
      let right = parseFloat(savedRight);
      let top = parseFloat(savedTop);
      const clampedPosition = clampButtonPosition(toggleBtn2, right, top);
      toggleBtn2.style.right = `${clampedPosition.right}px`;
      toggleBtn2.style.top = `${clampedPosition.top}px`;
      console.log(`OICPP SampleTester: \u7A97\u53E3\u5927\u5C0F\u8C03\u6574\uFF0C\u91CD\u65B0\u5E94\u7528\u6309\u94AE\u4F4D\u7F6E: right=${clampedPosition.right}, top=${clampedPosition.top}`);
    } else if (toggleBtn2) {
      const defaultRight = 10;
      const defaultTop = 10;
      const clampedPosition = clampButtonPosition(toggleBtn2, defaultRight, defaultTop);
      toggleBtn2.style.right = `${clampedPosition.right}px`;
      toggleBtn2.style.top = `${clampedPosition.top}px`;
      console.log("OICPP SampleTester: \u7A97\u53E3\u5927\u5C0F\u8C03\u6574\uFF0C\u8BBE\u7F6E\u9ED8\u8BA4\u6309\u94AE\u4F4D\u7F6E\u3002");
    }
  });
}

// dist/checkUpdate.js
async function checkUpdate() {
  const lastCheckTime = parseInt(localStorage.getItem(LOCAL_STORAGE_LAST_CHECK_TIME) || "0");
  const now = Date.now();
  const isStandardVersion = /^[0-9]+\.[0-9]+\.[0-9]+$/.test(SCRIPT_VERSION);
  const currentCheckInterval = isStandardVersion ? UPDATE_CHECK_INTERVAL : PREVIEW_UPDATE_CHECK_INTERVAL;
  if (now - lastCheckTime < currentCheckInterval) {
    console.log("OICPP SampleTester: \u8DDD\u79BB\u4E0A\u6B21\u68C0\u67E5\u66F4\u65B0\u65F6\u95F4\u4E0D\u8DB3\uFF0C\u8DF3\u8FC7\u68C0\u67E5\u3002");
    return;
  }
  console.log("OICPP SampleTester: \u6B63\u5728\u68C0\u67E5\u66F4\u65B0...");
  localStorage.setItem(LOCAL_STORAGE_LAST_CHECK_TIME, now.toString());
  const versionPath = isStandardVersion ? "pub" : "perv";
  const updateUrl = `${STATIC_BASE_URL}/${versionPath}/version.json`;
  window.GM_xmlhttpRequest({
    method: "GET",
    url: updateUrl,
    onload: function(response) {
      try {
        const remotePackageJson = JSON.parse(response.responseText);
        const remoteVersion = remotePackageJson.version;
        if (remoteVersion && remoteVersion !== SCRIPT_VERSION) {
          console.log(`OICPP SampleTester: \u53D1\u73B0\u65B0\u7248\u672C\uFF01\u5F53\u524D\u7248\u672C: ${SCRIPT_VERSION}, \u6700\u65B0\u7248\u672C: ${remoteVersion}`);
          const userScriptFileName = "sampleTester.user.js";
          const userScriptUrl = `${STATIC_BASE_URL}/${versionPath}/${userScriptFileName}`;
          if (confirm(`OICPP SampleTester: \u53D1\u73B0\u65B0\u7248\u672C ${remoteVersion}\uFF01\u70B9\u51FB\u786E\u5B9A\u5728\u65B0\u6807\u7B7E\u9875\u4E2D\u6253\u5F00\u66F4\u65B0\u3002`)) {
            window.GM_openInTab(userScriptUrl, false);
          }
        } else {
          console.log("OICPP SampleTester: \u5F53\u524D\u5DF2\u662F\u6700\u65B0\u7248\u672C\u3002");
        }
      } catch (error) {
        console.error("OICPP SampleTester: \u89E3\u6790\u66F4\u65B0\u4FE1\u606F\u5931\u8D25:", error);
      }
    },
    onerror: function(response) {
      console.error("OICPP SampleTester: \u68C0\u67E5\u66F4\u65B0\u5931\u8D25:", response.status, response.statusText);
    }
  });
}

// dist/main.js
(function() {
  "use strict";
  console.log("OICPP SampleTester: \u6CB9\u7334\u811A\u672C\u5DF2\u52A0\u8F7D\u3002");
  initializeUI();
  checkUpdate();
})();
