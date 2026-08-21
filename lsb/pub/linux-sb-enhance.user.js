// ==UserScript==
// @name         LINUX.SB-Enhance-Script
// @namespace    https://linux.sb/
// @version      2.2.0
// @description  布局优化与功能增强脚本，包含主题布局、内容过滤、图片灯箱、可配置图床上传、自动签到、首页身份、UID、侧栏常驻版块列表与头像悬停基础资料卡。
// @author       COMCOM + Incremental Marker & YaoOnion
// @match        https://linux.sb/*
// @match        http://linux.sb/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// @grant        GM_openInTab
// @connect      *
// @run-at       document-start
// @license      MIT
// @downloadURL https://static.yaoonion.fun/lsb/pub/linux-sb-enhance.user.js
// @updateURL https://static.yaoonion.fun/lsb/pub/linux-sb-enhance.user.js
// ==/UserScript==
(() => {
  // dist/constants.js
  var STORAGE_KEY = "linux-sb-wide-layout-settings-v2";
  var SETTINGS_VERSION = 6;
  var IMGUR_PRESET = {
    provider: "imgur",
    host: "https://imgur.com/",
    endpoint: "https://api.imgur.com/3/image",
    field: "image",
    responsePath: "data.link",
    authMode: "imgur-client-id",
    token: ""
  };
  var CATBOX_PRESET = {
    provider: "catbox",
    host: "https://catbox.moe/",
    endpoint: "https://catbox.moe/user/api.php",
    field: "fileToUpload",
    responsePath: "",
    authMode: "none",
    token: ""
  };
  var POSTIMAGES_PRESET = {
    provider: "postimages",
    host: "https://postimages.org/",
    endpoint: "https://postimages.org/json",
    field: "upfile",
    responsePath: "",
    authMode: "none",
    token: ""
  };
  var FREEIMAGE_PRESET = {
    provider: "freeimage",
    host: "https://freeimage.host/",
    endpoint: "https://freeimage.host/api/1/upload",
    field: "source",
    responsePath: "image.url",
    authMode: "none",
    token: "",
    key: "6d207e02198a847aa98d0a2a901485a5"
  };
  var DEFAULTS = {
    version: SETTINGS_VERSION,
    maxWidth: 1100,
    headerHeight: 68,
    fontSize: 15,
    radius: 6,
    sidebarWidth: 270,
    shellPadding: 28,
    columnGap: 28,
    theme: "neutral",
    accent: "#b8b8b8",
    textPalette: "neutral",
    textColor: "#eeeeee",
    homePersonalized: false,
    homePostNewWindow: false,
    realtimeRefresh: false,
    realtimeRefreshInterval: 60,
    sidebarSwap: false,
    identityBadges: true,
    uidBadges: true,
    avatarProfileCard: true,
    autoCheckin: false,
    autoCheckinLastDate: "",
    imageLightbox: false,
    imageUpload: false,
    imageUploadProvider: "freeimage",
    imageUploadHost: FREEIMAGE_PRESET.host,
    imageUploadEndpoint: FREEIMAGE_PRESET.endpoint,
    imageUploadFileField: FREEIMAGE_PRESET.field,
    imageUploadResponsePath: FREEIMAGE_PRESET.responsePath,
    imageUploadAuthMode: FREEIMAGE_PRESET.authMode,
    imageUploadToken: "",
    imageUploadSettingsCollapsed: false,
    imageUploadProfiles: [],
    imageUploadActiveProfileId: "",
    panelLeft: null,
    panelTop: null,
    toggleLeft: null,
    toggleTop: null,
    titleFilters: [],
    userFilters: []
  };
  var NODEIMAGE_PRESET = {
    provider: "nodeimage",
    host: "https://nodeimage.com/",
    endpoint: "https://api.nodeimage.com/api/upload",
    field: "image",
    responsePath: "data.url",
    authMode: "nodeimage-api-key",
    token: ""
  };
  var TEXT_PALETTES = {
    neutral: { label: "\u4E2D\u6027\u94F6\u767D", color: "#eeeeee" },
    mist: { label: "\u96FE\u7070", color: "#d6d6d6" },
    silver: { label: "\u67D4\u94F6", color: "#c7c7c7" },
    warm: { label: "\u6696\u767D", color: "#eee9e1" },
    custom: { label: "\u81EA\u5B9A\u4E49\u989C\u8272", color: "#eeeeee" }
  };
  var IDENTITY_DEFINITIONS = {
    creator: { label: "\u521B\u4F5C\u8005", aliases: ["\u521B\u4F5C\u8005"] },
    aiRobot: { label: "AI\u673A\u5668\u4EBA", aliases: ["AI\u673A\u5668\u4EBA", "AI \u673A\u5668\u4EBA"] },
    communityHost: { label: "\u793E\u533A\u4E3B\u7406\u4EBA", aliases: ["\u793E\u533A\u4E3B\u7406\u4EBA"] }
    // 示例：newRole: { label: '新身份', aliases: ['站点实际身份文案'] }
  };
  var HOME_PROFILE_CACHE_TTL = 10 * 60 * 1e3;
  var HOME_PRIVATE_DATA_CACHE_TTL = 60 * 1e3;
  var HOME_LOGO_SVG = [
    '<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="LINUX SB logo">',
    '<circle fill="#EFEFEF" cx="256" cy="256" r="256"/>',
    '<path d="M279.69124,269.784594 C289.092146,253.471257 283.562201,232.595717 267.248865,223.194811 C250.935529,213.793906 230.059989,219.32385 220.659083,235.637186 L212.087669,250.429788 C202.686764,266.743124 208.216708,287.618664 224.530044,297.01957 C240.84338,306.420476 261.718921,300.890531 271.119826,284.577195 L279.69124,269.784594 Z" fill="#737373"/>',
    '<path d="M298.6313,68.356366 C308.032206,52.04303 302.502261,31.1674897 286.188925,21.7665841 C269.875589,12.3656785 249.000048,17.895623 239.599143,34.208959 L145.866584,196.651078 C136.465678,212.964414 141.995623,233.839955 158.308959,243.24086 C174.622295,252.641766 195.497836,247.111821 204.898741,230.798485 L298.6313,68.356366 Z" fill="#1E1E20"/>',
    '<path d="M355.419725,307.249829 C364.82523,290.910346 359.29258,270.001346 342.971263,260.585373 C326.649946,251.1694 305.764193,256.708207 296.358689,273.047691 L202.580275,435.750171 C193.17477,452.089654 198.70742,472.998654 215.028737,482.414627 C231.350054,491.8306 252.235807,486.291793 261.641311,469.952309 L355.419725,307.249829 Z" fill="#FEB005"/>',
    "</svg>"
  ].join("");
  var RANGE_DEFINITIONS = [
    { key: "maxWidth", label: "\u9875\u9762\u6700\u5927\u5BBD\u5EA6", min: 960, max: 2200, step: 20, unit: "px" },
    { key: "headerHeight", label: "\u9876\u90E8\u680F\u9AD8\u5EA6", min: 48, max: 100, step: 2, unit: "px" },
    { key: "fontSize", label: "\u6B63\u6587\u57FA\u51C6\u5B57\u53F7", min: 13, max: 22, step: 1, unit: "px" },
    { key: "radius", label: "\u5168\u5C40\u5706\u89D2", min: 0, max: 14, step: 1, unit: "px" },
    { key: "sidebarWidth", label: "\u4FA7\u680F\u5BBD\u5EA6", min: 220, max: 420, step: 10, unit: "px" },
    { key: "shellPadding", label: "\u5185\u5BB9\u5185\u8FB9\u8DDD", min: 12, max: 56, step: 2, unit: "px" },
    { key: "columnGap", label: "\u6B63\u6587\u4E0E\u4FA7\u680F\u95F4\u8DDD", min: 12, max: 56, step: 2, unit: "px" }
  ];
  var THEMES = {
    neutral: {
      label: "\u4E2D\u6027\u6DF1\u7070\uFF08\u9ED8\u8BA4\uFF09",
      accent: "#b8b8b8",
      textColor: "#eeeeee",
      vars: {
        "--bg": "#121212",
        "--panel": "#1b1b1b",
        "--line": "#343434",
        "--line-soft": "#272727",
        "--text": "#eeeeee",
        "--text-muted": "#b6b6b6",
        "--text-subtle": "#898989",
        "--text-disabled": "#666666",
        "--success": "#9fbea9",
        "--success-soft": "#223128",
        "--danger": "#e28b8b",
        "--danger-soft": "#3a2424",
        "--warning": "#d8b276",
        "--warning-soft": "#382e20",
        "--info": "#9bb4d0",
        "--info-soft": "#25303b",
        "--inverse": "#090909",
        "--inverse-border": "#3a3a3a",
        "--inverse-text": "#f5f5f5",
        "--color-dark-rgb": "0,0,0",
        "--backdrop": "rgba(0,0,0,.68)",
        "--shadow-base": "rgba(0,0,0,.28)",
        "--shadow-medium": "rgba(0,0,0,.48)"
      }
    },
    graphite: {
      label: "\u77F3\u58A8\u9752",
      accent: "#7faea6",
      textColor: "#ecf0f2",
      vars: {
        "--bg": "#111416",
        "--panel": "#191d20",
        "--line": "#30363b",
        "--line-soft": "#24292d",
        "--text": "#ecf0f2",
        "--text-muted": "#a9b1b7",
        "--text-subtle": "#77818a",
        "--text-disabled": "#5f686f",
        "--success": "#8bb59b",
        "--success-soft": "#203329",
        "--danger": "#df8888",
        "--danger-soft": "#382326",
        "--warning": "#d2ab70",
        "--warning-soft": "#362d20",
        "--info": "#8fafd0",
        "--info-soft": "#24303c",
        "--inverse": "#090b0c",
        "--inverse-border": "#343b40",
        "--inverse-text": "#f4f7f8",
        "--color-dark-rgb": "3,5,6",
        "--backdrop": "rgba(3,5,6,.68)",
        "--shadow-base": "rgba(0,0,0,.30)",
        "--shadow-medium": "rgba(0,0,0,.50)"
      }
    },
    warm: {
      label: "\u6696\u77F3\u58A8",
      accent: "#b8a27f",
      textColor: "#eee9e1",
      vars: {
        "--bg": "#151310",
        "--panel": "#1e1b17",
        "--line": "#37322b",
        "--line-soft": "#29251f",
        "--text": "#eee9e1",
        "--text-muted": "#b8afa3",
        "--text-subtle": "#8b8277",
        "--text-disabled": "#685f55",
        "--success": "#a3b68e",
        "--success-soft": "#293022",
        "--danger": "#df8e84",
        "--danger-soft": "#3a2521",
        "--warning": "#d4ad70",
        "--warning-soft": "#392f20",
        "--info": "#99adc2",
        "--info-soft": "#283039",
        "--inverse": "#0b0a08",
        "--inverse-border": "#3b362f",
        "--inverse-text": "#f7f3ec",
        "--color-dark-rgb": "5,4,3",
        "--backdrop": "rgba(5,4,3,.68)",
        "--shadow-base": "rgba(0,0,0,.28)",
        "--shadow-medium": "rgba(0,0,0,.48)"
      }
    },
    original: {
      label: "\u8DDF\u968F\u539F\u7AD9\u4E3B\u9898",
      accent: "#5eaaa0",
      textColor: "#c8c9d9",
      vars: null
    }
  };
  var THEME_VARIABLES = [
    "--bg",
    "--panel",
    "--line",
    "--line-soft",
    "--text",
    "--text-muted",
    "--text-subtle",
    "--text-disabled",
    "--brand",
    "--brand-hover",
    "--brand-soft",
    "--success",
    "--success-soft",
    "--danger",
    "--danger-soft",
    "--warning",
    "--warning-soft",
    "--info",
    "--info-soft",
    "--inverse",
    "--inverse-border",
    "--inverse-text",
    "--color-dark-rgb",
    "--backdrop",
    "--shadow-base",
    "--shadow-medium",
    "--focus-ring",
    "--swal2-background",
    "--swal2-color",
    "--swal2-validation-message-background",
    "--swal2-validation-message-color"
  ];
  var BASE_CSS = [
    "@media (min-width: 721px) {",
    "  :root {",
    "    --font-size-sm: calc(var(--lsb-base-font-size) - 2px) !important;",
    "    --font-size-md: var(--lsb-base-font-size) !important;",
    "    --font-size-lg: calc(var(--lsb-base-font-size) + 1px) !important;",
    "  }",
    "  body { font-size: var(--lsb-base-font-size) !important; }",
    "  .top .bar {",
    "    width: min(var(--lsb-wide-max), calc(100vw - 48px)) !important;",
    "    max-width: none !important;",
    "    min-height: var(--lsb-header-height) !important;",
    "    padding: 0 20px !important;",
    "    grid-template-rows: var(--lsb-header-height) !important;",
    "    column-gap: 16px !important;",
    "  }",
    "  .top .brand { font-size: var(--lsb-base-font-size) !important; }",
    "  .top .brand::before { width: 28px !important; height: 28px !important; flex-basis: 28px !important; }",
    "  .top .search-form { width: 280px !important; height: 36px !important; }",
    "  main.wrap, .footer, .forum-more-panel {",
    "    width: min(var(--lsb-wide-max), calc(100vw - 48px)) !important;",
    "    max-width: none !important;",
    "  }",
    "  main.wrap { padding: 18px 0 28px !important; }",
    "  .home-shell { padding: var(--lsb-shell-padding) !important; }",
    "  .home-shell .forum-layout, .forum-layout { gap: var(--lsb-column-gap) !important; }",
    "  .home-shell .forum-layout {",
    "    display: grid !important; grid-template-columns: minmax(0, 1fr) var(--lsb-sidebar-width) !important;",
    "    align-items: start !important;",
    "  }",
    "  .home-shell .forum-main { grid-column: 1 !important; grid-row: 1 !important; }",
    "  .home-shell .sidebar { grid-column: 2 !important; grid-row: 1 !important; }",
    "  .home-shell .forum-layout.lsb-home-sidebar-swapped {",
    "    grid-template-columns: var(--lsb-sidebar-width) minmax(0, 1fr) !important;",
    "  }",
    "  .home-shell .forum-layout.lsb-home-sidebar-swapped > .forum-main { grid-column: 2 !important; grid-row: 1 !important; }",
    "  .home-shell .forum-layout.lsb-home-sidebar-swapped > .sidebar { grid-column: 1 !important; grid-row: 1 !important; }",
    "  .home-shell .forum-layout.lsb-home-personalized-layout { row-gap: 0 !important; }",
    "  .home-shell .forum-layout.lsb-home-personalized-layout > #lsb-home-personalization {",
    "    grid-column: 1 / -1 !important; grid-row: 1 !important; min-width: 0; width: 100%; box-sizing: border-box;",
    "  }",
    "  .home-shell .forum-layout.lsb-home-personalized-layout > .forum-main { grid-column: 1 !important; grid-row: 2 !important; }",
    "  .home-shell .forum-layout.lsb-home-personalized-layout > .sidebar { grid-column: 2 !important; grid-row: 2 !important; }",
    "  .home-shell .forum-layout.lsb-home-personalized-layout.lsb-home-sidebar-swapped > .forum-main { grid-column: 2 !important; grid-row: 2 !important; }",
    "  .home-shell .forum-layout.lsb-home-personalized-layout.lsb-home-sidebar-swapped > .sidebar { grid-column: 1 !important; grid-row: 2 !important; }",
    "  .sidebar { width: var(--lsb-sidebar-width) !important; }",
    "  /* \u7248\u5757\u5217\u8868\u6301\u7EED\u5E38\u9A7B\uFF1A\u62C9\u4F38\u5176\u6240\u5728\u4FA7\u680F\u81F3\u4E3B\u5185\u5BB9\u9AD8\u5EA6\uFF0C\u907F\u514D sticky \u5728\u4FA7\u680F\u5185\u5BB9\u672B\u5C3E\u63D0\u524D\u505C\u6B62\u3002 */",
    "  @supports selector(.forum-layout:has(> .sidebar > .forum-enhancements-sidebar-card)) {",
    "    .forum-layout:has(> .sidebar > .forum-enhancements-sidebar-card) > .sidebar { align-self: stretch !important; }",
    "    .forum-layout:has(> .sidebar > .forum-enhancements-sidebar-card) > .sidebar > .forum-enhancements-sidebar-card {",
    "      position: sticky !important; top: 12px; z-index: 2; align-self: flex-start;",
    "      max-height: calc(100vh - 12px - 240px); overflow-y: auto; overscroll-behavior: contain; scrollbar-gutter: stable;",
    "    }",
    "    .forum-layout:has(> .sidebar > .forum-enhancements-sidebar-card) > .sidebar > .forum-enhancements-sidebar-card .forum-enhancements-sidebar-list { min-width: 0; }",
    "  }",
    "  .post-item { min-height: 64px !important; padding-top: 13px !important; padding-bottom: 13px !important; }",
    "  .post-title, .post-content, .notification-content { font-size: var(--lsb-base-font-size) !important; }",
    "  .post-content { line-height: 1.75 !important; }",
    "  .post-meta, .topic-pages, .post-content-stats, .profile-exit small {",
    "    font-size: calc(var(--lsb-base-font-size) - 2px) !important;",
    "  }",
    "  h2 { font-size: calc(var(--lsb-base-font-size) + 3px) !important; }",
    "  h3 { font-size: calc(var(--lsb-base-font-size) + 1px) !important; }",
    "}",
    "@media (min-width: 721px) and (max-width: 1180px) {",
    "  .top .bar, main.wrap, .footer, .forum-more-panel { width: calc(100vw - 24px) !important; }",
    "}",
    "#lsb-home-personalization {",
    "  display: grid; justify-items: center; gap: 0; padding: 42px 20px 38px;",
    "  margin: -4px 0 20px; border-bottom: 1px solid var(--line-soft); text-align: center;",
    "}",
    "#lsb-home-personalization .lsb-home-logo {",
    "  display: block; width: clamp(64px, 7vw, 96px); height: auto; margin: 0 0 14px;",
    "  filter: drop-shadow(0 12px 24px rgba(0,0,0,.24));",
    "}",
    "#lsb-home-personalization .lsb-home-tagline {",
    "  margin: 0; color: var(--text); font-size: clamp(18px, 2.1vw, 28px);",
    "  font-weight: 700; letter-spacing: .08em; line-height: 1.25;",
    "}",
    "#lsb-home-personalization .lsb-home-search-form {",
    "  grid-column: auto; grid-row: auto; justify-self: center; display: flex;",
    "  width: min(720px, 100%); height: 46px; margin: 24px auto 0;",
    "  border: 1px solid var(--line); border-radius: var(--radius);",
    "  background: var(--panel); box-shadow: 0 10px 28px var(--shadow-base);",
    "}",
    "#lsb-home-personalization .lsb-home-search-form .search-input { font-size: var(--font-size-md); }",
    "#lsb-home-personalization .lsb-home-search-form .search-field { min-width: 76px; }",
    "#lsb-home-personalization[hidden] { display: none !important; }",
    "/* \u4E3B\u9898\u9996\u5E16\u4E0E\u8BC4\u8BBA\u5EFA\u7ACB\u6E05\u6670\u5C42\u7EA7\uFF1A\u9996\u5E16\u7A81\u51FA\uFF0C\u8BC4\u8BBA\u7F29\u8FDB\u663E\u793A\u3002 */",
    "/* \u65B0\u7248\u56DE\u590D\u680F\u4F1A\u4F5C\u4E3A\u5217\u8868\u7684\u4E34\u65F6\u76F4\u63A5\u5B50\u8282\u70B9\u63D2\u5165\uFF1B\u4FDD\u6301\u666E\u901A\u6D41\uFF0C\u907F\u514D\u89E6\u53D1\u540E\u7EED\u8BC4\u8BBA\u7684\u7F51\u683C\u81EA\u52A8\u6392\u7248\u3002 */",
    ".topic-post-list { display: block; }",
    ".topic-post-list > .post-entry { box-sizing: border-box; }",
    ".topic-post-list > .post-entry:not([data-floor]) {",
    "  position: relative; margin: 0 0 14px; padding: 18px 20px !important;",
    "  border: 1px solid var(--line); border-left: 4px solid var(--brand);",
    "  border-radius: var(--radius); background: var(--panel) !important;",
    "  box-shadow: 0 10px 24px var(--shadow-base);",
    "}",
    ".topic-post-list > .post-entry:not([data-floor]) .post-head::before {",
    '  content: "\u697C\u4E3B"; display: inline-flex; align-items: center; flex: 0 0 auto;',
    "  min-height: 20px; margin-right: 8px; padding: 0 7px; border-radius: 999px;",
    "  background: var(--brand-soft); color: var(--brand-hover); font-size: 11px; font-weight: 700;",
    "}",
    ".topic-post-list > .post-entry:not([data-floor]) .post-content {",
    "  margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--line-soft);",
    "}",
    ".topic-post-list > .post-entry[data-floor] {",
    "  position: relative; grid-template-columns: 36px minmax(0, 1fr);",
    "  margin: 0 0 0 clamp(18px, 3vw, 42px); padding: 14px 0 !important; border: 0;",
    "  border-radius: 0; background: transparent !important; box-shadow: none;",
    "  transition: color .18s ease;",
    "}",
    ".topic-post-list > .post-entry[data-floor]::after {",
    '  content: ""; position: absolute; right: 0; bottom: 0; left: 0; height: 1px;',
    "  background: linear-gradient(90deg, var(--brand) 0, var(--brand) 28px, var(--line) 28px, var(--line-soft) 72%, transparent 100%);",
    "  opacity: .42; pointer-events: none; transition: opacity .18s ease;",
    "}",
    ".topic-post-list > .post-entry[data-floor]:hover {",
    "  background: transparent !important; box-shadow: none;",
    "}",
    ".topic-post-list > .post-entry[data-floor]:hover::after { opacity: .72; }",
    ".topic-post-list > .post-entry[data-floor]:last-child::after { display: none; }",
    ".topic-post-list > .post-entry[data-floor] .post-head::before {",
    '  content: "\u8BC4\u8BBA"; display: inline-flex; align-items: center; flex: 0 0 auto;',
    "  min-height: 19px; margin-right: 7px; padding: 0 6px; border: 1px solid var(--line);",
    "  border-radius: 999px; color: var(--text-subtle); font-size: 10px; font-weight: 700;",
    "}",
    ".topic-post-list > .post-entry[data-floor] .post-author { color: var(--text); font-weight: 700; }",
    ".topic-post-list > .post-entry[data-floor] .post-meta { margin-top: 5px; }",
    ".topic-post-list > .post-entry[data-floor] .post-content {",
    "  width: auto; margin: 0; padding: 0; border: 0; border-radius: 0; background: transparent;",
    "}",
    ".topic-post-list > .post-entry[data-floor] .post-head.has-floor { min-height: 30px; padding-right: 176px !important; }",
    ".topic-post-list > .post-entry[data-floor] .post-ops { gap: 6px; }",
    ".topic-post-list > .post-entry[data-floor] .icon-action { width: 30px; height: 30px; opacity: .7; }",
    ".topic-post-list > .post-entry[data-floor] .icon-action::before { width: 18px; height: 18px; background-size: 18px 18px; }",
    ".topic-post-list > .post-entry[data-floor] .icon-quote::before { -webkit-mask-size: 18px 18px; mask-size: 18px 18px; }",
    ".topic-post-list > .post-entry[data-floor] .content-report-icon { width: 18px; height: 18px; }",
    ".topic-post-list > .post-entry[data-floor] .like-coin-form .like-coin-action {",
    "  min-width: 30px; height: 30px; min-height: 30px; padding: 0 4px; gap: 3px; font-size: 13px; opacity: .7;",
    "}",
    ".topic-post-list > .post-entry[data-floor] .like-coin-icon { width: 18px; height: 18px; flex-basis: 18px; }",
    ".topic-post-list > .post-entry[data-floor] .post-floor {",
    "  order: initial; min-width: 30px; height: 30px; padding: 0 3px; border: 0; border-radius: 0;",
    "  background: transparent; color: var(--text-muted); font-size: 14px; font-weight: 700;",
    "  font-variant-numeric: tabular-nums;",
    "}",
    "/* \u53D1\u5E16\u7F16\u8F91\u5668\u63D2\u4EF6\u7684\u6D45\u8272\u56DE\u9000\u503C\u6539\u4E3A\u8DDF\u968F\u5F53\u524D\u6DF1\u8272\u4E3B\u9898\u3002 */",
    ".topic-type-group .topic-type-choice,",
    ".topic-type-panels > .topic-type-panel,",
    ".lottery-prize-row, .lottery-card, .lottery-condition {",
    "  background: var(--card-bg) !important; color: var(--text) !important;",
    "}",
    ".lottery-rule-note { background: var(--brand-soft) !important; color: var(--text-muted) !important; }",
    ".lottery-title-status, .lottery-result { background: var(--warning-soft) !important; color: var(--warning) !important; }",
    ".lottery-title-status.drawn {",
    "  background: var(--success-soft) !important; color: var(--success) !important;",
    "}",
    ".topic-type-group .topic-type-choice strong, .topic-type-group-title,",
    ".lottery-prize-head, .lottery-prize-row label, .lottery-card strong { color: var(--text) !important; }",
    ".topic-type-group .topic-type-choice small, .lottery-prize-row small, .lottery-card header span,",
    ".lottery-card header em, .lottery-prizes span, .virtual-card-tip { color: var(--text-muted) !important; }",
    "@media (max-width: 720px) {",
    "  .topic-post-list { gap: 0; }",
    "  .topic-post-list > .post-entry:not([data-floor]) { padding: 14px !important; }",
    "  .topic-post-list > .post-entry[data-floor] {",
    "    grid-template-columns: 32px minmax(0, 1fr); column-gap: 9px;",
    "    margin-left: 8px; padding: 12px 0 !important;",
    "  }",
    "  .topic-post-list > .post-entry[data-floor] .post-head.has-floor { padding-right: 168px !important; }",
    "}",
    "/* \u6BCF\u4E2A\u6807\u7B7E\u72EC\u7ACB\u5706\u89D2\uFF1B\u56DB\u89D2\u7EDF\u4E00\u5C01\u9876 12px\uFF0C\u907F\u514D\u7AD9\u70B9\u7684\u9996\u5C3E\u4F2A\u7C7B\u628A\u5355\u4E2A\u6807\u7B7E\u538B\u6210\u80F6\u56CA\u3002 */",
    ".topic-toolbar > .tab-bar {",
    "  display: inline-flex !important; flex: 0 0 auto !important; align-items: stretch !important;",
    "  gap: 5px !important; width: max-content !important; max-width: 100% !important;",
    "  border-radius: 0 !important; overflow: visible !important;",
    "  isolation: auto !important; transform: none !important;",
    "}",
    ".topic-toolbar > .tab-bar > a.tab,",
    ".topic-toolbar > .tab-bar > a.tab:first-child,",
    ".topic-toolbar > .tab-bar > a.tab:last-child,",
    ".topic-toolbar > .tab-bar > a.tab:not(:has(~ .tab)),",
    ".topic-toolbar > .tab-bar > a.tab.active {",
    "  display: inline-flex !important; align-items: center !important; justify-content: center !important;",
    "  min-height: 27px !important; line-height: 1.1 !important; box-sizing: border-box !important;",
    "  border-radius: var(--lsb-tab-radius) !important;",
    "  border-top-left-radius: var(--lsb-tab-radius) !important;",
    "  border-top-right-radius: var(--lsb-tab-radius) !important;",
    "  border-bottom-right-radius: var(--lsb-tab-radius) !important;",
    "  border-bottom-left-radius: var(--lsb-tab-radius) !important;",
    "  margin-left: 0 !important; overflow: hidden !important; background-clip: padding-box !important;",
    "}",
    ".topic-toolbar > .tab-bar > a.tab + a.tab { margin-left: 0 !important; }",
    "/* \u641C\u7D22\u6846\u5185\u90E8\u63A7\u4EF6\u7EDF\u4E00\u5B57\u53F7\u3001\u7559\u767D\u548C\u5706\u89D2\u3002 */",
    ".search-form {",
    "  box-sizing: border-box; border-radius: var(--lsb-search-radius) !important; overflow: hidden;",
    "}",
    ".search-field {",
    "  flex: 0 0 82px !important; height: calc(100% - 8px) !important;",
    "  margin: 4px 0 4px 4px !important; padding: 0 28px 0 12px !important;",
    "  border: 1px solid var(--line-soft) !important;",
    "  border-radius: var(--lsb-search-radius) !important;",
    "  background-color: var(--panel) !important; color: var(--text) !important;",
    "  font-size: var(--lsb-base-font-size) !important; line-height: 1 !important;",
    "  appearance: none; -webkit-appearance: none;",
    '  background-image: url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2714%27 height=%2714%27 viewBox=%270 0 14 14%27 fill=%27none%27%3E%3Cpath d=%27M3.5 5.5 7 9l3.5-3.5%27 stroke=%27%237f7f7f%27 stroke-width=%271.4%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/%3E%3C/svg%3E");',
    "  background-repeat: no-repeat; background-position: right 9px center; background-size: 14px;",
    "}",
    ".search-input { padding: 0 14px !important; font-size: var(--lsb-base-font-size) !important; }",
    ".search-btn { width: 48px !important; padding: 0 12px !important; display: inline-flex; align-items: center; justify-content: center; border-radius: 0 var(--lsb-search-radius) var(--lsb-search-radius) 0 !important; }",
    ".search-btn svg { width: 19px !important; height: 19px !important; }",
    ".search-field option { background: var(--panel); color: var(--text); }",
    ".search-form:has(.lsb-search-select) { overflow: visible !important; }",
    ".lsb-search-select { position: relative; flex: 0 0 88px; height: 100%; z-index: 3; }",
    ".lsb-search-native {",
    "  position: absolute !important; width: 1px !important; height: 1px !important;",
    "  opacity: 0 !important; pointer-events: none !important; clip: rect(0 0 0 0) !important;",
    "}",
    ".lsb-search-select-trigger {",
    "  position: relative; display: flex; align-items: center; width: 100%; height: 100%;",
    "  padding: 0 26px 0 12px; border: 0; border-right: 1px solid var(--line-soft);",
    "  border-radius: var(--lsb-search-radius) 0 0 var(--lsb-search-radius);",
    "  background: var(--panel); color: var(--text); font: inherit; font-size: var(--lsb-base-font-size);",
    "  text-align: left; cursor: pointer;",
    "}",
    ".lsb-search-select-trigger::after {",
    '  content: ""; position: absolute; right: 10px; top: 50%; width: 7px; height: 7px;',
    "  border-right: 1.5px solid currentColor; border-bottom: 1.5px solid currentColor;",
    "  opacity: .72; transform: translateY(-65%) rotate(45deg);",
    "}",
    '.lsb-search-select-trigger[aria-expanded="true"]::after { transform: translateY(-30%) rotate(225deg); }',
    ".lsb-search-options {",
    "  position: absolute; top: calc(100% + 6px); left: 0; width: 132px; padding: 5px;",
    "  border: 1px solid var(--line); border-radius: var(--lsb-search-radius);",
    "  background: var(--panel); box-shadow: 0 14px 34px var(--shadow-medium);",
    "}",
    ".lsb-search-options[hidden] { display: none !important; }",
    ".lsb-search-option {",
    "  display: block; width: 100%; min-height: 32px; padding: 6px 9px; border: 0;",
    "  border-radius: min(var(--radius-sm), 8px); background: transparent; color: var(--text-muted);",
    "  font: inherit; font-size: var(--lsb-base-font-size); text-align: left; cursor: pointer;",
    "}",
    '.lsb-search-option:hover, .lsb-search-option[aria-selected="true"] {',
    "  background: var(--brand-soft); color: var(--text);",
    "}",
    "html, body, .top, .card, .box, .home-shell, .main-panel, .sidebar-card {",
    "  transition: background-color .18s ease, border-color .18s ease, color .18s ease;",
    "}",
    "/* \u81EA\u5B9A\u4E49\u9762\u677F\uFF1A\u4FDD\u7559\u539F\u6709\u4EA4\u4E92\u7ED3\u6784\uFF0C\u4EC5\u5BF9\u6392\u7248\u548C\u63A7\u4EF6\u505A\u8F7B\u91CF\u4F18\u5316\u3002 */",
    "#lsb-layout-toggle {",
    "  --lsb-ui-accent: var(--brand, #b8b8b8); --lsb-ui-text: var(--text, #eeeeee);",
    "  --lsb-ui-panel: var(--panel, #1b1b1b); --lsb-ui-line: var(--line, #343434);",
    "  position: fixed; left: 22px; bottom: 22px; z-index: 2147483646;",
    "  display: inline-flex; align-items: center; justify-content: center;",
    "  width: 44px; height: 44px; padding: 0; border: 1px solid var(--lsb-ui-line);",
    "  border-radius: 12px; background: var(--lsb-ui-panel); color: var(--lsb-ui-text);",
    "  box-shadow: 0 6px 18px var(--shadow-base, rgba(0,0,0,.28));",
    "  cursor: pointer; touch-action: none; transition: transform .18s ease, border-color .18s ease, background .18s ease;",
    "}",
    "#lsb-layout-toggle.lsb-toggle-dragging { cursor: grabbing; transform: none !important; transition: none !important; }",
    "#lsb-layout-toggle:hover { transform: scale(1.05); border-color: var(--lsb-ui-accent); background: var(--brand-soft, var(--lsb-ui-panel)); }",
    '#lsb-layout-toggle[aria-expanded="true"] { border-color: var(--lsb-ui-accent); background: var(--brand-soft, var(--lsb-ui-panel)); }',
    "#lsb-layout-toggle:focus-visible, #lsb-layout-panel :focus-visible { outline: 2px solid var(--lsb-ui-accent); outline-offset: 2px; }",
    "#lsb-layout-toggle svg { width: 20px; height: 20px; }",
    "#lsb-modal-backdrop {",
    "  position: fixed; inset: 0; z-index: 2147483646;",
    "  background: var(--backdrop, rgba(0,0,0,.55));",
    "}",
    "#lsb-modal-backdrop[hidden] { display: none !important; }",
    "#lsb-layout-panel {",
    "  --lsb-ui-accent: var(--brand, #b8b8b8); --lsb-ui-text: var(--text, #eeeeee);",
    "  --lsb-ui-panel: var(--panel, #1b1b1b); --lsb-ui-line: var(--line, #343434);",
    "  --lsb-ui-line-soft: var(--line-soft, #272727); --lsb-ui-muted: var(--text-muted, #b6b6b6);",
    "  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);",
    "  z-index: 2147483647;",
    "  width: min(560px, calc(100vw - 32px)); max-height: calc(100vh - 64px);",
    "  display: flex; flex-direction: column; overflow: hidden;",
    "  color: var(--lsb-ui-text); background: var(--lsb-ui-panel);",
    "  border: 1px solid var(--lsb-ui-line); border-radius: 14px;",
    "  box-shadow: 0 18px 46px var(--shadow-medium, rgba(0,0,0,.48));",
    '  font: 13px/1.45 -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;',
    "  scrollbar-color: var(--lsb-ui-muted) transparent;",
    "}",
    "#lsb-layout-panel[hidden] { display: none !important; }",
    "/* \u4FA7\u680F\u5BF9\u8C03\uFF1A\u4EC5\u5207\u6362\u6309\u94AE\u4F4D\u7F6E\u8054\u52A8 */",
    ".lsb-toggle-left { left: 22px !important; right: auto !important; }",
    ".lsb-toggle-right { right: 22px !important; left: auto !important; }",
    ".lsb-panel-head {",
    "  flex: 0 0 auto; display: flex; align-items: center;",
    "  justify-content: space-between; gap: 7px; padding: 15px 16px 13px;",
    "  border-bottom: 1px solid var(--lsb-ui-line); background: var(--lsb-ui-panel);",
    "  user-select: none;",
    "}",
    ".lsb-panel-head button { cursor: pointer; }",
    ".lsb-panel-title { display: grid; gap: 2px; }",
    ".lsb-panel-title strong { color: var(--lsb-ui-text); font-size: 15px; letter-spacing: .01em; }",
    ".lsb-panel-title span { color: var(--lsb-ui-muted); font-size: 11px; }",
    ".lsb-tabs {",
    "  flex: 0 0 auto; display: flex; gap: 4px; padding: 10px 16px 0;",
    "  border-bottom: 1px solid var(--lsb-ui-line); overflow-x: auto;",
    "}",
    ".lsb-tab {",
    "  flex: 1 1 0; min-height: 34px; padding: 0 10px;",
    "  border: 1px solid transparent; border-bottom: 0; border-radius: 8px 8px 0 0;",
    "  background: transparent; color: var(--lsb-ui-muted);",
    "  font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap;",
    "}",
    ".lsb-tab:hover { color: var(--lsb-ui-text); background: var(--bg-soft, var(--lsb-ui-panel)); }",
    ".lsb-tab.lsb-tab-active { color: var(--lsb-ui-accent); border-color: var(--lsb-ui-line); background: var(--lsb-ui-panel); }",
    ".lsb-tab-panel { display: grid; gap: 17px; }",
    ".lsb-tab-panel[hidden] { display: none !important; }",
    ".lsb-panel-body { padding: 15px 16px 17px; overflow-y: auto; }",
    ".lsb-icon-button {",
    "  display: inline-flex; align-items: center; justify-content: center;",
    "  width: 22px; height: 22px; padding: 0; border: 0;",
    "  border-radius: 0; background: transparent; color: var(--lsb-ui-muted); font-size: 16px; line-height: 1; cursor: pointer;",
    "}",
    ".lsb-panel-credit { color: var(--lsb-ui-muted); font-size: 10px; line-height: 1; opacity: .72; white-space: nowrap; }",
    ".lsb-panel-credit a { color: inherit; text-decoration: none; }",
    ".lsb-section { display: grid; gap: 11px; }",
    ".lsb-section-title {",
    "  display: flex; align-items: center; gap: 8px; margin: 0;",
    "  color: var(--lsb-ui-muted); font-size: 10px; line-height: 1.2; font-weight: 700;",
    "  letter-spacing: .1em; text-transform: uppercase;",
    "}",
    '.lsb-section-title::after { content: ""; height: 1px; flex: 1; background: var(--lsb-ui-line-soft); }',
    ".lsb-range-row { display: grid; gap: 7px; }",
    ".lsb-range-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }",
    ".lsb-range-label, .lsb-field > span { color: var(--lsb-ui-muted); font-size: 12px; }",
    ".lsb-range-value { min-width: 54px; color: var(--lsb-ui-text); font-size: 12px; font-variant-numeric: tabular-nums; text-align: right; }",
    ".lsb-range { width: 100%; height: 18px; margin: 0; accent-color: var(--lsb-ui-accent); cursor: pointer; }",
    ".lsb-field { display: grid; gap: 7px; }",
    ".lsb-select, .lsb-textarea {",
    "  width: 100%; border: 1px solid var(--lsb-ui-line); border-radius: 8px;",
    "  background: var(--bg-soft, var(--lsb-ui-panel)); color: var(--lsb-ui-text); font: inherit; box-sizing: border-box;",
    "}",
    ".lsb-select { height: 38px; padding: 0 10px; cursor: pointer; }",
    ".lsb-select option { background: var(--lsb-ui-panel); color: var(--lsb-ui-text); }",
    ".lsb-select:focus, .lsb-textarea:focus { outline: none; border-color: var(--lsb-ui-accent); box-shadow: 0 0 0 2px var(--focus-ring, rgba(184,184,184,.34)); }",
    ".lsb-color-line {",
    "  display: grid; grid-template-columns: 42px 1fr; align-items: center; gap: 10px;",
    "  padding: 7px 9px; border: 1px solid var(--lsb-ui-line); border-radius: 9px; background: var(--bg-soft, var(--lsb-ui-panel));",
    "}",
    ".lsb-color-input { width: 42px; height: 30px; padding: 2px; border: 0; border-radius: 7px; background: transparent; cursor: pointer; }",
    ".lsb-color-value { color: var(--lsb-ui-muted); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }",
    ".lsb-check-line { display: grid; grid-template-columns: 34px minmax(0, 1fr); align-items: center; gap: 10px; min-height: 26px; color: var(--lsb-ui-muted); cursor: pointer; }",
    ".lsb-check-line input { position: relative; width: 34px; height: 19px; margin: 0; border: 1px solid var(--lsb-ui-line); border-radius: 999px; background: var(--lsb-ui-line-soft); cursor: pointer; appearance: none; -webkit-appearance: none; transition: background-color .16s ease, border-color .16s ease; }",
    '.lsb-check-line input::after { content: ""; position: absolute; top: 3px; left: 3px; width: 11px; height: 11px; border-radius: 50%; background: var(--lsb-ui-muted); transition: left .16s ease, background-color .16s ease; }',
    ".lsb-check-line input:checked { border-color: var(--lsb-ui-accent); background: var(--lsb-ui-accent); }",
    ".lsb-check-line input:checked::after { left: 18px; background: var(--inverse, #111111); }",
    ".lsb-check-line input:focus-visible { outline: 2px solid var(--lsb-ui-accent); outline-offset: 2px; }",
    ".lsb-check-line input:checked + span { color: var(--lsb-ui-text); }",
    ".lsb-check-line span { line-height: 1.45; }",
    ".lsb-theme-note { margin: 0; color: var(--lsb-ui-muted); font-size: 11px; line-height: 1.55; }",
    ".lsb-filter-section { margin-top: 3px; }",
    ".lsb-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }",
    ".lsb-button {",
    "  min-height: 38px; padding: 0 12px; border: 1px solid var(--lsb-ui-line); border-radius: 9px;",
    "  background: transparent; color: var(--lsb-ui-text); font: inherit; font-weight: 600; cursor: pointer;",
    "}",
    ".lsb-button:hover { border-color: var(--lsb-ui-accent); background: var(--brand-soft, transparent); }",
    ".lsb-button-primary { border-color: var(--lsb-ui-accent); background: var(--brand-soft, transparent); }",
    ".lsb-status { min-height: 16px; margin: 0; color: var(--lsb-ui-muted); font-size: 11px; text-align: center; }",
    ".lsb-input { width: 100%; height: 38px; padding: 0 10px; border: 1px solid var(--lsb-ui-line); border-radius: 8px; background: var(--bg-soft, var(--lsb-ui-panel)); color: var(--lsb-ui-text); font: inherit; box-sizing: border-box; }",
    ".lsb-input:focus { outline: none; border-color: var(--lsb-ui-accent); box-shadow: 0 0 0 2px var(--focus-ring, rgba(184,184,184,.34)); }",
    ".lsb-check-line-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }",
    ".lsb-upload-settings-toggle { display: inline-flex; align-items: center; justify-content: center; min-height: 24px; padding: 0 8px; border: 1px solid var(--lsb-ui-line); border-radius: 6px; background: transparent; color: var(--lsb-ui-muted); font: 10px/1 inherit; cursor: pointer; }",
    ".lsb-upload-settings-toggle:hover { border-color: var(--lsb-ui-accent); color: var(--lsb-ui-text); }",
    ".lsb-upload-settings-toggle[hidden], .lsb-upload-settings[hidden] { display: none !important; }",
    ".lsb-upload-settings { display: grid; gap: 10px; margin: 4px 0 2px; padding: 0; }",
    ".lsb-upload-profiles-head { display: grid; gap: 3px; }",
    ".lsb-upload-profiles-tip { margin: 0; color: var(--lsb-ui-muted); font-size: 10px; line-height: 1.5; }",
    ".lsb-upload-profiles { display: grid; gap: 6px; }",
    ".lsb-upload-profile-item { display: flex; align-items: center; gap: 8px; padding: 9px 10px; border: 1px solid var(--lsb-ui-line); border-radius: 9px; background: var(--bg-soft, var(--lsb-ui-panel)); cursor: grab; }",
    ".lsb-upload-profile-item:active { cursor: grabbing; }",
    ".lsb-upload-profile-item:hover { border-color: var(--lsb-ui-accent); }",
    ".lsb-upload-profile-item:focus-visible { outline: 2px solid var(--lsb-ui-accent); outline-offset: -1px; }",
    ".lsb-upload-profile-item.lsb-upload-profile-dragging { opacity: .5; border-style: dashed; }",
    ".lsb-upload-profile-name { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--lsb-ui-text); font-size: 12px; font-weight: 600; }",
    ".lsb-upload-profile-meta { flex: 0 0 auto; color: var(--lsb-ui-muted); font-size: 10px; font-variant-numeric: tabular-nums; }",
    ".lsb-upload-profile-add { width: 100%; border-style: dashed !important; }",
    ".lsb-upload-editor { position: absolute; inset: 0; z-index: 20; display: flex; flex-direction: column; background: var(--lsb-ui-panel); }",
    ".lsb-upload-editor[hidden] { display: none !important; }",
    ".lsb-upload-editor .lsb-panel-body { flex: 1 1 auto; min-height: 0; }",
    ".lsb-upload-editor-actions { flex: 0 0 auto; display: flex; gap: 9px; padding: 12px 16px; border-top: 1px solid var(--lsb-ui-line); }",
    ".lsb-upload-editor-actions .lsb-button { flex: 1 1 0; }",
    ".lsb-upload-group { display: grid; gap: 9px; padding: 11px 12px; border: 1px solid var(--lsb-ui-line); border-radius: 10px; background: var(--bg-soft, var(--lsb-ui-panel)); }",
    ".lsb-upload-group-title { margin: 0; color: var(--lsb-ui-muted); font-size: 10px; line-height: 1.2; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }",
    ".lsb-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }",
    ".lsb-form-grid .lsb-field-wide { grid-column: 1 / -1; }",
    ".lsb-upload-hint { margin: 0; color: var(--lsb-ui-muted); font-size: 10px; line-height: 1.5; }",
    ".lsb-image-upload-button { display: inline-flex; align-items: center; justify-content: center; min-height: 28px; margin: 7px 0 0; padding: 0 9px; border: 1px dashed var(--line, #343434); border-radius: 7px; background: transparent; color: var(--text-muted, #b6b6b6); font: 12px/1 inherit; cursor: pointer; }",
    ".lsb-image-upload-button:hover, .lsb-image-upload-button:focus-visible { border-color: var(--brand, #b8b8b8); color: var(--text, #eeeeee); outline: none; }",
    ".lsb-image-upload-button[disabled] { opacity: .65; cursor: wait; }",
    "/* \u4EC5\u91CD\u6392\u6B63\u5F0F\u56DE\u590D\u533A\u7684\u4E0A\u4F20\u4E0E\u63D0\u4EA4\u884C\uFF1A\u4E0D\u79FB\u52A8 DOM\uFF0C\u4E0D\u5F71\u54CD\u4E0A\u4F20\u3001\u9644\u4EF6\u6216\u56DE\u590D\u4E8B\u4EF6\u3002 */",
    "@supports selector(.ajax-reply-form:has(.lsb-image-upload-button)) {",
    "  .reply-panel .ajax-reply-form:has(.lsb-image-upload-button) {",
    "    display: grid !important; grid-template-columns: minmax(0, 1fr) auto auto !important;",
    "    grid-template-rows: auto auto minmax(118px, auto) auto !important;",
    '    grid-template-areas: "lsb-reply-label lsb-reply-label lsb-reply-label" "lsb-reply-toolbar lsb-reply-toolbar lsb-reply-toolbar" "lsb-reply-content lsb-reply-content lsb-reply-content" "lsb-reply-attachment lsb-reply-upload lsb-reply-actions" !important;',
    "    align-items: center !important; column-gap: 10px !important; row-gap: 10px !important;",
    "  }",
    "  .reply-panel .ajax-reply-form:has(.lsb-image-upload-button) > .nb-editor-field { display: contents !important; }",
    "  .reply-panel .ajax-reply-form:has(.lsb-image-upload-button) > .nb-editor-field .grid > span:first-child { grid-area: lsb-reply-label; }",
    "  .reply-panel .ajax-reply-form:has(.lsb-image-upload-button) > .nb-editor-field > .nb-editor { grid-area: lsb-reply-toolbar; }",
    "  .reply-panel .ajax-reply-form:has(.lsb-image-upload-button) > .nb-editor-field textarea { grid-area: lsb-reply-content; }",
    "  .reply-panel .ajax-reply-form:has(.lsb-image-upload-button) > .nb-editor-field .lsb-image-upload-button {",
    "    grid-area: lsb-reply-upload; margin: 0 !important; white-space: nowrap;",
    "  }",
    '  .reply-panel .ajax-reply-form:has(.lsb-image-upload-button) > .nb-editor-field :is(input[type="file"], .attachment, .attachment-hint, .attachment-tip, .attachment-help, .attachment-control, [data-attachment], [class*="attachment"]) {',
    "    grid-area: lsb-reply-attachment; min-width: 0; align-self: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;",
    "  }",
    "  .reply-panel .ajax-reply-form:has(.lsb-image-upload-button) > .quick-reply-actions {",
    "    grid-area: lsb-reply-actions; margin: 0 !important; align-self: center !important; white-space: nowrap;",
    "  }",
    "}",
    ".lsb-image-upload-drop-target { outline: 2px dashed var(--brand, #b8b8b8); outline-offset: 3px; }",
    ".lsb-image-upload-hint { margin: 5px 0 0; color: var(--text-muted, #b6b6b6); font-size: 11px; }",
    "#lsb-image-lightbox { position: fixed; inset: 0; z-index: 2147483645; display: flex; align-items: center; justify-content: center; padding: 24px; background: var(--backdrop, rgba(0,0,0,.68)); cursor: zoom-out; }",
    "#lsb-image-lightbox[hidden] { display: none !important; }",
    "#lsb-image-lightbox .lsb-lightbox-image { max-width: min(1200px, 100%); max-height: calc(100vh - 48px); border: 1px solid var(--line, #343434); border-radius: var(--radius, 6px); background: var(--panel, #1b1b1b); box-shadow: 0 20px 52px var(--shadow-medium, rgba(0,0,0,.48)); cursor: default; object-fit: contain; }",
    "#lsb-image-lightbox .lsb-lightbox-close { position: absolute; top: 14px; right: 16px; width: 30px; height: 30px; padding: 0; border: 1px solid var(--line, #343434); border-radius: 8px; background: var(--panel, #1b1b1b); color: var(--text, #eeeeee); font-size: 20px; line-height: 1; cursor: pointer; }",
    ".post-entry .post-content img[data-lsb-lightbox-image], .post-item .post-content img[data-lsb-lightbox-image] { cursor: zoom-in; }",
    "/* \u9996\u9875\u8EAB\u4EFD\u3001UID \u4E0E\u5934\u50CF\u8D44\u6599\u5361\uFF1A\u4EC5\u4F7F\u7528\u811A\u672C\u79C1\u6709\u7C7B\uFF0C\u907F\u514D\u8986\u76D6\u7AD9\u70B9\u73B0\u6709\u7EC4\u4EF6\u3002 */",
    ".post-item .lsb-author-enhancement { --lsb-marker-color: var(--brand, #5eaaa0); display: inline-flex; align-items: center; gap: 4px; margin-left: 6px; vertical-align: middle; white-space: nowrap; font-variant-numeric: tabular-nums; }",
    '.post-item .lsb-author-enhancement[data-lsb-identity="creator"] { --lsb-marker-color: var(--brand, #5eaaa0); }',
    '.post-item .lsb-author-enhancement[data-lsb-identity="aiRobot"] { --lsb-marker-color: var(--info, #8fafd0); }',
    '.post-item .lsb-author-enhancement[data-lsb-identity="communityHost"] { --lsb-marker-color: var(--success, #8bb59b); }',
    ".post-item .lsb-identity-badge, .post-item .lsb-uid-badge { display: inline-flex; align-items: center; min-height: 18px; box-sizing: border-box; border: 1px solid color-mix(in srgb, var(--lsb-marker-color) 52%, var(--line, #343434)); border-radius: 999px; line-height: 1; }",
    ".post-item .lsb-identity-badge { padding: 0 6px; background: color-mix(in srgb, var(--lsb-marker-color) 16%, transparent); color: var(--lsb-marker-color); font-size: 10px; font-weight: 700; letter-spacing: .02em; }",
    ".post-item .lsb-uid-badge { padding: 0 5px; background: transparent; color: color-mix(in srgb, var(--lsb-marker-color) 78%, var(--text-muted, #b6b6b6)); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 10px; font-weight: 600; }",
    '#lsb-home-profile-card { position: fixed; z-index: 2147483644; width: min(292px, calc(100vw - 24px)); padding: 13px; border: 1px solid var(--line, #343434); border-radius: min(var(--radius, 6px), 12px); background: var(--panel, #1b1b1b); color: var(--text, #eeeeee); box-shadow: 0 16px 36px var(--shadow-medium, rgba(0,0,0,.48)); pointer-events: none; opacity: 0; transform: translateY(4px); transition: opacity .14s ease, transform .14s ease; font: 12px/1.45 -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif; }',
    "#lsb-home-profile-card[hidden] { display: none !important; }",
    "#lsb-home-profile-card.lsb-visible { opacity: 1; transform: translateY(0); }",
    "#lsb-home-profile-card .lsb-profile-card-head { display: flex; align-items: center; gap: 9px; padding-bottom: 10px; border-bottom: 1px solid var(--line-soft, #272727); }",
    "#lsb-home-profile-card .lsb-profile-card-avatar { width: 34px; height: 34px; flex: 0 0 34px; border: 1px solid var(--line, #343434); border-radius: 50%; background: var(--bg, #121212); object-fit: cover; }",
    "#lsb-home-profile-card .lsb-profile-card-name { overflow: hidden; color: var(--text, #eeeeee); font-size: 13px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }",
    "#lsb-home-profile-card .lsb-profile-card-uid { margin-top: 1px; color: var(--text-subtle, #898989); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 10px; font-variant-numeric: tabular-nums; }",
    "#lsb-home-profile-card .lsb-profile-card-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 7px 12px; margin: 11px 0 0; }",
    "#lsb-home-profile-card .lsb-profile-card-item { display: grid; gap: 1px; min-width: 0; }",
    "#lsb-home-profile-card .lsb-profile-card-item dt { margin: 0; color: var(--text-subtle, #898989); font-size: 10px; }",
    "#lsb-home-profile-card .lsb-profile-card-item dd { position: relative; overflow: hidden; margin: 0; color: var(--text-muted, #b6b6b6); font-size: 11px; white-space: nowrap; font-variant-numeric: tabular-nums; }",
    "#lsb-home-profile-card .lsb-profile-card-value { display: inline-block; min-width: 100%; }",
    "#lsb-home-profile-card .lsb-profile-card-item dd.lsb-profile-card-overflow .lsb-profile-card-value { min-width: max-content; padding-right: 24px; animation: lsb-profile-card-marquee var(--lsb-marquee-duration, 18s) ease-in-out infinite alternate; animation-delay: 1.6s; }",
    "@keyframes lsb-profile-card-marquee { 0%, 14% { transform: translateX(0); } 86%, 100% { transform: translateX(var(--lsb-marquee-offset, 0px)); } }",
    "@media (prefers-reduced-motion: reduce) { #lsb-home-profile-card .lsb-profile-card-item dd.lsb-profile-card-overflow { overflow: visible; white-space: normal; overflow-wrap: anywhere; } #lsb-home-profile-card .lsb-profile-card-item dd.lsb-profile-card-overflow .lsb-profile-card-value { min-width: 0; padding-right: 0; animation: none; } }",
    '#lsb-home-profile-card[data-loading="true"] .lsb-profile-card-item dd { color: var(--text-subtle, #898989); }',
    "body.lsb-lightbox-open { overflow: hidden !important; }",
    "@media (max-width: 520px) {",
    "  #lsb-layout-toggle { right: 12px; bottom: 12px; }",
    "  #lsb-layout-panel { width: calc(100vw - 24px); }",
    "}",
    "@media (prefers-reduced-motion: reduce) {",
    "  #lsb-layout-toggle, html, body, .top, .card, .box, .home-shell, .main-panel, .sidebar-card { transition-duration: .01ms !important; }",
    "}",
    ".lsb-textarea { padding: 8px 10px; font-size: 12px; line-height: 1.5; resize: vertical; }"
  ].join("\n");
  var STATIC_BASE_URL = "https://static.yaoonion.fun/lsb";
  var UPDATE_VERSION_FILE = "version.json";
  var UPDATE_SCRIPT_FILE = "linux-sb-enhance.user.js";
  var LOCAL_STORAGE_LAST_CHECK_TIME = "lsbLastUpdateCheck";
  var UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1e3;
  var PREVIEW_UPDATE_CHECK_INTERVAL = 60 * 60 * 1e3;

  // dist/state.js
  var settings = Object.assign({}, DEFAULTS);
  var ui = {
    panel: null,
    toggleButton: null
  };

  // dist/theme.js
  function setRootVariable(name, value) {
    if (document.documentElement) {
      document.documentElement.style.setProperty(name, value, "important");
    }
  }
  function clearThemeVariables() {
    if (!document.documentElement) {
      return;
    }
    THEME_VARIABLES.forEach(function(name) {
      document.documentElement.style.removeProperty(name);
    });
  }
  function hexToRgb(hex) {
    const normalized = String(hex).replace("#", "");
    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16)
    };
  }
  function mixHex(first, second, weight) {
    const a = hexToRgb(first);
    const b = hexToRgb(second);
    const mix = function(left, right) {
      return Math.round(left + (right - left) * weight);
    };
    const toHex = function(number) {
      return number.toString(16).padStart(2, "0");
    };
    return "#" + toHex(mix(a.r, b.r)) + toHex(mix(a.g, b.g)) + toHex(mix(a.b, b.b));
  }
  function findTextPalette(color) {
    const normalized = String(color).toLowerCase();
    const key = Object.keys(TEXT_PALETTES).find(function(paletteKey) {
      return paletteKey !== "custom" && TEXT_PALETTES[paletteKey].color === normalized;
    });
    return key || "custom";
  }
  function applyTheme() {
    clearThemeVariables();
    const theme = THEMES[settings.theme] || THEMES.neutral;
    if (theme.vars) {
      Object.keys(theme.vars).forEach(function(name) {
        setRootVariable(name, theme.vars[name]);
      });
    }
    const accentRgb = hexToRgb(settings.accent);
    setRootVariable("--brand", settings.accent);
    setRootVariable("--brand-hover", mixHex(settings.accent, "#ffffff", 0.18));
    setRootVariable("--brand-soft", "rgba(" + accentRgb.r + "," + accentRgb.g + "," + accentRgb.b + ",.16)");
    setRootVariable("--focus-ring", "rgba(" + accentRgb.r + "," + accentRgb.g + "," + accentRgb.b + ",.34)");
    const background = theme.vars && theme.vars["--bg"] ? theme.vars["--bg"] : "#1a1b2e";
    setRootVariable("--text", settings.textColor);
    setRootVariable("--text-muted", mixHex(settings.textColor, background, 0.34));
    setRootVariable("--text-subtle", mixHex(settings.textColor, background, 0.55));
    setRootVariable("--text-disabled", mixHex(settings.textColor, background, 0.72));
    if (settings.theme !== "original") {
      setRootVariable("--swal2-background", "var(--panel)");
      setRootVariable("--swal2-color", "var(--text)");
      setRootVariable("--swal2-validation-message-background", "var(--line-soft)");
      setRootVariable("--swal2-validation-message-color", "var(--text-muted)");
    }
  }

  // dist/status.js
  var statusElement = null;
  function setStatusElement(element) {
    statusElement = element;
  }
  function showStatus(message) {
    if (!statusElement) {
      return;
    }
    statusElement.textContent = message;
    window.setTimeout(function() {
      if (statusElement && statusElement.textContent === message) {
        statusElement.textContent = "";
      }
    }, 1600);
  }

  // dist/search.js
  var searchDropdownEventsBound = false;
  var searchDropdownId = 0;
  function enforceRadiusOverrides() {
    const tabRadius = Math.min(settings.radius, 12) + "px";
    const searchRadius = Math.min(settings.radius, 12) + "px";
    document.querySelectorAll(".topic-toolbar > .tab-bar").forEach(function(tabBar) {
      tabBar.style.setProperty("display", "inline-flex", "important");
      tabBar.style.setProperty("flex", "0 0 auto", "important");
      tabBar.style.setProperty("gap", "5px", "important");
      tabBar.style.setProperty("width", "max-content", "important");
      tabBar.style.setProperty("border-radius", "0px", "important");
      tabBar.style.setProperty("overflow", "visible", "important");
      tabBar.style.setProperty("isolation", "auto", "important");
      tabBar.style.setProperty("transform", "none", "important");
      tabBar.querySelectorAll(":scope > a.tab").forEach(function(tab) {
        tab.style.setProperty("display", "inline-flex", "important");
        tab.style.setProperty("align-items", "center", "important");
        tab.style.setProperty("justify-content", "center", "important");
        tab.style.setProperty("min-height", "27px", "important");
        tab.style.setProperty("line-height", "1.1", "important");
        tab.style.setProperty("box-sizing", "border-box", "important");
        tab.style.setProperty("border-radius", tabRadius, "important");
        tab.style.setProperty("border-top-left-radius", tabRadius, "important");
        tab.style.setProperty("border-top-right-radius", tabRadius, "important");
        tab.style.setProperty("border-bottom-right-radius", tabRadius, "important");
        tab.style.setProperty("border-bottom-left-radius", tabRadius, "important");
        tab.style.setProperty("margin-left", "0px", "important");
        tab.style.setProperty("overflow", "hidden", "important");
        tab.style.setProperty("background-clip", "padding-box", "important");
      });
    });
    document.querySelectorAll(".search-form").forEach(function(form) {
      form.style.setProperty("border-radius", searchRadius, "important");
    });
    document.querySelectorAll(".search-field").forEach(function(field) {
      field.style.setProperty("border-radius", searchRadius, "important");
    });
    document.querySelectorAll(".lsb-search-select-trigger").forEach(function(trigger) {
      trigger.style.setProperty("border-top-left-radius", searchRadius, "important");
      trigger.style.setProperty("border-bottom-left-radius", searchRadius, "important");
    });
    document.querySelectorAll(".search-btn").forEach(function(button) {
      button.style.setProperty("border-top-right-radius", searchRadius, "important");
      button.style.setProperty("border-bottom-right-radius", searchRadius, "important");
    });
  }
  function stripSearchEnhancement(form) {
    form.querySelectorAll(".lsb-search-select").forEach(function(wrapper) {
      const select = wrapper.querySelector(".search-field");
      if (select) {
        select.classList.remove("lsb-search-native");
        select.removeAttribute("data-lsb-search-enhanced");
        wrapper.replaceWith(select);
      }
    });
  }
  function enhanceSearchFields(root) {
    if (!root || !root.querySelectorAll) {
      return;
    }
    root.querySelectorAll(".search-field").forEach(function(select) {
      if (select.getAttribute("data-lsb-search-enhanced") === "1") {
        return;
      }
      select.setAttribute("data-lsb-search-enhanced", "1");
      const wrapper = document.createElement("div");
      wrapper.className = "lsb-search-select";
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "lsb-search-select-trigger";
      trigger.setAttribute("aria-haspopup", "listbox");
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("aria-label", "\u9009\u62E9\u641C\u7D22\u8303\u56F4");
      const menu = document.createElement("div");
      menu.className = "lsb-search-options";
      menu.setAttribute("role", "listbox");
      menu.hidden = true;
      menu.id = "lsb-search-options-" + ++searchDropdownId;
      trigger.setAttribute("aria-controls", menu.id);
      Array.from(select.options).forEach(function(option) {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "lsb-search-option";
        item.setAttribute("role", "option");
        item.dataset.value = option.value;
        item.textContent = option.textContent;
        item.addEventListener("click", function() {
          select.value = option.value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          closeSearchDropdowns();
          trigger.focus();
        });
        menu.appendChild(item);
      });
      const sync = function() {
        const selected = select.options[select.selectedIndex] || select.options[0];
        trigger.textContent = selected ? selected.textContent : "";
        menu.querySelectorAll(".lsb-search-option").forEach(function(item) {
          const active = selected && item.dataset.value === selected.value;
          item.setAttribute("aria-selected", String(Boolean(active)));
        });
      };
      trigger.addEventListener("click", function() {
        const nextOpen = menu.hidden;
        closeSearchDropdowns();
        menu.hidden = !nextOpen;
        trigger.setAttribute("aria-expanded", String(nextOpen));
      });
      trigger.addEventListener("keydown", function(event) {
        if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          trigger.click();
        }
        if (event.key === "Escape") {
          closeSearchDropdowns();
        }
      });
      select.addEventListener("change", sync);
      wrapper.appendChild(trigger);
      wrapper.appendChild(menu);
      select.classList.add("lsb-search-native");
      select.parentNode.insertBefore(wrapper, select);
      wrapper.appendChild(select);
      sync();
    });
    if (!searchDropdownEventsBound) {
      searchDropdownEventsBound = true;
      document.addEventListener("pointerdown", function(event) {
        const target = event.target;
        if (!target.closest || !target.closest(".lsb-search-select")) {
          closeSearchDropdowns();
        }
      });
      document.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
          closeSearchDropdowns();
        }
      });
    }
  }
  function closeSearchDropdowns() {
    document.querySelectorAll(".lsb-search-options").forEach(function(menu) {
      menu.hidden = true;
      const trigger = menu.parentElement && menu.parentElement.querySelector(".lsb-search-select-trigger");
      if (trigger) {
        trigger.setAttribute("aria-expanded", "false");
      }
    });
  }

  // dist/home.js
  var homeMarkerDebounceTimer = 0;
  var homeProfileCard = null;
  var homeProfileCardHideTimer = 0;
  var homeProfileCache = /* @__PURE__ */ Object.create(null);
  var homePrivateDataCache = null;
  var homeIdentityObserver = null;
  var homeIdentityTargets = /* @__PURE__ */ new WeakMap();
  function isHomePage() {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    if (path === "/") {
      return true;
    }
    if (path !== "/index.php") {
      return false;
    }
    const query = new URLSearchParams(window.location.search);
    return !query.has("a") && !query.has("do") && !query.has("id");
  }
  function applyHomePersonalization() {
    const existing = document.getElementById("lsb-home-personalization");
    if (!settings.homePersonalized || !isHomePage()) {
      if (existing) {
        existing.remove();
      }
      document.querySelectorAll(".lsb-home-personalized-layout").forEach(function(layout) {
        layout.classList.remove("lsb-home-personalized-layout");
      });
      return;
    }
    const forumLayout = document.querySelector("main.wrap .home-shell .forum-layout, main.wrap .forum-layout");
    const forumMain = forumLayout ? forumLayout.querySelector(".forum-main") : null;
    if (!forumLayout || !forumMain) {
      return;
    }
    if (existing) {
      if (existing.parentElement !== forumLayout) {
        forumLayout.insertBefore(existing, forumLayout.firstChild);
      }
      forumLayout.classList.add("lsb-home-personalized-layout");
      return;
    }
    const hero = document.createElement("section");
    hero.id = "lsb-home-personalization";
    hero.setAttribute("aria-label", "LINUX SB \u9996\u9875\u6B22\u8FCE\u533A");
    const logo = document.createElement("div");
    logo.className = "lsb-home-logo";
    logo.innerHTML = HOME_LOGO_SVG;
    const tagline = document.createElement("h1");
    tagline.className = "lsb-home-tagline";
    tagline.textContent = "Here IS The New Ideal Community";
    const sourceSearch = document.querySelector(".top .search-form, .search-form");
    if (!sourceSearch) {
      return;
    }
    const search = sourceSearch.cloneNode(true);
    stripSearchEnhancement(search);
    search.className = "search-form lsb-home-search-form";
    search.removeAttribute("id");
    search.setAttribute("aria-label", "\u9996\u9875\u641C\u7D22");
    const searchInput = search.querySelector(".search-input");
    if (searchInput) {
      searchInput.setAttribute("aria-label", "\u641C\u7D22\u5173\u952E\u8BCD");
    }
    hero.appendChild(logo);
    hero.appendChild(tagline);
    hero.appendChild(search);
    forumLayout.insertBefore(hero, forumLayout.firstChild);
    forumLayout.classList.add("lsb-home-personalized-layout");
  }
  function applyHomePostNewWindow() {
    if (!isHomePage()) {
      return;
    }
    document.querySelectorAll('.post-item .post-title[href*="/topic/"], .post-item .topic-pages a[href*="/topic/"]').forEach(function(link) {
      if (settings.homePostNewWindow) {
        if (!link.hasAttribute("data-lsb-home-post-new-window")) {
          link.setAttribute("data-lsb-home-post-original-target", link.hasAttribute("target") ? link.getAttribute("target") : "__lsb_none__");
          link.setAttribute("data-lsb-home-post-original-rel", link.hasAttribute("rel") ? link.getAttribute("rel") : "__lsb_none__");
          link.setAttribute("data-lsb-home-post-new-window", "1");
        }
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      } else if (link.hasAttribute("data-lsb-home-post-new-window")) {
        const originalTarget = link.getAttribute("data-lsb-home-post-original-target");
        const originalRel = link.getAttribute("data-lsb-home-post-original-rel");
        if (originalTarget === "__lsb_none__") {
          link.removeAttribute("target");
        } else {
          link.setAttribute("target", originalTarget);
        }
        if (originalRel === "__lsb_none__") {
          link.removeAttribute("rel");
        } else {
          link.setAttribute("rel", originalRel);
        }
        link.removeAttribute("data-lsb-home-post-original-target");
        link.removeAttribute("data-lsb-home-post-original-rel");
        link.removeAttribute("data-lsb-home-post-new-window");
      }
    });
  }
  function applySidebarSwap() {
    if (!isHomePage()) {
      return;
    }
    const forumLayout = document.querySelector("main.wrap .home-shell .forum-layout, main.wrap .forum-layout");
    if (forumLayout) {
      if (settings.sidebarSwap) {
        forumLayout.classList.add("lsb-home-sidebar-swapped");
      } else {
        forumLayout.classList.remove("lsb-home-sidebar-swapped");
      }
    }
    if (ui.toggleButton) {
      if (settings.sidebarSwap) {
        ui.toggleButton.classList.add("lsb-toggle-left");
        ui.toggleButton.classList.remove("lsb-toggle-right");
      } else {
        ui.toggleButton.classList.add("lsb-toggle-right");
        ui.toggleButton.classList.remove("lsb-toggle-left");
      }
    }
  }
  function isLsbMarkerNode(node) {
    if (!node || node.nodeType !== 1) {
      return false;
    }
    return Boolean(node.matches && (node.matches(".lsb-author-enhancement, #lsb-home-profile-card") || node.closest(".lsb-author-enhancement, #lsb-home-profile-card")));
  }
  function shouldRefreshHomeMarkerEnhancements(mutations) {
    return Array.from(mutations || []).some(function(mutation) {
      if (mutation.type !== "childList" || isLsbMarkerNode(mutation.target)) {
        return false;
      }
      if (mutation.target && mutation.target.nodeType === 1 && mutation.target.closest && mutation.target.closest(".post-item")) {
        return true;
      }
      return Array.from(mutation.addedNodes || []).some(function(node) {
        return node.nodeType === 1 && !isLsbMarkerNode(node) && (node.matches(".post-item") || node.querySelector(".post-item"));
      });
    });
  }
  function scheduleHomeMarkerEnhancements() {
    window.clearTimeout(homeMarkerDebounceTimer);
    homeMarkerDebounceTimer = window.setTimeout(applyHomeMarkerEnhancements, 90);
  }
  function getHomeUserId(href) {
    const match = String(href || "").match(/\/user\/(\d+)(?:[/?#]|$)/);
    return match ? match[1] : "";
  }
  function resolveIdentity(rawIdentity) {
    const normalized = String(rawIdentity || "").replace(/\s+/g, " ").trim();
    const matchedKey = Object.keys(IDENTITY_DEFINITIONS).find(function(key) {
      return IDENTITY_DEFINITIONS[key].aliases.some(function(alias) {
        return normalized === alias;
      });
    });
    return matchedKey ? { key: matchedKey, label: IDENTITY_DEFINITIONS[matchedKey].label } : null;
  }
  function parseHomeProfile(html, user) {
    const profileDocument = new DOMParser().parseFromString(String(html || ""), "text/html");
    const nameElement = profileDocument.querySelector(".user-card .user-name, .user-name");
    const rankElement = profileDocument.querySelector(".user-card .user-rank, .user-rank");
    const profileText = profileDocument.body ? profileDocument.body.textContent : "";
    const rankText = rankElement ? rankElement.textContent.replace(/\s+/g, " ").trim() : "";
    const pointsMatch = rankText.match(/积分\s*([0-9][0-9,]*)/) || String(profileText).match(/积分\s*([0-9][0-9,]*)/);
    const rawIdentity = rankText.replace(/\s*[·•|].*$/, "").replace(/积分\s*[0-9][0-9,]*/, "").trim();
    return {
      username: nameElement ? nameElement.textContent.trim() : user.username,
      uid: user.uid,
      identity: rawIdentity || "\u672A\u6807\u6CE8",
      identityDefinition: resolveIdentity(rawIdentity),
      points: pointsMatch ? pointsMatch[1] : "\u6682\u672A\u516C\u5F00",
      checkin: "\u4EC5\u672C\u4EBA\u53EF\u89C1",
      invitations: "\u4EC5\u672C\u4EBA\u53EF\u89C1"
    };
  }
  function getSessionUserId(profileDocument) {
    const userLink = profileDocument.querySelector('.user-card .user-name[href^="/user/"], .user-card .user-avatar-big[href^="/user/"]');
    return userLink ? getHomeUserId(userLink.getAttribute("href")) : "";
  }
  function getStatValueByLabel(root, label) {
    if (!root) {
      return "";
    }
    const labelElement = Array.from(root.querySelectorAll("span")).find(function(element) {
      return element.textContent.trim() === label;
    });
    const statBox = labelElement && labelElement.parentElement;
    const valueElement = statBox && statBox.querySelector("strong");
    return valueElement ? valueElement.textContent.trim() : "";
  }
  function parseCurrentUserCheckin(html) {
    const profileDocument = new DOMParser().parseFromString(String(html || ""), "text/html");
    const stats = profileDocument.querySelector(".daily-checkin-stats");
    const continuous = getStatValueByLabel(stats, "\u8FDE\u7EED\u5929\u6570");
    const total = getStatValueByLabel(stats, "\u7D2F\u8BA1\u7B7E\u5230");
    const uid = getSessionUserId(profileDocument);
    return uid && (continuous || total) ? {
      uid,
      display: continuous || total ? "\u8FDE\u7EED " + (continuous || "0") + " \u5929 \xB7 \u7D2F\u8BA1 " + (total || "0") + " \u6B21" : "\u6682\u672A\u516C\u5F00"
    } : null;
  }
  function findInvitePanel(profileDocument, title) {
    return Array.from(profileDocument.querySelectorAll(".admin-list-panel")).find(function(panel) {
      const heading = panel.querySelector(".admin-plugin-summary strong");
      return heading && heading.textContent.trim() === title;
    }) || null;
  }
  function countInviteEntries(panel, selector) {
    if (!panel) {
      return 0;
    }
    return Array.from(panel.querySelectorAll(selector)).filter(function(item) {
      return !item.classList.contains("empty-state");
    }).length;
  }
  function parseCurrentUserInvitations(html) {
    const profileDocument = new DOMParser().parseFromString(String(html || ""), "text/html");
    const uid = getSessionUserId(profileDocument);
    const codePanel = findInvitePanel(profileDocument, "\u53EF\u7528\u9080\u8BF7\u7801");
    const invitedPanel = findInvitePanel(profileDocument, "\u6211\u9080\u8BF7\u5230\u7684\u7528\u6237");
    if (!uid || !codePanel || !invitedPanel) {
      return null;
    }
    const codeCount = countInviteEntries(codePanel, ".invite-code-grid > li");
    const invitedCount = countInviteEntries(invitedPanel, ".admin-manage-list > li");
    return {
      uid,
      display: "\u53EF\u7528 " + codeCount + " \u4E2A \xB7 \u6210\u529F " + invitedCount + " \u4EBA"
    };
  }
  function getCurrentUserPrivateData(user) {
    const now = Date.now();
    if (homePrivateDataCache && Object.prototype.hasOwnProperty.call(homePrivateDataCache, "data") && homePrivateDataCache.expiresAt > now) {
      return Promise.resolve(homePrivateDataCache.data && homePrivateDataCache.data.uid === user.uid ? homePrivateDataCache.data : null);
    }
    if (homePrivateDataCache && homePrivateDataCache.promise) {
      return homePrivateDataCache.promise.then(function(data) {
        return data && data.uid === user.uid ? data : null;
      });
    }
    const requestPage = function(path) {
      return fetch(path, { credentials: "same-origin" }).then(function(response) {
        if (!response.ok) {
          throw new Error("\u4E2A\u4EBA\u6570\u636E\u8BF7\u6C42\u5931\u8D25");
        }
        return response.text();
      });
    };
    const request = Promise.all([requestPage("/daily_checkin"), requestPage("/invite_code")]).then(function(pages) {
      const checkin = parseCurrentUserCheckin(pages[0]);
      const invitations = parseCurrentUserInvitations(pages[1]);
      if (!checkin || !invitations || checkin.uid !== invitations.uid) {
        return null;
      }
      const data = { uid: checkin.uid, checkin: checkin.display, invitations: invitations.display };
      homePrivateDataCache = { data, expiresAt: Date.now() + HOME_PRIVATE_DATA_CACHE_TTL };
      return data;
    }).catch(function() {
      homePrivateDataCache = { data: null, expiresAt: Date.now() + 60 * 1e3 };
      return null;
    });
    homePrivateDataCache = { promise: request };
    return request.then(function(data) {
      return data && data.uid === user.uid ? data : null;
    });
  }
  function getHomeProfile(user) {
    const cached = homeProfileCache[user.uid];
    const now = Date.now();
    if (cached && cached.data && cached.expiresAt > now) {
      return Promise.resolve(cached.data);
    }
    if (cached && cached.promise) {
      return cached.promise;
    }
    const profileUrl = new URL(user.profileUrl, window.location.origin).href;
    const request = fetch(profileUrl, { credentials: "same-origin" }).then(function(response) {
      if (!response.ok) {
        throw new Error("\u4E2A\u4EBA\u8D44\u6599\u8BF7\u6C42\u5931\u8D25");
      }
      return response.text();
    }).then(function(html) {
      const data = parseHomeProfile(html, user);
      homeProfileCache[user.uid] = { data, expiresAt: Date.now() + HOME_PROFILE_CACHE_TTL };
      return data;
    }).catch(function() {
      const fallback = {
        username: user.username,
        uid: user.uid,
        identity: "\u6682\u672A\u516C\u5F00",
        identityDefinition: null,
        points: "\u6682\u672A\u516C\u5F00",
        checkin: "\u6682\u672A\u516C\u5F00",
        invitations: "\u6682\u672A\u516C\u5F00"
      };
      homeProfileCache[user.uid] = { data: fallback, expiresAt: Date.now() + 60 * 1e3 };
      return fallback;
    });
    homeProfileCache[user.uid] = { promise: request };
    return request;
  }
  function createProfileCardItem(label, value, allowMarquee) {
    const item = document.createElement("div");
    item.className = "lsb-profile-card-item";
    const title = document.createElement("dt");
    title.textContent = label;
    const content = document.createElement("dd");
    if (allowMarquee) {
      content.dataset.lsbMarquee = "true";
      content.title = value;
    }
    const valueElement = document.createElement("span");
    valueElement.className = "lsb-profile-card-value";
    valueElement.textContent = value;
    content.appendChild(valueElement);
    item.appendChild(title);
    item.appendChild(content);
    return item;
  }
  function refreshHomeProfileCardOverflow() {
    if (!homeProfileCard || homeProfileCard.hidden) {
      return;
    }
    window.requestAnimationFrame(function() {
      if (!homeProfileCard || homeProfileCard.hidden) {
        return;
      }
      homeProfileCard.querySelectorAll('dd[data-lsb-marquee="true"]').forEach(function(content) {
        const valueElement = content.querySelector(".lsb-profile-card-value");
        if (!valueElement) {
          return;
        }
        content.classList.remove("lsb-profile-card-overflow");
        content.style.removeProperty("--lsb-marquee-offset");
        content.style.removeProperty("--lsb-marquee-duration");
        const overflow = Math.ceil(valueElement.scrollWidth - content.clientWidth);
        if (overflow <= 4) {
          return;
        }
        const duration = Math.min(34, Math.max(16, 16 + overflow / 7));
        content.classList.add("lsb-profile-card-overflow");
        content.style.setProperty("--lsb-marquee-offset", "-" + overflow + "px");
        content.style.setProperty("--lsb-marquee-duration", duration.toFixed(1) + "s");
      });
    });
  }
  function renderHomeProfileCard(user, profile, loading) {
    if (!homeProfileCard) {
      return;
    }
    homeProfileCard.textContent = "";
    homeProfileCard.dataset.uid = user.uid;
    homeProfileCard.dataset.loading = String(Boolean(loading));
    const head = document.createElement("div");
    head.className = "lsb-profile-card-head";
    if (user.avatarUrl) {
      const avatar = document.createElement("img");
      avatar.className = "lsb-profile-card-avatar";
      avatar.src = user.avatarUrl;
      avatar.alt = "";
      head.appendChild(avatar);
    }
    const identityBlock = document.createElement("div");
    const name = document.createElement("div");
    name.className = "lsb-profile-card-name";
    name.textContent = profile ? profile.username : user.username;
    const uid = document.createElement("div");
    uid.className = "lsb-profile-card-uid";
    uid.textContent = "UID " + user.uid;
    identityBlock.appendChild(name);
    identityBlock.appendChild(uid);
    head.appendChild(identityBlock);
    const grid = document.createElement("dl");
    grid.className = "lsb-profile-card-grid";
    grid.appendChild(createProfileCardItem("\u79EF\u5206", profile ? profile.points : "\u8BFB\u53D6\u4E2D"));
    grid.appendChild(createProfileCardItem("\u8EAB\u4EFD", profile ? profile.identity : "\u8BFB\u53D6\u4E2D"));
    grid.appendChild(createProfileCardItem("\u7B7E\u5230\u6570\u636E", profile ? profile.checkin : "\u8BFB\u53D6\u4E2D", true));
    grid.appendChild(createProfileCardItem("\u9080\u8BF7\u6570\u636E", profile ? profile.invitations : "\u8BFB\u53D6\u4E2D", true));
    homeProfileCard.appendChild(head);
    homeProfileCard.appendChild(grid);
  }
  function positionHomeProfileCard(anchor) {
    if (!homeProfileCard || !anchor) {
      return;
    }
    const rect = anchor.getBoundingClientRect();
    const gap = 10;
    const maxLeft = Math.max(12, window.innerWidth - homeProfileCard.offsetWidth - 12);
    const maxTop = Math.max(12, window.innerHeight - homeProfileCard.offsetHeight - 12);
    const preferredLeft = rect.right + gap;
    const left = preferredLeft + homeProfileCard.offsetWidth <= window.innerWidth - 12 ? preferredLeft : rect.left - homeProfileCard.offsetWidth - gap;
    const top = rect.top;
    homeProfileCard.style.left = Math.round(Math.max(12, Math.min(maxLeft, left))) + "px";
    homeProfileCard.style.top = Math.round(Math.max(12, Math.min(maxTop, top))) + "px";
  }
  function hideHomeProfileCard() {
    window.clearTimeout(homeProfileCardHideTimer);
    if (homeProfileCard) {
      homeProfileCard.classList.remove("lsb-visible");
      homeProfileCard.hidden = true;
    }
  }
  function showHomeProfileCard(anchor, user) {
    if (!settings.avatarProfileCard || !document.body) {
      return;
    }
    window.clearTimeout(homeProfileCardHideTimer);
    if (!homeProfileCard) {
      homeProfileCard = document.createElement("aside");
      homeProfileCard.id = "lsb-home-profile-card";
      homeProfileCard.setAttribute("role", "status");
      homeProfileCard.setAttribute("aria-live", "polite");
      homeProfileCard.hidden = true;
      document.body.appendChild(homeProfileCard);
    }
    renderHomeProfileCard(user, null, true);
    homeProfileCard.hidden = false;
    positionHomeProfileCard(anchor);
    refreshHomeProfileCardOverflow();
    homeProfileCard.classList.add("lsb-visible");
    getHomeProfile(user).then(function(profile) {
      if (!homeProfileCard || homeProfileCard.dataset.uid !== user.uid || homeProfileCard.hidden) {
        return;
      }
      renderHomeProfileCard(user, profile, false);
      positionHomeProfileCard(anchor);
      refreshHomeProfileCardOverflow();
      return getCurrentUserPrivateData(user).then(function(privateData) {
        if (!privateData || !homeProfileCard || homeProfileCard.dataset.uid !== user.uid || homeProfileCard.hidden) {
          return;
        }
        profile.checkin = privateData.checkin;
        profile.invitations = privateData.invitations;
        renderHomeProfileCard(user, profile, false);
        positionHomeProfileCard(anchor);
        refreshHomeProfileCardOverflow();
      });
    });
  }
  function bindHomeAvatarProfileCard(avatarLink, user) {
    if (!avatarLink || avatarLink.getAttribute("data-lsb-avatar-card-bound") === "1") {
      return;
    }
    avatarLink.setAttribute("data-lsb-avatar-card-bound", "1");
    avatarLink.addEventListener("mouseenter", function() {
      showHomeProfileCard(avatarLink, user);
    });
    avatarLink.addEventListener("mouseleave", function() {
      homeProfileCardHideTimer = window.setTimeout(hideHomeProfileCard, 90);
    });
    avatarLink.addEventListener("focus", function() {
      showHomeProfileCard(avatarLink, user);
    });
    avatarLink.addEventListener("blur", hideHomeProfileCard);
  }
  function renderHomeAuthorEnhancement(enhancement, user, profile) {
    if (!enhancement || !enhancement.isConnected) {
      return;
    }
    const identityKey = settings.identityBadges && profile && profile.identityDefinition ? profile.identityDefinition.key : "";
    const renderState = (settings.identityBadges ? identityKey || "pending" : "identity-off") + "|" + (settings.uidBadges ? "uid-on" : "uid-off");
    if (enhancement.dataset.lsbRenderState === renderState) {
      return;
    }
    if (!identityKey && !settings.uidBadges && !settings.identityBadges) {
      enhancement.remove();
      return;
    }
    enhancement.textContent = "";
    enhancement.removeAttribute("data-lsb-identity");
    if (identityKey) {
      enhancement.dataset.lsbIdentity = identityKey;
      const identityBadge = document.createElement("span");
      identityBadge.className = "lsb-identity-badge";
      identityBadge.textContent = profile.identityDefinition.label;
      enhancement.appendChild(identityBadge);
    }
    if (settings.uidBadges) {
      const uidBadge = document.createElement("span");
      uidBadge.className = "lsb-uid-badge";
      uidBadge.textContent = "UID " + user.uid;
      enhancement.appendChild(uidBadge);
    }
    enhancement.dataset.lsbRenderState = renderState;
  }
  function hydrateHomeIdentity(item, user, enhancement) {
    if (!settings.identityBadges || item.dataset.lsbIdentityHydrated === user.uid) {
      return;
    }
    getHomeProfile(user).then(function(profile) {
      item.removeAttribute("data-lsb-identity-queued");
      item.dataset.lsbIdentityHydrated = user.uid;
      if (!item.isConnected || !enhancement.isConnected) {
        return;
      }
      renderHomeAuthorEnhancement(enhancement, user, profile);
    });
  }
  function observeHomeIdentity(item, user, enhancement) {
    if (!settings.identityBadges || item.dataset.lsbIdentityHydrated === user.uid || item.dataset.lsbIdentityQueued === user.uid) {
      return;
    }
    item.dataset.lsbIdentityQueued = user.uid;
    if (typeof IntersectionObserver !== "function") {
      hydrateHomeIdentity(item, user, enhancement);
      return;
    }
    if (!homeIdentityObserver) {
      homeIdentityObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (!entry.isIntersecting) {
            return;
          }
          homeIdentityObserver.unobserve(entry.target);
          const target = homeIdentityTargets.get(entry.target);
          if (target) {
            hydrateHomeIdentity(entry.target, target.user, target.enhancement);
            homeIdentityTargets.delete(entry.target);
          }
        });
      }, { rootMargin: "180px 0px" });
    }
    homeIdentityTargets.set(item, { user, enhancement });
    homeIdentityObserver.observe(item);
  }
  function applyHomeMarkerEnhancements() {
    if (!isHomePage()) {
      document.querySelectorAll(".lsb-author-enhancement").forEach(function(element) {
        element.remove();
      });
      hideHomeProfileCard();
      return;
    }
    document.querySelectorAll(".post-item").forEach(function(item) {
      const authorLink = item.querySelector('.post-meta a[href^="/user/"]');
      const avatarImage = item.querySelector('a[href^="/user/"] img');
      const avatarLink = avatarImage ? avatarImage.closest('a[href^="/user/"]') : null;
      if (!authorLink) {
        return;
      }
      const uid = getHomeUserId(authorLink.getAttribute("href"));
      if (!uid) {
        return;
      }
      const user = {
        uid,
        username: authorLink.textContent.trim(),
        profileUrl: authorLink.getAttribute("href"),
        avatarUrl: avatarImage ? avatarImage.src : ""
      };
      let enhancement = authorLink.parentElement && authorLink.parentElement.querySelector(":scope > .lsb-author-enhancement");
      if (!enhancement) {
        enhancement = document.createElement("span");
        enhancement.className = "lsb-author-enhancement";
        authorLink.insertAdjacentElement("afterend", enhancement);
      }
      const cachedProfile = homeProfileCache[user.uid] && homeProfileCache[user.uid].data;
      renderHomeAuthorEnhancement(enhancement, user, cachedProfile || null);
      observeHomeIdentity(item, user, enhancement);
      if (avatarLink) {
        bindHomeAvatarProfileCard(avatarLink, user);
      }
    });
    if (!settings.avatarProfileCard) {
      hideHomeProfileCard();
    }
  }

  // dist/filters.js
  var filterDebounceTimer = 0;
  function scheduleFilter() {
    window.clearTimeout(filterDebounceTimer);
    filterDebounceTimer = window.setTimeout(applyFilters, 200);
  }
  function applyFilters() {
    const titleKeywords = (settings.titleFilters || []).filter(function(k) {
      return k.trim();
    });
    const usernames = (settings.userFilters || []).filter(function(u) {
      return u.trim();
    });
    const hasFilters = titleKeywords.length > 0 || usernames.length > 0;
    if (!hasFilters) {
      document.querySelectorAll(".post-item[data-lsb-filtered]").forEach(function(item) {
        item.style.display = "";
        item.removeAttribute("data-lsb-filtered");
      });
      return;
    }
    document.querySelectorAll(".post-item").forEach(function(item) {
      let shouldHide = false;
      if (!shouldHide && titleKeywords.length > 0) {
        const titleEl = item.querySelector(".post-title");
        if (titleEl) {
          const title = titleEl.textContent.toLowerCase();
          shouldHide = titleKeywords.some(function(kw) {
            return title.includes(kw.toLowerCase());
          });
        }
      }
      if (!shouldHide && usernames.length > 0) {
        let matchedAuthor = "";
        let authorEl = item.querySelector(".post-author");
        if (!authorEl) {
          authorEl = item.querySelector('.post-meta a[href*="/user/"]');
        }
        if (!authorEl) {
          const meta = item.querySelector(".post-meta");
          if (meta) {
            authorEl = meta.querySelector("a");
          }
        }
        if (authorEl) {
          matchedAuthor = authorEl.textContent.trim();
        }
        if (matchedAuthor) {
          const lower = matchedAuthor.toLowerCase();
          shouldHide = usernames.some(function(u) {
            return lower === u.toLowerCase();
          });
        }
      }
      if (shouldHide) {
        item.style.display = "none";
        item.setAttribute("data-lsb-filtered", "1");
      } else {
        item.style.display = "";
        item.removeAttribute("data-lsb-filtered");
      }
    });
  }

  // dist/realtime.js
  var realtimeTimer = 0;
  var realtimePollingInFlight = false;
  function applyRealtimeRefresh() {
    if (!settings.realtimeRefresh) {
      console.log("[LSB \u5B9E\u65F6\u66F4\u65B0] \u5DF2\u505C\u6B62\u8F6E\u8BE2");
      stopRealtimePolling();
      return;
    }
    console.log("[LSB \u5B9E\u65F6\u66F4\u65B0] \u542F\u52A8\u8F6E\u8BE2\uFF0C\u95F4\u9694 = " + settings.realtimeRefreshInterval + " \u79D2");
    startRealtimePolling();
  }
  function startRealtimePolling() {
    stopRealtimePolling();
    pollOnce();
    realtimeTimer = window.setInterval(pollOnce, settings.realtimeRefreshInterval * 1e3);
  }
  function stopRealtimePolling() {
    if (realtimeTimer) {
      window.clearInterval(realtimeTimer);
      realtimeTimer = 0;
    }
  }
  function pollOnce() {
    if (realtimePollingInFlight || !settings.realtimeRefresh) {
      if (realtimePollingInFlight) {
        console.warn("[LSB \u5B9E\u65F6\u66F4\u65B0] \u4E0A\u4E00\u6B21\u8F6E\u8BE2\u5C1A\u672A\u7ED3\u675F\uFF0C\u8DF3\u8FC7\u672C\u6B21");
      }
      return;
    }
    if (!isHomePage() || document.hidden) {
      console.log("[LSB \u5B9E\u65F6\u66F4\u65B0] \u8DF3\u8FC7\u8F6E\u8BE2\uFF1A\u975E\u9996\u9875=" + !isHomePage() + " \u9875\u9762\u9690\u85CF=" + document.hidden);
      return;
    }
    realtimePollingInFlight = true;
    const url = buildPollUrl();
    console.log("[LSB \u5B9E\u65F6\u66F4\u65B0] \u53D1\u8D77\u8F6E\u8BE2: GET " + url);
    const done = function() {
      realtimePollingInFlight = false;
    };
    if (typeof GM_xmlhttpRequest === "function") {
      GM_xmlhttpRequest({
        method: "GET",
        url,
        timeout: 2e4,
        onload: function(response) {
          try {
            const text = String(response.responseText);
            console.log("[LSB \u5B9E\u65F6\u66F4\u65B0] GM_xmlhttpRequest \u54CD\u5E94: status = " + response.status + " \u957F\u5EA6 = " + text.length);
            handlePollResponse(text);
          } catch (error) {
            console.error("[LSB \u5B9E\u65F6\u66F4\u65B0] \u5904\u7406\u8F6E\u8BE2\u54CD\u5E94\u5931\u8D25:", error);
          }
          done();
        },
        onerror: function() {
          console.error("[LSB \u5B9E\u65F6\u66F4\u65B0] \u8F6E\u8BE2\u8BF7\u6C42\u5931\u8D25 (onerror)");
          done();
        },
        ontimeout: function() {
          console.error("[LSB \u5B9E\u65F6\u66F4\u65B0] \u8F6E\u8BE2\u8BF7\u6C42\u8D85\u65F6");
          done();
        }
      });
    } else {
      fetch(url, { credentials: "same-origin" }).then(function(response) {
        console.log("[LSB \u5B9E\u65F6\u66F4\u65B0] fetch \u54CD\u5E94: status = " + response.status);
        return response.text();
      }).then(function(html) {
        console.log("[LSB \u5B9E\u65F6\u66F4\u65B0] fetch \u54CD\u5E94\u957F\u5EA6 = " + html.length);
        handlePollResponse(html);
        done();
      }).catch(function(error) {
        console.error("[LSB \u5B9E\u65F6\u66F4\u65B0] \u8F6E\u8BE2\u8BF7\u6C42\u5931\u8D25 (fetch):", error);
        done();
      });
    }
  }
  function buildPollUrl() {
    const base = window.location.origin + window.location.pathname;
    const sort = new URLSearchParams(window.location.search).get("sort");
    if (sort) {
      return base + "?sort=" + encodeURIComponent(sort);
    }
    return base;
  }
  function handlePollResponse(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    console.log("[LSB \u5B9E\u65F6\u66F4\u65B0] \u89E3\u6790\u54CD\u5E94\uFF1Abadge = " + String(doc.querySelector(".nav-mine .notify-badge") ? doc.querySelector(".nav-mine .notify-badge").textContent : "\u65E0") + " \u54CD\u5E94\u666E\u901A\u5E16\u6570 = " + doc.querySelectorAll(".post-list .post-item:not(.topic-pinned)").length + " \u5F53\u524D\u666E\u901A\u5E16\u6570 = " + document.querySelectorAll(".post-list .post-item:not(.topic-pinned)").length);
    updateNotifyBadge(doc);
    insertNewPosts(doc);
  }
  function updateNotifyBadge(doc) {
    const navMine = document.querySelector(".nav-mine");
    const freshBadge = doc.querySelector(".nav-mine .notify-badge");
    if (!navMine) {
      console.log("[LSB \u5B9E\u65F6\u66F4\u65B0] \u5F53\u524D\u9875\u9762\u65E0 .nav-mine\uFF0C\u8DF3\u8FC7\u901A\u77E5\u5FBD\u7AE0");
      return;
    }
    const freshCount = freshBadge ? Number(freshBadge.textContent) || 0 : 0;
    let currentBadge = navMine.querySelector(".notify-badge");
    const currentCount = currentBadge ? Number(currentBadge.textContent) || 0 : 0;
    if (!currentBadge && freshCount === 0) {
      return;
    }
    if (currentBadge && freshCount === currentCount) {
      return;
    }
    if (!currentBadge) {
      console.log("[LSB \u5B9E\u65F6\u66F4\u65B0] \u521B\u5EFA\u901A\u77E5\u5FBD\u7AE0: " + freshCount);
      currentBadge = document.createElement("span");
      currentBadge.className = "notify-badge";
      navMine.appendChild(currentBadge);
    }
    console.log("[LSB \u5B9E\u65F6\u66F4\u65B0] \u901A\u77E5\u5FBD\u7AE0\u66F4\u65B0: " + currentCount + " -> " + freshCount);
    currentBadge.textContent = String(freshCount);
    if (freshCount > currentCount) {
      showStatus("\u6709 " + (freshCount - currentCount) + " \u6761\u65B0\u901A\u77E5");
    }
  }
  function insertNewPosts(doc) {
    const currentList = document.querySelector(".post-list");
    if (!currentList) {
      console.log("[LSB \u5B9E\u65F6\u66F4\u65B0] \u5F53\u524D\u9875\u9762\u65E0 .post-list\uFF0C\u8DF3\u8FC7\u5E16\u5B50\u68C0\u6D4B");
      return;
    }
    const currentMax = maxTopicId(document, true);
    if (currentMax === 0) {
      console.log("[LSB \u5B9E\u65F6\u66F4\u65B0] \u5F53\u524D\u9875\u9762\u672A\u89E3\u6790\u5230\u666E\u901A\u5E16\u5B50 id\uFF0C\u8DF3\u8FC7\u5E16\u5B50\u68C0\u6D4B");
      return;
    }
    const freshItems = Array.from(doc.querySelectorAll(".post-list .post-item")).filter(function(item) {
      return !item.classList.contains("topic-pinned");
    });
    const toInsert = [];
    for (const item of freshItems) {
      const title = item.querySelector('.post-title[href*="/topic/"]');
      const match = title && /\/topic\/(\d+)/.exec(title.getAttribute("href") || "");
      const id = match ? Number(match[1]) : 0;
      if (id > currentMax) {
        toInsert.push(item.outerHTML);
      }
    }
    console.log("[LSB \u5B9E\u65F6\u66F4\u65B0] \u5F53\u524D\u6700\u5927\u666E\u901A\u5E16 id = " + currentMax + "\uFF0C\u54CD\u5E94\u666E\u901A\u5E16\u6570 = " + freshItems.length + "\uFF0C\u9700\u8981\u63D2\u5165 = " + toInsert.length);
    if (!toInsert.length) {
      return;
    }
    const pinnedItems = currentList.querySelectorAll(".topic-pinned");
    const lastPinned = pinnedItems.length ? pinnedItems[pinnedItems.length - 1] : null;
    if (lastPinned) {
      lastPinned.insertAdjacentHTML("afterend", toInsert.join(""));
    } else {
      currentList.insertAdjacentHTML("afterbegin", toInsert.join(""));
    }
    scheduleHomeMarkerEnhancements();
    scheduleFilter();
    applyHomePostNewWindow();
    console.log("[LSB \u5B9E\u65F6\u66F4\u65B0] \u5DF2\u63D2\u5165 " + toInsert.length + " \u4E2A\u65B0\u5E16\u5B50");
    showStatus("\u5DF2\u81EA\u52A8\u52A0\u8F7D " + toInsert.length + " \u4E2A\u65B0\u5E16\u5B50");
  }
  function maxTopicId(root, excludePinned = false) {
    let max = 0;
    root.querySelectorAll('.post-item .post-title[href*="/topic/"]').forEach(function(anchor) {
      const item = anchor.closest(".post-item");
      if (excludePinned && item && item.classList.contains("topic-pinned")) {
        return;
      }
      const match = /\/topic\/(\d+)/.exec(anchor.getAttribute("href") || "");
      if (match) {
        const id = Number(match[1]);
        if (id > max) {
          max = id;
        }
      }
    });
    return max;
  }

  // dist/autoCheckin.js
  var autoCheckinInFlight = false;
  var autoCheckinStartTimer = 0;
  function getAutoCheckinDate() {
    const now = /* @__PURE__ */ new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return now.getFullYear() + "-" + month + "-" + day;
  }
  function applyAutoCheckin() {
    window.clearTimeout(autoCheckinStartTimer);
    autoCheckinStartTimer = 0;
    if (!settings.autoCheckin || autoCheckinInFlight || settings.autoCheckinLastDate === getAutoCheckinDate()) {
      return;
    }
    const scheduleAttempt = function() {
      autoCheckinStartTimer = window.setTimeout(function() {
        autoCheckinStartTimer = 0;
        performAutoCheckin();
      }, 900);
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", scheduleAttempt, { once: true });
    } else {
      scheduleAttempt();
    }
  }
  function hasCompletedDailyCheckin(html) {
    return /今天已签到|已签到|签到成功|已完成签到/.test(String(html || ""));
  }
  function isDailyCheckinLoginPage(html) {
    const source = String(html || "");
    return /用户名或邮箱|忘记密码|<title[^>]*>[^<]*登录|name=["'](?:username|password)["']/i.test(source);
  }
  function hasDailyCheckinFailure(html) {
    return /签到失败|请求失败|(?:csrf|token)[^\n<]{0,32}(?:失效|错误|无效)|error\s*(?:message|:)/i.test(String(html || ""));
  }
  function extractDailyCheckinCsrf(html) {
    const source = String(html || "");
    try {
      const documentNode = new DOMParser().parseFromString(source, "text/html");
      const input = documentNode.querySelector('input[name="_csrf"], input[name="csrf_token"], input[name="csrf"]');
      if (input && input.value) {
        return { name: input.name, value: input.value };
      }
    } catch (error) {
    }
    const match = source.match(/<input\b[^>]*\bname=["'](_csrf|csrf_token|csrf)["'][^>]*\bvalue=["']([^"']+)["'][^>]*>/i) || source.match(/<input\b[^>]*\bvalue=["']([^"']+)["'][^>]*\bname=["'](_csrf|csrf_token|csrf)["'][^>]*>/i);
    if (!match) {
      return null;
    }
    return match[1] === "_csrf" || match[1] === "csrf_token" || match[1] === "csrf" ? { name: match[1], value: match[2] } : { name: match[2], value: match[1] };
  }
  function fetchDailyCheckin(options) {
    return fetch("/daily_checkin", Object.assign({
      // 与参考脚本一致，显式携带当前登录会话的 Cookie。
      credentials: "include",
      headers: { "X-Requested-With": "XMLHttpRequest" }
    }, options || {}));
  }
  function performAutoCheckin() {
    const today = getAutoCheckinDate();
    if (!settings.autoCheckin || autoCheckinInFlight || settings.autoCheckinLastDate === today) {
      return;
    }
    autoCheckinInFlight = true;
    fetchDailyCheckin({ method: "GET" }).then(function(response) {
      if (!response.ok || /\/login(?:[?#]|$)/.test(response.url || "")) {
        throw new Error("\u672A\u68C0\u6D4B\u5230\u767B\u5F55\u72B6\u6001");
      }
      return response.text();
    }).then(function(html) {
      if (isDailyCheckinLoginPage(html)) {
        throw new Error("\u672A\u68C0\u6D4B\u5230\u767B\u5F55\u72B6\u6001");
      }
      if (hasCompletedDailyCheckin(html)) {
        return { completed: true };
      }
      if (!settings.autoCheckin) {
        return { cancelled: true };
      }
      const csrf = extractDailyCheckinCsrf(html);
      if (!csrf || !csrf.name || !csrf.value) {
        throw new Error("\u672A\u627E\u5230\u7B7E\u5230\u51ED\u636E");
      }
      const formData = new FormData();
      formData.append(csrf.name, csrf.value);
      return fetchDailyCheckin({ method: "POST", body: formData }).then(function(response) {
        if (!response.ok || /\/login(?:[?#]|$)/.test(response.url || "")) {
          throw new Error("\u7B7E\u5230\u8BF7\u6C42\u672A\u83B7\u6388\u6743");
        }
        return response.text();
      }).then(function(resultHtml) {
        if (isDailyCheckinLoginPage(resultHtml)) {
          throw new Error("\u7B7E\u5230\u8BF7\u6C42\u672A\u83B7\u6388\u6743");
        }
        if (hasCompletedDailyCheckin(resultHtml)) {
          return { completed: true };
        }
        return fetchDailyCheckin({ method: "GET" }).then(function(verifyResponse) {
          if (!verifyResponse.ok || /\/login(?:[?#]|$)/.test(verifyResponse.url || "")) {
            throw new Error("\u65E0\u6CD5\u9A8C\u8BC1\u7B7E\u5230\u7ED3\u679C");
          }
          return verifyResponse.text();
        }).then(function(verifyHtml) {
          if (isDailyCheckinLoginPage(verifyHtml)) {
            throw new Error("\u65E0\u6CD5\u9A8C\u8BC1\u767B\u5F55\u72B6\u6001");
          }
          if (hasCompletedDailyCheckin(verifyHtml)) {
            return { completed: true };
          }
          if (hasDailyCheckinFailure(verifyHtml)) {
            throw new Error("\u7B7E\u5230\u72B6\u6001\u9A8C\u8BC1\u5931\u8D25");
          }
          return { completed: true };
        });
      });
    }).then(function(result) {
      if (!result || !result.completed) {
        return;
      }
      settings.autoCheckinLastDate = today;
      persistSettings();
      showStatus("\u4ECA\u65E5\u81EA\u52A8\u7B7E\u5230\u5DF2\u5B8C\u6210");
    }).catch(function(error) {
      if (settings.autoCheckin) {
        console.warn("[LINUX.SB \u81EA\u52A8\u7B7E\u5230]", error && error.message ? error.message : error);
        showStatus("\u81EA\u52A8\u7B7E\u5230\u672A\u5B8C\u6210\uFF0C\u8BF7\u68C0\u67E5\u767B\u5F55\u72B6\u6001");
      }
    }).finally(function() {
      autoCheckinInFlight = false;
    });
  }

  // dist/lightbox.js
  var imageLightbox = null;
  var imageLightboxImage = null;
  var imageLightboxEventsBound = false;
  function applyImageLightbox() {
    ensureImageLightboxEvents();
    updateImageLightboxTargets();
    if (!settings.imageLightbox) {
      closeImageLightbox();
    }
  }
  function updateImageLightboxTargets() {
    if (!document.querySelectorAll) {
      return;
    }
    document.querySelectorAll(".post-entry .post-content img, .post-item .post-content img").forEach(function(image) {
      if (settings.imageLightbox && image.getAttribute("src")) {
        image.setAttribute("data-lsb-lightbox-image", "1");
      } else {
        image.removeAttribute("data-lsb-lightbox-image");
      }
    });
  }
  function ensureImageLightboxEvents() {
    if (imageLightboxEventsBound) {
      return;
    }
    imageLightboxEventsBound = true;
    document.addEventListener("click", function(event) {
      if (!settings.imageLightbox || event.defaultPrevented) {
        return;
      }
      const target = event.target;
      if (!target || !target.matches || !target.matches(".post-entry .post-content img, .post-item .post-content img")) {
        return;
      }
      const source = target.currentSrc || target.src;
      if (!source || target.closest("#lsb-image-lightbox")) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      openImageLightbox(source, target.alt || "\u5E16\u5B50\u56FE\u7247");
    }, true);
    document.addEventListener("keydown", function(event) {
      if (event.key === "Escape" && imageLightbox && !imageLightbox.hidden) {
        closeImageLightbox();
      }
    });
  }
  function ensureImageLightbox() {
    if (imageLightbox && document.body && document.body.contains(imageLightbox)) {
      return imageLightbox;
    }
    if (!document.body) {
      return null;
    }
    imageLightbox = document.createElement("div");
    imageLightbox.id = "lsb-image-lightbox";
    imageLightbox.hidden = true;
    imageLightbox.setAttribute("role", "dialog");
    imageLightbox.setAttribute("aria-modal", "true");
    imageLightbox.setAttribute("aria-label", "\u56FE\u7247\u9884\u89C8");
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "lsb-lightbox-close";
    closeButton.setAttribute("aria-label", "\u5173\u95ED\u56FE\u7247\u9884\u89C8");
    closeButton.textContent = "\xD7";
    imageLightboxImage = document.createElement("img");
    imageLightboxImage.className = "lsb-lightbox-image";
    imageLightboxImage.alt = "";
    closeButton.addEventListener("click", closeImageLightbox);
    imageLightbox.addEventListener("click", function(event) {
      if (event.target === imageLightbox) {
        closeImageLightbox();
      }
    });
    imageLightbox.appendChild(closeButton);
    imageLightbox.appendChild(imageLightboxImage);
    document.body.appendChild(imageLightbox);
    return imageLightbox;
  }
  function openImageLightbox(source, altText) {
    const overlay = ensureImageLightbox();
    if (!overlay || !imageLightboxImage) {
      return;
    }
    imageLightboxImage.src = source;
    imageLightboxImage.alt = altText || "\u5E16\u5B50\u56FE\u7247";
    overlay.hidden = false;
    document.body.classList.add("lsb-lightbox-open");
    window.requestAnimationFrame(function() {
      const closeButton = overlay.querySelector(".lsb-lightbox-close");
      if (closeButton) {
        closeButton.focus();
      }
    });
  }
  function closeImageLightbox() {
    if (!imageLightbox || imageLightbox.hidden) {
      return;
    }
    imageLightbox.hidden = true;
    document.body.classList.remove("lsb-lightbox-open");
    if (imageLightboxImage) {
      imageLightboxImage.removeAttribute("src");
      imageLightboxImage.alt = "";
    }
  }

  // dist/imageUpload.js
  var imageUploadBusyEditors = /* @__PURE__ */ new WeakSet();
  var dragProfileIndex = -1;
  function getActiveUploadProfile() {
    const profiles = settings.imageUploadProfiles || [];
    const activeId = settings.imageUploadActiveProfileId;
    const profile = profiles.find(function(item) {
      return item.id === activeId;
    }) || profiles[0];
    if (profile) {
      return profile;
    }
    return {
      id: "",
      name: "\u9ED8\u8BA4\u56FE\u5E8A",
      provider: settings.imageUploadProvider,
      host: settings.imageUploadHost,
      endpoint: settings.imageUploadEndpoint,
      method: "POST",
      headers: "",
      bodyType: "multipart",
      fileField: settings.imageUploadFileField,
      responsePath: settings.imageUploadResponsePath,
      authMode: settings.imageUploadAuthMode,
      token: settings.imageUploadToken
    };
  }
  function applyProviderPreset(profile) {
    if (profile.provider === "imgur") {
      profile.host = IMGUR_PRESET.host;
      profile.endpoint = IMGUR_PRESET.endpoint;
      profile.fileField = IMGUR_PRESET.field;
      profile.responsePath = IMGUR_PRESET.responsePath;
      profile.authMode = IMGUR_PRESET.authMode;
      profile.method = "POST";
      profile.bodyType = "multipart";
      profile.headers = "";
    } else if (profile.provider === "catbox") {
      profile.host = CATBOX_PRESET.host;
      profile.endpoint = CATBOX_PRESET.endpoint;
      profile.fileField = CATBOX_PRESET.field;
      profile.responsePath = CATBOX_PRESET.responsePath;
      profile.authMode = CATBOX_PRESET.authMode;
      profile.method = "POST";
      profile.bodyType = "multipart";
      profile.headers = "";
      profile.token = "";
    } else if (profile.provider === "nodeimage") {
      profile.host = NODEIMAGE_PRESET.host;
      profile.endpoint = NODEIMAGE_PRESET.endpoint;
      profile.fileField = NODEIMAGE_PRESET.field;
      profile.responsePath = NODEIMAGE_PRESET.responsePath;
      profile.authMode = NODEIMAGE_PRESET.authMode;
      profile.method = "POST";
      profile.bodyType = "multipart";
      profile.headers = "";
    } else if (profile.provider === "postimages") {
      profile.host = POSTIMAGES_PRESET.host;
      profile.endpoint = POSTIMAGES_PRESET.endpoint;
      profile.fileField = POSTIMAGES_PRESET.field;
      profile.responsePath = POSTIMAGES_PRESET.responsePath;
      profile.authMode = POSTIMAGES_PRESET.authMode;
      profile.method = "POST";
      profile.bodyType = "multipart";
      profile.headers = "";
      profile.token = "";
    } else if (profile.provider === "freeimage") {
      profile.host = FREEIMAGE_PRESET.host;
      profile.endpoint = FREEIMAGE_PRESET.endpoint;
      profile.fileField = FREEIMAGE_PRESET.field;
      profile.responsePath = FREEIMAGE_PRESET.responsePath;
      profile.authMode = FREEIMAGE_PRESET.authMode;
      profile.method = "POST";
      profile.bodyType = "multipart";
      profile.headers = "";
      profile.token = "";
    }
  }
  function syncImageUploadControls() {
    if (!ui.panel) {
      return;
    }
    const settingsBlock = ui.panel.querySelector("[data-lsb-upload-settings]");
    const settingsToggle = ui.panel.querySelector("[data-lsb-upload-settings-toggle]");
    const profilesContainer = ui.panel.querySelector("[data-lsb-upload-profiles]");
    if (!settingsBlock || !settingsToggle) {
      return;
    }
    const expanded = settings.imageUpload && !settings.imageUploadSettingsCollapsed;
    settingsBlock.hidden = !expanded;
    settingsToggle.style.display = settings.imageUpload ? "" : "none";
    settingsToggle.setAttribute("aria-expanded", String(expanded));
    settingsToggle.textContent = expanded ? "\u6536\u8D77\u914D\u7F6E" : "\u5C55\u5F00\u914D\u7F6E";
    if (!profilesContainer) {
      return;
    }
    profilesContainer.innerHTML = "";
    (settings.imageUploadProfiles || []).forEach(function(profile, index) {
      const item = document.createElement("div");
      item.className = "lsb-upload-profile-item";
      item.setAttribute("data-lsb-upload-profile-id", profile.id);
      item.setAttribute("role", "button");
      item.setAttribute("tabindex", "0");
      item.setAttribute("draggable", "true");
      item.addEventListener("dragstart", function(event) {
        dragProfileIndex = index;
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
        }
        item.classList.add("lsb-upload-profile-dragging");
      });
      item.addEventListener("dragover", function(event) {
        event.preventDefault();
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = "move";
        }
      });
      item.addEventListener("drop", function(event) {
        event.preventDefault();
        const targetIndex = index;
        if (dragProfileIndex >= 0 && dragProfileIndex !== targetIndex) {
          const profiles = settings.imageUploadProfiles || [];
          const moved = profiles.splice(dragProfileIndex, 1)[0];
          profiles.splice(targetIndex, 0, moved);
          dragProfileIndex = -1;
          syncImageUploadControls();
          persistSettings();
        } else {
          dragProfileIndex = -1;
        }
      });
      item.addEventListener("dragend", function() {
        dragProfileIndex = -1;
        item.classList.remove("lsb-upload-profile-dragging");
      });
      const name = document.createElement("span");
      name.className = "lsb-upload-profile-name";
      name.textContent = profile.name;
      const meta = document.createElement("span");
      meta.className = "lsb-upload-profile-meta";
      meta.textContent = profile.provider + " \xB7 " + profile.method;
      item.appendChild(name);
      item.appendChild(meta);
      profilesContainer.appendChild(item);
    });
  }
  function applyImageUpload() {
    updateImageUploadTargets();
  }
  function updateImageUploadTargets() {
    if (!document.querySelectorAll) {
      return;
    }
    document.querySelectorAll("[data-lsb-image-upload-button]").forEach(function(button) {
      if (!settings.imageUpload || !button.previousElementSibling || !isImageUploadEditor(button.previousElementSibling)) {
        button.remove();
      }
    });
    if (!settings.imageUpload) {
      document.querySelectorAll(".lsb-image-upload-drop-target").forEach(function(editor) {
        editor.classList.remove("lsb-image-upload-drop-target");
      });
      return;
    }
    getImageUploadEditors().forEach(function(editor) {
      bindImageUploadEditor(editor);
    });
  }
  function getImageUploadEditors() {
    const result = [];
    document.querySelectorAll('textarea, [contenteditable="true"], input[data-quick-reply-action]').forEach(function(editor) {
      if (isImageUploadEditor(editor)) {
        result.push(editor);
      }
    });
    return result;
  }
  function isImageUploadEditor(editor) {
    if (!editor || !editor.isConnected || editor.closest("#lsb-layout-panel") || editor.readOnly || editor.disabled) {
      return false;
    }
    if (editor.matches("input[data-quick-reply-action]")) {
      return true;
    }
    if (editor.matches('[contenteditable="true"]')) {
      return true;
    }
    if (!editor.matches("textarea")) {
      return false;
    }
    return !editor.classList.contains("lsb-textarea");
  }
  function bindImageUploadEditor(editor) {
    if (editor.getAttribute("data-lsb-image-upload-bound") === "1") {
      ensureImageUploadButton(editor);
      return;
    }
    editor.setAttribute("data-lsb-image-upload-bound", "1");
    console.log("[LSB \u56FE\u5E8A\u4E0A\u4F20] \u5DF2\u7ED1\u5B9A\u4E0A\u4F20\u7F16\u8F91\u5668:", editor.tagName, editor.className || "");
    editor.addEventListener("dragenter", function(event) {
      if (settings.imageUpload && containsImageFiles(event.dataTransfer)) {
        event.preventDefault();
        editor.classList.add("lsb-image-upload-drop-target");
      }
    });
    editor.addEventListener("dragover", function(event) {
      if (settings.imageUpload && containsImageFiles(event.dataTransfer)) {
        event.preventDefault();
        editor.classList.add("lsb-image-upload-drop-target");
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = "copy";
        }
      }
    });
    editor.addEventListener("dragleave", function() {
      editor.classList.remove("lsb-image-upload-drop-target");
    });
    editor.addEventListener("drop", function(event) {
      editor.classList.remove("lsb-image-upload-drop-target");
      if (!settings.imageUpload || !containsImageFiles(event.dataTransfer)) {
        console.log("[LSB \u56FE\u5E8A\u4E0A\u4F20] drop \u88AB\u5FFD\u7565\uFF08\u4E0A\u4F20\u672A\u5F00\u542F\u6216\u65E0\u56FE\u7247\u6587\u4EF6\uFF09");
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      uploadImageFiles(editor, Array.from(event.dataTransfer.files || []));
    });
    editor.addEventListener("paste", function(event) {
      if (!settings.imageUpload) {
        return;
      }
      const files = getClipboardImageFiles(event.clipboardData);
      if (!files.length) {
        console.log("[LSB \u56FE\u5E8A\u4E0A\u4F20] \u7C98\u8D34\u5185\u5BB9\u4E2D\u672A\u53D1\u73B0\u56FE\u7247\u6587\u4EF6");
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      uploadImageFiles(editor, files);
    });
    ensureImageUploadButton(editor);
  }
  function ensureImageUploadButton(editor) {
    let button = editor.nextElementSibling;
    if (button && button.hasAttribute("data-lsb-image-upload-button")) {
      return;
    }
    button = document.createElement("button");
    button.type = "button";
    button.className = "lsb-image-upload-button";
    button.setAttribute("data-lsb-image-upload-button", "1");
    button.textContent = "\u4E0A\u4F20\u56FE\u7247";
    button.addEventListener("click", function() {
      selectImagesForEditor(editor);
    });
    editor.insertAdjacentElement("afterend", button);
  }
  function containsImageFiles(dataTransfer) {
    if (!dataTransfer || !dataTransfer.files || !dataTransfer.files.length) {
      return false;
    }
    return Array.from(dataTransfer.files).some(function(file) {
      return file && /^image\//i.test(file.type || "");
    });
  }
  function getClipboardImageFiles(clipboardData) {
    if (!clipboardData) {
      return [];
    }
    let files = Array.from(clipboardData.items || []).map(function(item) {
      if (!item || item.kind !== "file" || !/^image\//i.test(item.type || "")) {
        return null;
      }
      return item.getAsFile ? item.getAsFile() : null;
    }).filter(Boolean);
    if (!files.length && clipboardData.files) {
      files = Array.from(clipboardData.files).filter(function(file) {
        return file && /^image\//i.test(file.type || "");
      });
    }
    return files;
  }
  function selectImagesForEditor(editor) {
    if (!settings.imageUpload || imageUploadBusyEditors.has(editor)) {
      return;
    }
    const picker = document.createElement("input");
    picker.type = "file";
    picker.accept = "image/*";
    picker.multiple = true;
    picker.hidden = true;
    picker.addEventListener("change", function() {
      uploadImageFiles(editor, Array.from(picker.files || []));
      picker.remove();
    }, { once: true });
    document.body.appendChild(picker);
    picker.click();
  }
  function uploadImageFiles(editor, files) {
    console.log("[LSB \u56FE\u5E8A\u4E0A\u4F20] uploadImageFiles \u6536\u5230\u6587\u4EF6:", files.map(function(f) {
      return f && f.name;
    }));
    let validFiles = files.filter(function(file) {
      return file && /^image\//i.test(file.type || "") && file.size > 0;
    });
    const oversized = validFiles.filter(function(file) {
      return file.size > 10 * 1024 * 1024;
    });
    validFiles = validFiles.filter(function(file) {
      return file.size <= 10 * 1024 * 1024;
    }).slice(0, 6);
    console.log("[LSB \u56FE\u5E8A\u4E0A\u4F20] \u8FC7\u6EE4\u540E\u5F85\u4E0A\u4F20", validFiles.length, "\u5F20\uFF0C\u8D85\u5927\u88AB\u62D2", oversized.length, "\u5F20");
    if (!validFiles.length) {
      showStatus(oversized.length ? "\u56FE\u7247\u8D85\u8FC7 10 MB\uFF0C\u672A\u5F00\u59CB\u4E0A\u4F20" : "\u8BF7\u9009\u62E9 PNG\u3001JPG\u3001GIF\u3001WebP \u7B49\u56FE\u7247\u6587\u4EF6");
      return;
    }
    if (imageUploadBusyEditors.has(editor)) {
      return;
    }
    imageUploadBusyEditors.add(editor);
    setImageUploadButtonState(editor, "\u4E0A\u4F20\u4E2D\u2026", true);
    let uploaded = 0;
    let chain = Promise.resolve();
    validFiles.forEach(function(file, fileIndex) {
      const placeholder = "![\u56FE\u7247\u4E0A\u4F20\u4E2D...](lsb-uploading-" + (fileIndex + 1) + "-" + Math.random().toString(36).slice(2, 8) + ")";
      insertMarkdownText(editor, placeholder);
      chain = chain.then(function() {
        return uploadOneImage(file).then(function(url) {
          console.log("[LSB \u56FE\u5E8A\u4E0A\u4F20] \u5355\u5F20\u4E0A\u4F20\u6210\u529F:", url);
          const alt = String(file.name || "\u56FE\u7247").replace(/[\[\]\n\r]/g, "").slice(0, 80) || "\u56FE\u7247";
          replaceEditorText(editor, placeholder, "![" + alt + "](" + url + ")");
          uploaded += 1;
          setImageUploadButtonState(editor, "\u5DF2\u4E0A\u4F20 " + uploaded + "/" + validFiles.length, true);
        }).catch(function(error) {
          replaceEditorText(editor, placeholder, "");
          throw error;
        });
      });
    });
    chain.then(function() {
      showStatus("\u5DF2\u63D2\u5165 " + uploaded + " \u5F20\u56FE\u7247");
    }).catch(function(error) {
      const message = "\u56FE\u7247\u4E0A\u4F20\u5931\u8D25\uFF1A" + getUploadErrorMessage(error);
      console.error("[LSB \u56FE\u5E8A\u4E0A\u4F20] \u4E0A\u4F20\u5931\u8D25:", error);
      showStatus(message);
      showUploadErrorDialog(message);
    }).finally(function() {
      imageUploadBusyEditors.delete(editor);
      setImageUploadButtonState(editor, "\u4E0A\u4F20\u56FE\u7247", false);
    });
  }
  function validateUploadProfile(profile) {
    if (!isSafeHttpsUrl(profile.endpoint) || !isSafeHttpsUrl(profile.host)) {
      throw new Error("\u300C" + profile.name + "\u300D\u7684 host/endpoint \u4E0D\u662F\u5408\u6CD5 HTTPS");
    }
    if (profile.authMode === "imgur-client-id" && !profile.token) {
      throw new Error("\u300C" + profile.name + "\u300DImgur \u7F3A\u5C11 Client ID");
    }
    if (profile.authMode === "nodeimage-api-key" && !profile.token) {
      throw new Error("\u300C" + profile.name + "\u300DNodeimage \u7F3A\u5C11 API \u5BC6\u94A5");
    }
    return profile;
  }
  function getFailoverProfiles() {
    const profiles = (settings.imageUploadProfiles || []).slice();
    if (!profiles.length) {
      profiles.push(getActiveUploadProfile());
    }
    console.log("[LSB \u56FE\u5E8A\u4E0A\u4F20] \u5019\u9009\u56FE\u5E8A\u94FE:", profiles.map(function(p) {
      return p.name + "(" + p.provider + ")";
    }));
    return profiles;
  }
  function isSafeHttpsUrl(value) {
    try {
      const url = new URL(String(value));
      return url.protocol === "https:" && !url.username && !url.password;
    } catch (error) {
      return false;
    }
  }
  function parseCustomHeaders(text) {
    const result = [];
    String(text || "").split(/\r?\n/).forEach(function(line) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.charAt(0) === "#") {
        return;
      }
      const index = trimmed.indexOf(":");
      if (index <= 0) {
        return;
      }
      const name = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim();
      if (name) {
        result.push({ name, value });
      }
    });
    return result;
  }
  function buildUploadHeaders(profile, contentType) {
    const headers = {};
    if (profile.authMode === "imgur-client-id") {
      headers.Authorization = "Client-ID " + profile.token;
    } else if (profile.authMode === "nodeimage-api-key") {
      headers["X-API-Key"] = profile.token;
    } else if (profile.authMode === "bearer" && profile.token) {
      headers.Authorization = "Bearer " + profile.token;
    }
    parseCustomHeaders(profile.headers).forEach(function(entry) {
      headers[entry.name] = entry.value;
    });
    const hasUserAgent = Object.keys(headers).some(function(name) {
      return name.toLowerCase() === "user-agent";
    });
    if (!hasUserAgent) {
      headers["User-Agent"] = String(navigator.userAgent || "Mozilla/5.0");
    }
    if (contentType) {
      headers["Content-Type"] = contentType;
    }
    return headers;
  }
  function debugLogHeaders(headers) {
    const masked = {};
    Object.keys(headers || {}).forEach(function(name) {
      const value = String(headers[name] || "");
      masked[name] = /authorization|x-api-key/i.test(name) && value ? value.slice(0, 8) + "***" : value;
    });
    console.log("[LSB \u56FE\u5E8A\u4E0A\u4F20] \u8BF7\u6C42\u5934:", masked);
  }
  function readFileAsDataUrl(file) {
    return new Promise(function(resolve, reject) {
      const reader = new FileReader();
      reader.onload = function() {
        resolve(String(reader.result || ""));
      };
      reader.onerror = function() {
        reject(new Error("\u8BFB\u53D6\u56FE\u7247\u6587\u4EF6\u5931\u8D25"));
      };
      reader.readAsDataURL(file);
    });
  }
  function readFileAsArrayBuffer(file) {
    return new Promise(function(resolve, reject) {
      const reader = new FileReader();
      reader.onload = function() {
        resolve(reader.result);
      };
      reader.onerror = function() {
        reject(new Error("\u8BFB\u53D6\u56FE\u7247\u6587\u4EF6\u5931\u8D25"));
      };
      reader.readAsArrayBuffer(file);
    });
  }
  function buildUploadBody(profile, file) {
    if (profile.method === "GET") {
      console.log("[LSB \u56FE\u5E8A\u4E0A\u4F20] \u8BF7\u6C42\u65B9\u5F0F\u4E3A GET\uFF0C\u65E0\u8BF7\u6C42\u4F53");
      return Promise.resolve({ data: void 0, contentType: "" });
    }
    if (profile.bodyType === "json") {
      return readFileAsDataUrl(file).then(function(dataUrl) {
        const base64 = String(dataUrl).indexOf(",") >= 0 ? String(dataUrl).split(",")[1] : String(dataUrl);
        console.log("[LSB \u56FE\u5E8A\u4E0A\u4F20] JSON \u8BF7\u6C42\u4F53: \u6587\u4EF6\u8F6C Base64 \u957F\u5EA6 =", base64.length, "\uFF0CJSON key =", profile.fileField);
        return {
          data: JSON.stringify({ [profile.fileField]: base64 }),
          contentType: "application/json"
        };
      });
    }
    if (profile.bodyType === "binary") {
      console.log("[LSB \u56FE\u5E8A\u4E0A\u4F20] \u4E8C\u8FDB\u5236\u8BF7\u6C42\u4F53: file.type =", file && file.type, "file.size =", file && file.size);
      return Promise.resolve({
        data: file,
        contentType: file && file.type ? file.type : "application/octet-stream"
      });
    }
    const boundary = "----lsb" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    return readFileAsArrayBuffer(file).then(function(buffer) {
      const parts = [];
      const extraFields = [];
      if (profile.provider === "catbox") {
        extraFields.push({ name: "reqtype", value: "fileupload" });
      } else if (profile.provider === "postimages") {
        extraFields.push({ name: "optsize", value: "0" });
        extraFields.push({ name: "expire", value: "0" });
      } else if (profile.provider === "freeimage") {
        extraFields.push({ name: "key", value: FREEIMAGE_PRESET.key });
        extraFields.push({ name: "action", value: "upload" });
        extraFields.push({ name: "format", value: "json" });
      }
      extraFields.forEach(function(field) {
        parts.push("--" + boundary + "\r\n");
        parts.push('Content-Disposition: form-data; name="' + field.name + '"\r\n\r\n');
        parts.push(field.value + "\r\n");
      });
      parts.push("--" + boundary + "\r\n");
      parts.push('Content-Disposition: form-data; name="' + profile.fileField + '"; filename="' + String(file.name || "image").replace(/"/g, "") + '"\r\n');
      parts.push("Content-Type: " + (file.type || "application/octet-stream") + "\r\n\r\n");
      parts.push(buffer);
      parts.push("\r\n--" + boundary + "--\r\n");
      const blob = new Blob(parts, { type: "multipart/form-data; boundary=" + boundary });
      console.log("[LSB \u56FE\u5E8A\u4E0A\u4F20] multipart \u8BF7\u6C42\u4F53: \u5B57\u6BB5 =", profile.fileField, "\u6587\u4EF6\u540D =", file && file.name, "provider =", profile.provider, "boundary =", boundary, "body\u5927\u5C0F =", blob.size);
      return { data: blob, contentType: "multipart/form-data; boundary=" + boundary };
    });
  }
  function uploadWithProfile(profile, file) {
    return buildUploadBody(profile, file).then(function(body) {
      const headers = buildUploadHeaders(profile, body.contentType);
      console.log("[LSB \u56FE\u5E8A\u4E0A\u4F20] \u53D1\u9001\u8BF7\u6C42:", profile.method, profile.endpoint);
      debugLogHeaders(headers);
      return sendUploadRequest(profile, headers, body.data).catch(function(error) {
        if (error && error.lsbRetryWithFetch && typeof GM_xmlhttpRequest === "function") {
          console.warn("[LSB \u56FE\u5E8A\u4E0A\u4F20] GM_xmlhttpRequest \u8FD4\u56DE 412\uFF08UA \u672A\u751F\u6548\uFF09\uFF0C\u6539\u7528 fetch \u91CD\u8BD5\uFF08\u6D4F\u89C8\u5668\u539F\u751F UA\uFF09");
          return sendUploadRequest(profile, headers, body.data, true);
        }
        throw error;
      });
    });
  }
  function uploadOneImage(file) {
    const profiles = getFailoverProfiles();
    const errors = [];
    const tryProfile = function(index) {
      if (index >= profiles.length) {
        const detail = errors.map(function(error) {
          return error && error.message ? error.message : String(error);
        }).join("\uFF1B");
        return Promise.reject(new Error("\u6240\u6709\u56FE\u5E8A\u5747\u4E0A\u4F20\u5931\u8D25\uFF1A" + (detail || "\u672A\u77E5\u9519\u8BEF")));
      }
      const profile = profiles[index];
      let valid;
      try {
        valid = validateUploadProfile(profile);
      } catch (error) {
        console.warn("[LSB \u56FE\u5E8A\u4E0A\u4F20] \u914D\u7F6E\u6821\u9A8C\u5931\u8D25\uFF0C\u5C1D\u8BD5\u4E0B\u4E00\u4E2A\u56FE\u5E8A: \u300C" + profile.name + "\u300D", error && error.message);
        errors.push(error);
        return tryProfile(index + 1);
      }
      console.log("[LSB \u56FE\u5E8A\u4E0A\u4F20] \u5C1D\u8BD5\u56FE\u5E8A: \u300C" + profile.name + "\u300D(" + profile.provider + ")", valid.endpoint);
      return uploadWithProfile(valid, file).catch(function(error) {
        console.warn("[LSB \u56FE\u5E8A\u4E0A\u4F20] \u56FE\u5E8A\u300C" + profile.name + "\u300D\u4E0A\u4F20\u5931\u8D25\uFF0C\u5C1D\u8BD5\u4E0B\u4E00\u4E2A:", error && error.message);
        errors.push(error);
        return tryProfile(index + 1);
      });
    };
    return tryProfile(0);
  }
  function sendUploadRequest(profile, headers, data, forceFetch = false) {
    if (!forceFetch && typeof GM_xmlhttpRequest === "function") {
      return new Promise(function(resolve, reject) {
        GM_xmlhttpRequest({
          method: profile.method,
          url: profile.endpoint,
          headers,
          data,
          responseType: profile.provider === "postimages" ? "" : "json",
          timeout: 6e4,
          onload: function(response) {
            console.log("[LSB \u56FE\u5E8A\u4E0A\u4F20] GM_xmlhttpRequest onload: status =", response.status, "\u54CD\u5E94\u6587\u672C(\u524D300\u5B57\u7B26) =", String(response.responseText || "").slice(0, 300));
            if (response.status < 200 || response.status >= 300) {
              const error = new Error("\u56FE\u5E8A\u8FD4\u56DE HTTP " + response.status);
              if (response.status === 412) {
                error.lsbRetryWithFetch = true;
              }
              reject(error);
              return;
            }
            try {
              resolve(resolveUploadedImageUrl(parseUploadResponse(response.response, response.responseText), profile));
            } catch (error) {
              console.error("[LSB \u56FE\u5E8A\u4E0A\u4F20] \u89E3\u6790\u4E0A\u4F20\u7ED3\u679C\u5931\u8D25:", error);
              reject(error);
            }
          },
          onerror: function(error) {
            console.error("[LSB \u56FE\u5E8A\u4E0A\u4F20] GM_xmlhttpRequest onerror:", error);
            reject(new Error("\u7F51\u7EDC\u6216\u8DE8\u57DF\u8BF7\u6C42\u5931\u8D25"));
          },
          ontimeout: function() {
            console.error("[LSB \u56FE\u5E8A\u4E0A\u4F20] GM_xmlhttpRequest \u8D85\u65F6(60s)");
            reject(new Error("\u8BF7\u6C42\u8D85\u65F6"));
          }
        });
      });
    }
    console.log("[LSB \u56FE\u5E8A\u4E0A\u4F20] \u4F7F\u7528 fetch \u53D1\u9001\u8BF7\u6C42\uFF08\u643A\u5E26\u6D4F\u89C8\u5668\u539F\u751F UA\uFF09");
    return fetch(profile.endpoint, {
      method: profile.method,
      headers,
      body: data,
      credentials: "omit"
    }).then(function(response) {
      if (!response.ok) {
        throw new Error("\u56FE\u5E8A\u8FD4\u56DE HTTP " + response.status);
      }
      return response.text();
    }).then(function(text) {
      console.log("[LSB \u56FE\u5E8A\u4E0A\u4F20] fetch \u54CD\u5E94(\u524D300\u5B57\u7B26) =", String(text).slice(0, 300));
      return resolveUploadedImageUrl(parseUploadResponse(null, text), profile);
    }).catch(function(error) {
      console.error("[LSB \u56FE\u5E8A\u4E0A\u4F20] fetch \u8BF7\u6C42\u5931\u8D25:", error);
      throw error;
    });
  }
  function parseUploadResponse(response, responseText) {
    if (response && typeof response === "object") {
      return response;
    }
    if (typeof responseText === "string") {
      try {
        return JSON.parse(responseText);
      } catch (error) {
        return responseText;
      }
    }
    return response;
  }
  function resolveUploadedImageUrl(payload, config) {
    console.log("[LSB \u56FE\u5E8A\u4E0A\u4F20] \u89E3\u6790\u4E0A\u4F20\u54CD\u5E94, provider =", config.provider, "responsePath =", config.responsePath, "\u54CD\u5E94\u4F53 =", typeof payload === "string" ? payload.slice(0, 300) : JSON.stringify(payload).slice(0, 300));
    if (config.provider === "postimages") {
      return extractPostimagesUrl(payload);
    }
    if (config.provider !== "nodeimage") {
      return extractImageUrl(payload, config.responsePath);
    }
    const paths = [config.responsePath, "data.url", "data.link", "url", "link", "image.url", "image.link", "data.image.url", "data.image.link"];
    for (let index = 0; index < paths.length; index += 1) {
      try {
        return extractImageUrl(payload, paths[index]);
      } catch (error) {
      }
    }
    const fallbackUrl = findFirstSafeHttpsUrl(payload, 0);
    if (fallbackUrl) {
      return fallbackUrl;
    }
    throw new Error("\u672A\u4ECE Nodeimage \u8FD4\u56DE\u7ED3\u679C\u4E2D\u53D6\u5F97 HTTPS \u56FE\u7247\u76F4\u94FE");
  }
  function extractPostimagesUrl(payload) {
    const text = typeof payload === "string" ? payload : JSON.stringify(payload || "");
    try {
      const parsed = JSON.parse(text);
      const url = parsed && (parsed.url || parsed.data && parsed.data.url);
      if (url && isSafeHttpsUrl(url)) {
        return url;
      }
    } catch (error) {
    }
    const match = text.match(/https:\/\/i\.postimg\.cc\/[A-Za-z0-9]+\/[^"'<>\s]+/);
    if (match) {
      return match[0];
    }
    throw new Error("\u672A\u4ECE Postimages \u8FD4\u56DE\u7ED3\u679C\u4E2D\u89E3\u6790\u5230\u56FE\u7247\u76F4\u94FE");
  }
  function findFirstSafeHttpsUrl(value, depth) {
    if (depth > 5 || value === null || value === void 0) {
      return "";
    }
    if (typeof value === "string") {
      const candidate = value.trim();
      return isSafeHttpsUrl(candidate) ? candidate : "";
    }
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        const arrayUrl = findFirstSafeHttpsUrl(value[index], depth + 1);
        if (arrayUrl) {
          return arrayUrl;
        }
      }
      return "";
    }
    if (typeof value === "object") {
      const keys = Object.keys(value);
      for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
        const objectUrl = findFirstSafeHttpsUrl(value[keys[keyIndex]], depth + 1);
        if (objectUrl) {
          return objectUrl;
        }
      }
    }
    return "";
  }
  function extractImageUrl(payload, path) {
    let value = payload;
    if (typeof payload === "string") {
      value = payload.trim();
    } else {
      path.split(".").forEach(function(segment) {
        if (value && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, segment)) {
          value = value[segment];
        } else {
          value = null;
        }
      });
    }
    if (typeof value !== "string" || !isSafeHttpsUrl(value)) {
      throw new Error("\u672A\u4ECE\u8FD4\u56DE\u7ED3\u679C\u4E2D\u53D6\u5F97 HTTPS \u56FE\u7247\u76F4\u94FE\uFF0C\u8BF7\u68C0\u67E5\u8FD4\u56DE\u5B57\u6BB5");
    }
    return value;
  }
  function insertMarkdownText(editor, text) {
    const prefix = getEditorText(editor) ? "\n" : "";
    const content = prefix + text + "\n";
    if (editor.matches('[contenteditable="true"]')) {
      editor.focus();
      const selection = window.getSelection();
      if (selection && selection.rangeCount && editor.contains(selection.getRangeAt(0).commonAncestorContainer)) {
        selection.getRangeAt(0).deleteContents();
        selection.getRangeAt(0).insertNode(document.createTextNode(content));
        selection.collapseToEnd();
      } else {
        editor.appendChild(document.createTextNode(content));
      }
    } else {
      const start = Number.isFinite(editor.selectionStart) ? editor.selectionStart : editor.value.length;
      const end = Number.isFinite(editor.selectionEnd) ? editor.selectionEnd : start;
      editor.focus();
      editor.setRangeText(content, start, end, "end");
    }
    editor.dispatchEvent(new Event("input", { bubbles: true }));
    editor.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function replaceEditorText(editor, search, replacement) {
    if (!search) {
      return;
    }
    if (editor.matches('[contenteditable="true"]')) {
      const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
      }
      for (let index = 0; index < textNodes.length; index += 1) {
        const node = textNodes[index];
        const foundIndex = node.textContent.indexOf(search);
        if (foundIndex < 0) {
          continue;
        }
        const before = node.textContent.slice(0, foundIndex);
        const after = node.textContent.slice(foundIndex + search.length);
        const parent = node.parentNode;
        if (!parent) {
          continue;
        }
        if (before) {
          parent.insertBefore(document.createTextNode(before), node);
        }
        if (replacement) {
          parent.insertBefore(document.createTextNode(replacement), node);
        }
        if (after) {
          parent.insertBefore(document.createTextNode(after), node);
        }
        parent.removeChild(node);
        break;
      }
    } else if (typeof editor.value === "string") {
      const value = editor.value;
      const foundIndex = value.indexOf(search);
      if (foundIndex >= 0) {
        editor.value = value.slice(0, foundIndex) + replacement + value.slice(foundIndex + search.length);
      }
    }
    editor.dispatchEvent(new Event("input", { bubbles: true }));
    editor.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function getEditorText(editor) {
    return editor.matches('[contenteditable="true"]') ? editor.textContent.trim() : String(editor.value || "").trim();
  }
  function setImageUploadButtonState(editor, text, disabled) {
    const button = editor.nextElementSibling;
    if (!button || !button.hasAttribute("data-lsb-image-upload-button")) {
      return;
    }
    button.textContent = text;
    button.disabled = disabled;
  }
  function getUploadErrorMessage(error) {
    const message = error && error.message ? String(error.message) : "\u672A\u77E5\u9519\u8BEF";
    return message.slice(0, 120);
  }
  function showUploadErrorDialog(message) {
    if (document.getElementById("lsb-upload-error-dialog")) {
      return;
    }
    const dialog = document.createElement("div");
    dialog.id = "lsb-upload-error-dialog";
    dialog.setAttribute("role", "alertdialog");
    dialog.setAttribute("aria-label", "\u56FE\u7247\u4E0A\u4F20\u5931\u8D25");
    dialog.style.cssText = [
      "position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);",
      "z-index: 2147483647; width: min(380px, calc(100vw - 32px));",
      "padding: 18px 20px; box-sizing: border-box;",
      "background: var(--panel, #1b1b1b); color: var(--text, #eeeeee);",
      "border: 1px solid var(--danger, #e28b8b); border-radius: 12px;",
      "box-shadow: 0 18px 46px var(--shadow-medium, rgba(0,0,0,.48));",
      'font: 13px/1.5 -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;',
      "text-align: center;"
    ].join(" ");
    const title = document.createElement("div");
    title.textContent = "\u56FE\u7247\u4E0A\u4F20\u5931\u8D25";
    title.style.cssText = "font-size: 15px; font-weight: 700; margin-bottom: 10px; color: var(--danger, #e28b8b);";
    const content = document.createElement("div");
    content.textContent = message;
    content.style.cssText = "color: var(--text-muted, #b6b6b6); margin-bottom: 16px; word-break: break-all;";
    const okBtn = document.createElement("button");
    okBtn.type = "button";
    okBtn.textContent = "\u77E5\u9053\u4E86";
    okBtn.style.cssText = [
      "width: 100%; padding: 9px 12px; border: 0; border-radius: 8px;",
      "background: var(--brand, #b8b8b8); color: #111; font: inherit; font-weight: 600; cursor: pointer;"
    ].join(" ");
    okBtn.addEventListener("click", function() {
      dialog.remove();
    });
    dialog.appendChild(title);
    dialog.appendChild(content);
    dialog.appendChild(okBtn);
    document.body.appendChild(dialog);
    okBtn.focus();
  }

  // dist/settings.js
  var saveTimer = 0;
  function normalizeUploadText(value, fallback, maxLength) {
    const normalized = value === null || value === void 0 ? "" : String(value).trim();
    if (!normalized) {
      return fallback;
    }
    return normalized.slice(0, maxLength);
  }
  function normalizeUploadField(value, fallback) {
    const normalized = normalizeUploadText(value, fallback, 64);
    return /^[A-Za-z0-9_-]+$/.test(normalized) ? normalized : fallback;
  }
  function normalizeUploadResponsePath(value, fallback) {
    const normalized = normalizeUploadText(value, fallback, 120);
    return /^(?:[A-Za-z_$][A-Za-z0-9_$]*)(?:\.[A-Za-z_$][A-Za-z0-9_$]*)*$/.test(normalized) ? normalized : fallback;
  }
  var IMAGE_UPLOAD_PROVIDERS = ["imgur", "nodeimage", "custom", "catbox", "postimages", "freeimage"];
  var IMAGE_UPLOAD_METHODS = ["POST", "PUT", "PATCH", "GET"];
  var IMAGE_UPLOAD_BODY_TYPES = ["multipart", "json", "binary"];
  var IMAGE_UPLOAD_AUTH_MODES = ["none", "imgur-client-id", "nodeimage-api-key", "bearer"];
  function generateProfileId() {
    return "p_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
  }
  function buildDefaultProfile(source) {
    if (source.imageUploadProvider === "imgur" && !source.imageUploadToken) {
      return {
        id: generateProfileId(),
        name: "\u9ED8\u8BA4\u56FE\u5E8A",
        provider: FREEIMAGE_PRESET.provider,
        host: FREEIMAGE_PRESET.host,
        endpoint: FREEIMAGE_PRESET.endpoint,
        method: "POST",
        headers: "",
        bodyType: "multipart",
        fileField: FREEIMAGE_PRESET.field,
        responsePath: FREEIMAGE_PRESET.responsePath,
        authMode: FREEIMAGE_PRESET.authMode,
        token: ""
      };
    }
    return {
      id: generateProfileId(),
      name: "\u9ED8\u8BA4\u56FE\u5E8A",
      provider: source.imageUploadProvider,
      host: source.imageUploadHost,
      endpoint: source.imageUploadEndpoint,
      method: "POST",
      headers: "",
      bodyType: "multipart",
      fileField: source.imageUploadFileField,
      responsePath: source.imageUploadResponsePath,
      authMode: source.imageUploadAuthMode,
      token: source.imageUploadToken
    };
  }
  function normalizeProfile(profile, defaultsSource) {
    const source = profile && typeof profile === "object" ? profile : {};
    return {
      id: String(source.id || generateProfileId()),
      name: normalizeUploadText(source.name, "\u56FE\u5E8A\u914D\u7F6E", 40),
      provider: IMAGE_UPLOAD_PROVIDERS.indexOf(source.provider) >= 0 ? source.provider : defaultsSource.imageUploadProvider,
      host: normalizeUploadText(source.host, defaultsSource.imageUploadHost, 512),
      endpoint: normalizeUploadText(source.endpoint, defaultsSource.imageUploadEndpoint, 1024),
      method: IMAGE_UPLOAD_METHODS.indexOf(source.method) >= 0 ? source.method : "POST",
      headers: normalizeUploadText(source.headers, "", 2048),
      bodyType: IMAGE_UPLOAD_BODY_TYPES.indexOf(source.bodyType) >= 0 ? source.bodyType : "multipart",
      fileField: normalizeUploadField(source.fileField, defaultsSource.imageUploadFileField),
      responsePath: normalizeUploadResponsePath(source.responsePath, defaultsSource.imageUploadResponsePath),
      authMode: IMAGE_UPLOAD_AUTH_MODES.indexOf(source.authMode) >= 0 ? source.authMode : defaultsSource.imageUploadAuthMode,
      token: normalizeUploadText(source.token, "", 512)
    };
  }
  function createImageUploadProfile(source) {
    return buildDefaultProfile(source || DEFAULTS);
  }
  function normalizeSettings(value) {
    const source = value && typeof value === "object" ? value : {};
    const result = Object.assign({}, DEFAULTS, source);
    RANGE_DEFINITIONS.forEach(function(definition) {
      const number = Number(result[definition.key]);
      if (!Number.isFinite(number)) {
        result[definition.key] = DEFAULTS[definition.key];
      }
      result[definition.key] = Math.min(definition.max, Math.max(definition.min, number));
    });
    if (!Object.prototype.hasOwnProperty.call(THEMES, result.theme)) {
      result.theme = DEFAULTS.theme;
    }
    if (!Object.prototype.hasOwnProperty.call(TEXT_PALETTES, result.textPalette)) {
      result.textPalette = DEFAULTS.textPalette;
    }
    result.homePersonalized = result.homePersonalized === true || result.homePersonalized === "true";
    result.homePostNewWindow = result.homePostNewWindow === true || result.homePostNewWindow === "true";
    result.sidebarSwap = result.sidebarSwap === true || result.sidebarSwap === "true";
    result.identityBadges = result.identityBadges === true || result.identityBadges === "true";
    result.uidBadges = result.uidBadges === true || result.uidBadges === "true";
    result.avatarProfileCard = result.avatarProfileCard === true || result.avatarProfileCard === "true";
    result.autoCheckin = result.autoCheckin === true || result.autoCheckin === "true";
    result.autoCheckinLastDate = /^\d{4}-\d{2}-\d{2}$/.test(String(result.autoCheckinLastDate || "")) ? String(result.autoCheckinLastDate) : "";
    result.imageLightbox = result.imageLightbox === true || result.imageLightbox === "true";
    result.imageUpload = result.imageUpload === true || result.imageUpload === "true";
    result.imageUploadProvider = ["imgur", "nodeimage", "custom"].indexOf(result.imageUploadProvider) >= 0 ? result.imageUploadProvider : "imgur";
    result.imageUploadHost = normalizeUploadText(result.imageUploadHost, DEFAULTS.imageUploadHost, 512);
    result.imageUploadEndpoint = normalizeUploadText(result.imageUploadEndpoint, DEFAULTS.imageUploadEndpoint, 1024);
    result.imageUploadFileField = normalizeUploadField(result.imageUploadFileField, DEFAULTS.imageUploadFileField);
    result.imageUploadResponsePath = normalizeUploadResponsePath(result.imageUploadResponsePath, DEFAULTS.imageUploadResponsePath);
    result.imageUploadAuthMode = ["none", "imgur-client-id", "nodeimage-api-key", "bearer"].indexOf(result.imageUploadAuthMode) >= 0 ? result.imageUploadAuthMode : DEFAULTS.imageUploadAuthMode;
    result.imageUploadToken = normalizeUploadText(result.imageUploadToken, "", 512);
    result.imageUploadSettingsCollapsed = result.imageUploadSettingsCollapsed === true || result.imageUploadSettingsCollapsed === "true";
    let uploadProfiles = Array.isArray(result.imageUploadProfiles) ? result.imageUploadProfiles : [];
    if (!uploadProfiles.length) {
      uploadProfiles = [buildDefaultProfile(result)];
    } else {
      uploadProfiles = uploadProfiles.map(function(profile) {
        const normalized = normalizeProfile(profile, result);
        if (normalized.provider === "imgur" && !normalized.token) {
          normalized.provider = FREEIMAGE_PRESET.provider;
          normalized.host = FREEIMAGE_PRESET.host;
          normalized.endpoint = FREEIMAGE_PRESET.endpoint;
          normalized.fileField = FREEIMAGE_PRESET.field;
          normalized.responsePath = FREEIMAGE_PRESET.responsePath;
          normalized.authMode = FREEIMAGE_PRESET.authMode;
          normalized.token = "";
        }
        if ((result.version || 0) < SETTINGS_VERSION && (normalized.provider === "catbox" || normalized.provider === "postimages")) {
          normalized.provider = FREEIMAGE_PRESET.provider;
          normalized.host = FREEIMAGE_PRESET.host;
          normalized.endpoint = FREEIMAGE_PRESET.endpoint;
          normalized.fileField = FREEIMAGE_PRESET.field;
          normalized.responsePath = FREEIMAGE_PRESET.responsePath;
          normalized.authMode = FREEIMAGE_PRESET.authMode;
          normalized.token = "";
        }
        return normalized;
      });
    }
    result.imageUploadProfiles = uploadProfiles;
    const activeProfileId = String(result.imageUploadActiveProfileId || "");
    result.imageUploadActiveProfileId = uploadProfiles.some(function(profile) {
      return profile.id === activeProfileId;
    }) ? activeProfileId : uploadProfiles[0].id;
    if (!/^#[0-9a-f]{6}$/i.test(String(result.accent))) {
      result.accent = THEMES[result.theme].accent;
    }
    result.accent = String(result.accent).toLowerCase();
    if (!/^#[0-9a-f]{6}$/i.test(String(result.textColor))) {
      result.textColor = THEMES[result.theme].textColor || DEFAULTS.textColor;
    }
    result.textColor = String(result.textColor).toLowerCase();
    ["panelLeft", "panelTop", "toggleLeft", "toggleTop"].forEach(function(key) {
      const rawPosition = result[key];
      const position = Number(rawPosition);
      result[key] = rawPosition !== null && rawPosition !== void 0 && rawPosition !== "" && Number.isFinite(position) && position >= 0 ? Math.round(position) : null;
    });
    if ((result.version || 0) < 2 && result.maxWidth === 1600) {
      result.maxWidth = 1100;
    }
    result.version = SETTINGS_VERSION;
    if (!Array.isArray(result.titleFilters)) {
      result.titleFilters = [];
    }
    if (!Array.isArray(result.userFilters)) {
      result.userFilters = [];
    }
    return result;
  }
  function loadSettings() {
    try {
      let stored = null;
      if (typeof GM_getValue === "function") {
        stored = GM_getValue(STORAGE_KEY, null);
      } else {
        const raw = localStorage.getItem(STORAGE_KEY);
        stored = raw ? JSON.parse(raw) : null;
      }
      return normalizeSettings(stored);
    } catch (error) {
      return normalizeSettings(null);
    }
  }
  function persistSettings() {
    try {
      if (typeof GM_setValue === "function") {
        GM_setValue(STORAGE_KEY, settings);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      }
      showStatus("\u8BBE\u7F6E\u5DF2\u4FDD\u5B58");
    } catch (error) {
      showStatus("\u8BBE\u7F6E\u5DF2\u5E94\u7528\uFF0C\u4F46\u4FDD\u5B58\u5931\u8D25");
    }
  }
  function scheduleSave() {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(persistSettings, 140);
  }
  function applySettings() {
    if (!document.documentElement) {
      return;
    }
    setRootVariable("--lsb-wide-max", settings.maxWidth + "px");
    setRootVariable("--lsb-header-height", settings.headerHeight + "px");
    setRootVariable("--lsb-base-font-size", settings.fontSize + "px");
    setRootVariable("--lsb-radius", settings.radius + "px");
    setRootVariable("--radius", settings.radius + "px");
    setRootVariable("--radius-sm", Math.max(0, settings.radius - 2) + "px");
    setRootVariable("--lsb-tab-radius", Math.min(settings.radius, 12) + "px");
    setRootVariable("--lsb-search-radius", Math.min(settings.radius, 12) + "px");
    setRootVariable("--lsb-sidebar-width", settings.sidebarWidth + "px");
    setRootVariable("--lsb-shell-padding", settings.shellPadding + "px");
    setRootVariable("--lsb-column-gap", settings.columnGap + "px");
    setRootVariable("--bg-soft", "var(--bg)");
    setRootVariable("--card-bg", "var(--panel)");
    applyTheme();
    document.documentElement.setAttribute("data-lsb-ready", "");
    applyHomePersonalization();
    applyHomePostNewWindow();
    applyRealtimeRefresh();
    applySidebarSwap();
    enhanceSearchFields(document);
    enforceRadiusOverrides();
    applyFilters();
    applyHomeMarkerEnhancements();
    applyAutoCheckin();
    applyImageLightbox();
    applyImageUpload();
    if (ui.panel) {
      ui.panel.style.setProperty("--lsb-ui-accent", settings.accent);
      ui.panel.style.setProperty("--lsb-ui-text", settings.textColor);
    }
    if (ui.toggleButton) {
      ui.toggleButton.style.setProperty("--lsb-ui-accent", settings.accent);
      ui.toggleButton.style.setProperty("--lsb-ui-text", settings.textColor);
    }
  }

  // dist/interface.js
  var suppressToggleClick = false;
  var modalBackdrop = null;
  var uploadEditorDraft = null;
  var uploadEditorId = null;
  var uploadEditorIsNew = false;
  function ensureInterface() {
    if (ui.panel && document.body.contains(ui.panel)) {
      return;
    }
    if (!document.body) {
      return;
    }
    ui.toggleButton = document.createElement("button");
    ui.toggleButton.id = "lsb-layout-toggle";
    ui.toggleButton.type = "button";
    ui.toggleButton.setAttribute("aria-label", "\u6253\u5F00\u5E03\u5C40\u4E0E\u4E3B\u9898\u8BBE\u7F6E");
    ui.toggleButton.setAttribute("aria-controls", "lsb-layout-panel");
    ui.toggleButton.setAttribute("aria-expanded", "false");
    ui.toggleButton.title = "\u5E03\u5C40\u4E0E\u4E3B\u9898\u8BBE\u7F6E";
    ui.toggleButton.innerHTML = [
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">',
      '<path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M7 14v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
      "</svg>"
    ].join("");
    ui.panel = document.createElement("section");
    ui.panel.id = "lsb-layout-panel";
    ui.panel.hidden = true;
    ui.panel.setAttribute("role", "dialog");
    ui.panel.setAttribute("aria-modal", "false");
    ui.panel.setAttribute("aria-label", "\u5E03\u5C40\u4E0E\u4E3B\u9898\u8BBE\u7F6E");
    ui.panel.innerHTML = [
      '<div class="lsb-panel-head">',
      '  <span class="lsb-panel-title"><strong>LINUX.SB \u5E03\u5C40\u4E0E\u4E3B\u9898\u8BBE\u7F6E</strong><span>Design:@nmxyh & <a href="https://com.com.ee" target="_blank" rel="noopener noreferrer">COMCOM</a> & <a href="https://yaoonion.fun" target="_blank" rel="noopener noreferrer">YaoOnion</a></span></span>',
      '  <button class="lsb-icon-button" type="button" data-lsb-close aria-label="\u5173\u95ED\u8BBE\u7F6E\u9762\u677F">\xD7</button>',
      "</div>",
      '<div class="lsb-tabs" role="tablist">',
      '  <button class="lsb-tab lsb-tab-active" type="button" role="tab" data-lsb-tab="layout">\u5E03\u5C40\u53C2\u6570</button>',
      '  <button class="lsb-tab" type="button" role="tab" data-lsb-tab="home">\u9996\u9875</button>',
      '  <button class="lsb-tab" type="button" role="tab" data-lsb-tab="upload">\u56FE\u5E8A\u4E0A\u4F20</button>',
      '  <button class="lsb-tab" type="button" role="tab" data-lsb-tab="theme">\u4E3B\u9898\u989C\u8272</button>',
      '  <button class="lsb-tab" type="button" role="tab" data-lsb-tab="filter">\u5185\u5BB9\u8FC7\u6EE4</button>',
      "</div>",
      '<div class="lsb-panel-body">',
      '  <div class="lsb-tab-panel" data-lsb-tab-panel="layout">',
      '    <section class="lsb-section" aria-labelledby="lsb-layout-title">',
      '      <h2 class="lsb-section-title" id="lsb-layout-title">\u5E03\u5C40\u53C2\u6570</h2>',
      "      <div data-lsb-ranges></div>",
      "    </section>",
      "  </div>",
      '  <div class="lsb-tab-panel" data-lsb-tab-panel="home" hidden>',
      '    <section class="lsb-section" aria-labelledby="lsb-home-title">',
      '      <h2 class="lsb-section-title" id="lsb-home-title">\u9996\u9875\u8BBE\u7F6E</h2>',
      '      <label class="lsb-check-line"><input type="checkbox" data-lsb-home-personalized><span>\u542F\u7528\u9996\u9875\u4E2A\u6027\u5316\u5934\u56FE\u4E0E\u641C\u7D22</span></label>',
      '      <label class="lsb-check-line"><input type="checkbox" data-lsb-home-post-new-window><span>\u5E16\u5B50\u65B0\u7A97\u53E3\u6253\u5F00</span></label>',
      '      <label class="lsb-check-line"><input type="checkbox" data-lsb-realtime-refresh><span>\u5B9E\u65F6\u66F4\u65B0\uFF08\u901A\u77E5\u4E0E\u5E16\u5B50\uFF09</span></label>',
      '      <div class="lsb-range-line" data-lsb-realtime-interval-line>',
      '        <label class="lsb-range-head"><span>\u8F6E\u8BE2\u95F4\u9694\uFF08\u79D2\uFF09</span><output data-lsb-realtime-interval-output></output></label>',
      '        <input type="range" min="15" max="600" step="15" data-lsb-realtime-interval>',
      "      </div>",
      '      <label class="lsb-check-line"><input type="checkbox" data-lsb-home-sidebar-swap><span>\u4FA7\u680F\u4F4D\u7F6E\u5BF9\u8C03</span></label>',
      '      <label class="lsb-check-line"><input type="checkbox" data-lsb-identity-badges><span>\u8EAB\u4EFD\u6807\u8BC6\u7F8E\u5316</span></label>',
      '      <label class="lsb-check-line"><input type="checkbox" data-lsb-uid-badges><span>UID \u7F8E\u5316\uFF08\u4E0E\u8EAB\u4EFD\u6807\u8BC6\u914D\u5957\uFF09</span></label>',
      '      <label class="lsb-check-line"><input type="checkbox" data-lsb-avatar-profile-card><span>\u9996\u9875\u5934\u50CF\u60AC\u505C\u57FA\u7840\u8D44\u6599\u5361</span></label>',
      "    </section>",
      '    <section class="lsb-section" aria-labelledby="lsb-func-title">',
      '      <h2 class="lsb-section-title" id="lsb-func-title">\u529F\u80FD\u5F00\u5173</h2>',
      '      <label class="lsb-check-line"><input type="checkbox" data-lsb-auto-checkin><span>\u81EA\u52A8\u7B7E\u5230\u529F\u80FD</span></label>',
      '      <label class="lsb-check-line"><input type="checkbox" data-lsb-image-lightbox><span>\u56FE\u7247\u706F\u7BB1\u529F\u80FD</span></label>',
      "    </section>",
      "  </div>",
      '  <div class="lsb-tab-panel" data-lsb-tab-panel="upload" hidden>',
      '    <section class="lsb-section" aria-labelledby="lsb-upload-title">',
      '      <h2 class="lsb-section-title" id="lsb-upload-title">\u56FE\u7247\u4E0A\u4F20</h2>',
      '      <label class="lsb-check-line"><input type="checkbox" data-lsb-image-upload><span>\u62D6\u62FD\u56FE\u7247\u4E0A\u4F20</span></label>',
      '      <button class="lsb-upload-settings-toggle" type="button" data-lsb-upload-settings-toggle aria-expanded="false">\u5C55\u5F00\u56FE\u5E8A\u914D\u7F6E</button>',
      "    </section>",
      '    <div class="lsb-upload-settings" data-lsb-upload-settings>',
      '      <div class="lsb-upload-profiles-head">',
      '        <h3 class="lsb-upload-group-title">\u56FE\u5E8A\u5217\u8868 \xB7 \u4F18\u5148\u7EA7</h3>',
      '        <p class="lsb-upload-profiles-tip">\u6309\u4F4F\u6761\u76EE\u4E0A\u4E0B\u62D6\u52A8\u6392\u5E8F\uFF0C\u8D8A\u9760\u4E0A\u4F18\u5148\u7EA7\u8D8A\u9AD8\uFF1B\u4E0A\u4F20\u5931\u8D25\u4F1A\u81EA\u52A8\u4F9D\u6B21\u5C1D\u8BD5\u4E0B\u4E00\u4E2A\u56FE\u5E8A\u3002</p>',
      "      </div>",
      '      <div class="lsb-upload-profiles" data-lsb-upload-profiles></div>',
      '      <button class="lsb-button lsb-upload-profile-add" type="button" data-lsb-upload-profile-add>+ \u65B0\u589E\u56FE\u5E8A\u914D\u7F6E</button>',
      '      <p class="lsb-upload-hint">\u542F\u7528\u540E\u53EF\u5C06\u56FE\u7247\u62D6\u5165\u53D1\u5E16\u6216\u56DE\u590D\u7F16\u8F91\u5668\uFF0C\u6216\u70B9\u51FB\u7F16\u8F91\u5668\u4E0B\u65B9\u7684\u201C\u4E0A\u4F20\u56FE\u7247\u201D\u3002\u70B9\u51FB\u4E0A\u65B9\u914D\u7F6E\u53EF\u7F16\u8F91\uFF1B\u81EA\u5B9A\u4E49\u63A5\u53E3\u53EF\u914D\u7F6E\u8BF7\u6C42\u65B9\u5F0F\u3001\u8BF7\u6C42\u4F53\u683C\u5F0F\uFF08multipart/JSON/\u4E8C\u8FDB\u5236\uFF09\u4E0E\u81EA\u5B9A\u4E49\u8BF7\u6C42\u5934\uFF0C\u8FD4\u56DE\u4E2D\u5E94\u5305\u542B\u53EF\u8BBF\u95EE\u7684 HTTPS \u56FE\u7247\u76F4\u94FE\u3002</p>',
      "    </div>",
      "  </div>",
      '  <div class="lsb-tab-panel" data-lsb-tab-panel="theme" hidden>',
      '    <section class="lsb-section" aria-labelledby="lsb-theme-title">',
      '      <h2 class="lsb-section-title" id="lsb-theme-title">\u4E3B\u9898\u989C\u8272</h2>',
      '      <label class="lsb-field"><span>\u914D\u8272\u65B9\u6848</span><select class="lsb-select" data-lsb-theme></select></label>',
      '      <label class="lsb-field"><span>\u5F3A\u8C03\u8272</span>',
      '        <span class="lsb-color-line">',
      '          <input class="lsb-color-input" type="color" data-lsb-accent aria-label="\u9009\u62E9\u5F3A\u8C03\u8272">',
      '          <output class="lsb-color-value" data-lsb-accent-value></output>',
      "        </span>",
      "      </label>",
      '      <label class="lsb-field"><span>\u6587\u5B57\u8272\u677F</span><select class="lsb-select" data-lsb-text-palette></select></label>',
      '      <label class="lsb-field"><span>\u6587\u5B57\u989C\u8272</span>',
      '        <span class="lsb-color-line">',
      '          <input class="lsb-color-input" type="color" data-lsb-text-color aria-label="\u9009\u62E9\u6587\u5B57\u989C\u8272">',
      '          <output class="lsb-color-value" data-lsb-text-color-value></output>',
      "        </span>",
      "      </label>",
      '      <p class="lsb-theme-note">\u4E2D\u6027\u6DF1\u7070\u4F7F\u7528\u7EAF\u7070\u9636\u6784\u5EFA\u80CC\u666F\u5C42\u7EA7\uFF1B\u5F3A\u8C03\u8272\u8D1F\u8D23\u4EA4\u4E92\u72B6\u6001\uFF0C\u6587\u5B57\u8272\u8D1F\u8D23\u5185\u5BB9\u5C42\u7EA7\u3002</p>',
      "    </section>",
      "  </div>",
      '  <div class="lsb-tab-panel" data-lsb-tab-panel="filter" hidden>',
      '    <section class="lsb-section" aria-labelledby="lsb-filter-title">',
      '      <h2 class="lsb-section-title" id="lsb-filter-title">\u5185\u5BB9\u8FC7\u6EE4</h2>',
      '      <label class="lsb-field"><span>\u8FC7\u6EE4\u6807\u9898\u5173\u952E\u5B57\uFF08\u6BCF\u884C\u4E00\u4E2A\uFF0C\u6700\u591A 10 \u4E2A\uFF09</span>',
      '        <textarea class="lsb-textarea" data-lsb-title-filters rows="3" placeholder="\u8F93\u5165\u8981\u5C4F\u853D\u7684\u5173\u952E\u5B57\uFF0C\u6BCF\u884C\u4E00\u4E2A"></textarea>',
      "      </label>",
      '      <label class="lsb-field"><span>\u8FC7\u6EE4\u7528\u6237\u540D\uFF08\u6BCF\u884C\u4E00\u4E2A\uFF0C\u6700\u591A 10 \u4E2A\uFF09</span>',
      '        <textarea class="lsb-textarea" data-lsb-user-filters rows="3" placeholder="\u8F93\u5165\u8981\u5C4F\u853D\u7684\u7528\u6237\u540D\uFF0C\u6BCF\u884C\u4E00\u4E2A"></textarea>',
      "      </label>",
      "    </section>",
      "  </div>",
      "</div>",
      '<div class="lsb-actions">',
      '  <button class="lsb-button" type="button" data-lsb-reset>\u6062\u590D\u9ED8\u8BA4</button>',
      '  <button class="lsb-button lsb-button-primary" type="button" data-lsb-done>\u5B8C\u6210</button>',
      "</div>",
      '<p class="lsb-status" data-lsb-status aria-live="polite"></p>',
      '<div class="lsb-upload-editor" data-lsb-upload-editor hidden>',
      '  <div class="lsb-panel-head">',
      '    <span class="lsb-panel-title"><strong data-lsb-upload-editor-title>\u7F16\u8F91\u56FE\u5E8A\u914D\u7F6E</strong><span>\u4FEE\u6539\u540E\u70B9\u51FB\u4FDD\u5B58\u751F\u6548</span></span>',
      '    <button class="lsb-icon-button" type="button" data-lsb-upload-editor-close aria-label="\u5173\u95ED">\xD7</button>',
      "  </div>",
      '  <div class="lsb-panel-body">',
      '    <div class="lsb-upload-group">',
      '      <h3 class="lsb-upload-group-title">\u57FA\u672C\u4FE1\u606F</h3>',
      '      <div class="lsb-form-grid">',
      '        <label class="lsb-field lsb-field-wide"><span>\u914D\u7F6E\u540D\u79F0</span><input class="lsb-input" type="text" data-lsb-upload-name placeholder="\u4F8B\u5982\uFF1A\u6211\u7684\u56FE\u5E8A"></label>',
      '        <label class="lsb-field"><span>\u56FE\u5E8A\u7C7B\u578B</span><select class="lsb-select" data-lsb-upload-provider><option value="freeimage">FreeImage\uFF08\u514D\u5BC6\u94A5\uFF09</option><option value="catbox">Catbox\uFF08\u514D\u5BC6\u94A5\uFF09</option><option value="postimages">Postimages</option><option value="imgur">Imgur</option><option value="nodeimage">Nodeimage</option><option value="custom">\u81EA\u5B9A\u4E49\u63A5\u53E3</option></select></label>',
      '        <label class="lsb-field"><span>\u8FD4\u56DE\u56FE\u7247\u5730\u5740\u5B57\u6BB5</span><input class="lsb-input" type="text" data-lsb-upload-response-path placeholder="data.link"></label>',
      "      </div>",
      "    </div>",
      '    <div class="lsb-upload-group">',
      '      <h3 class="lsb-upload-group-title">\u5730\u5740\u4E0E\u8BF7\u6C42</h3>',
      '      <div class="lsb-form-grid">',
      '        <label class="lsb-field"><span>\u56FE\u5E8A\u4E3B\u9875</span><input class="lsb-input" type="url" inputmode="url" data-lsb-upload-host placeholder="https://imgur.com/"></label>',
      '        <label class="lsb-field"><span>\u4E0A\u4F20\u63A5\u53E3\uFF08HTTPS\uFF09</span><input class="lsb-input" type="url" inputmode="url" data-lsb-upload-endpoint placeholder="https://api.imgur.com/3/image"></label>',
      '        <label class="lsb-field"><span>\u8BF7\u6C42\u65B9\u5F0F</span><select class="lsb-select" data-lsb-upload-method><option value="POST">POST</option><option value="PUT">PUT</option><option value="PATCH">PATCH</option><option value="GET">GET</option></select></label>',
      '        <label class="lsb-field"><span>\u8BF7\u6C42\u4F53\u683C\u5F0F</span><select class="lsb-select" data-lsb-upload-body-type><option value="multipart">multipart/form-data\uFF08\u6587\u4EF6\uFF09</option><option value="json">JSON\uFF08\u6587\u4EF6\u8F6C Base64\uFF09</option><option value="binary">\u539F\u59CB\u4E8C\u8FDB\u5236</option></select></label>',
      '        <label class="lsb-field lsb-field-wide"><span>\u81EA\u5B9A\u4E49\u8BF7\u6C42\u5934\uFF08\u6BCF\u884C Name: Value\uFF09</span><textarea class="lsb-textarea" data-lsb-upload-headers rows="3" placeholder="Authorization: Bearer xxx&#10;X-Requested-With: XMLHttpRequest"></textarea></label>',
      "      </div>",
      "    </div>",
      '    <div class="lsb-upload-group">',
      '      <h3 class="lsb-upload-group-title">\u6587\u4EF6\u4E0E\u8BA4\u8BC1</h3>',
      '      <div class="lsb-form-grid">',
      '        <label class="lsb-field"><span>\u6587\u4EF6\u5B57\u6BB5\u540D\uFF08multipart/JSON \u7528\uFF09</span><input class="lsb-input" type="text" data-lsb-upload-file-field placeholder="image"></label>',
      '        <label class="lsb-field"><span>\u8BA4\u8BC1\u65B9\u5F0F</span><select class="lsb-select" data-lsb-upload-auth-mode><option value="imgur-client-id">Imgur Client ID</option><option value="nodeimage-api-key">Nodeimage API Key</option><option value="none">\u4E0D\u4F7F\u7528\u8BA4\u8BC1</option><option value="bearer">Bearer Token</option></select></label>',
      '        <label class="lsb-field lsb-field-wide"><span>API \u5BC6\u94A5 / Token</span><input class="lsb-input" type="password" autocomplete="off" data-lsb-upload-token placeholder="Imgur \u9700\u586B\u5199 Client ID"></label>',
      "      </div>",
      "    </div>",
      "  </div>",
      '  <div class="lsb-upload-editor-actions">',
      '    <button class="lsb-button" type="button" data-lsb-upload-editor-delete>\u5220\u9664</button>',
      '    <button class="lsb-button lsb-button-primary" type="button" data-lsb-upload-editor-save>\u4FDD\u5B58</button>',
      "  </div>",
      "</div>"
    ].join("");
    modalBackdrop = document.createElement("div");
    modalBackdrop.id = "lsb-modal-backdrop";
    modalBackdrop.hidden = true;
    document.body.appendChild(modalBackdrop);
    document.body.appendChild(ui.toggleButton);
    document.body.appendChild(ui.panel);
    ui.toggleButton.classList.add(settings.sidebarSwap ? "lsb-toggle-left" : "lsb-toggle-right");
    setStatusElement(ui.panel.querySelector("[data-lsb-status]"));
    buildRangeControls();
    buildThemeControls();
    bindInterfaceEvents();
    bindDragEvents();
    syncInterface();
    applySettings();
    restoreTogglePosition();
  }
  function openUploadEditor(id, isNew) {
    const editor = ui.panel.querySelector("[data-lsb-upload-editor]");
    const profiles = settings.imageUploadProfiles || [];
    const profile = profiles.find(function(item) {
      return item.id === id;
    });
    if (!editor || !profile) {
      return;
    }
    uploadEditorId = id;
    uploadEditorIsNew = isNew;
    uploadEditorDraft = Object.assign({}, profile);
    fillUploadEditorForm(uploadEditorDraft);
    ui.panel.querySelector("[data-lsb-upload-editor-title]").textContent = isNew ? "\u65B0\u589E\u56FE\u5E8A\u914D\u7F6E" : "\u7F16\u8F91\u56FE\u5E8A\u914D\u7F6E";
    const deleteBtn = ui.panel.querySelector("[data-lsb-upload-editor-delete]");
    deleteBtn.textContent = isNew ? "\u53D6\u6D88" : "\u5220\u9664";
    editor.hidden = false;
    window.requestAnimationFrame(function() {
      const nameInput = ui.panel.querySelector("[data-lsb-upload-name]");
      if (nameInput) {
        nameInput.focus();
        nameInput.select();
      }
    });
  }
  function fillUploadEditorForm(draft) {
    [
      ["[data-lsb-upload-name]", "name"],
      ["[data-lsb-upload-provider]", "provider"],
      ["[data-lsb-upload-host]", "host"],
      ["[data-lsb-upload-endpoint]", "endpoint"],
      ["[data-lsb-upload-method]", "method"],
      ["[data-lsb-upload-body-type]", "bodyType"],
      ["[data-lsb-upload-headers]", "headers"],
      ["[data-lsb-upload-file-field]", "fileField"],
      ["[data-lsb-upload-response-path]", "responsePath"],
      ["[data-lsb-upload-auth-mode]", "authMode"],
      ["[data-lsb-upload-token]", "token"]
    ].forEach(function(item) {
      const control = ui.panel.querySelector(item[0]);
      if (control) {
        control.value = draft[item[1]] !== void 0 && draft[item[1]] !== null ? draft[item[1]] : "";
      }
    });
  }
  function closeUploadEditor(discardNew) {
    if (uploadEditorIsNew && discardNew) {
      const profiles = settings.imageUploadProfiles || [];
      const index = profiles.findIndex(function(item) {
        return item.id === uploadEditorId;
      });
      if (index >= 0) {
        profiles.splice(index, 1);
      }
      if (profiles.length) {
        settings.imageUploadActiveProfileId = profiles[0].id;
      }
      syncImageUploadControls();
      persistSettings();
    }
    const editor = ui.panel.querySelector("[data-lsb-upload-editor]");
    if (editor) {
      editor.hidden = true;
    }
    uploadEditorDraft = null;
    uploadEditorId = null;
    uploadEditorIsNew = false;
  }
  function saveUploadEditor() {
    if (!uploadEditorDraft || uploadEditorId === null) {
      return;
    }
    const profiles = settings.imageUploadProfiles || [];
    const profile = profiles.find(function(item) {
      return item.id === uploadEditorId;
    });
    if (!profile) {
      return;
    }
    Object.assign(profile, uploadEditorDraft);
    settings.imageUploadActiveProfileId = profile.id;
    closeUploadEditor(false);
    syncImageUploadControls();
    persistSettings();
    showStatus("\u56FE\u5E8A\u914D\u7F6E\u5DF2\u4FDD\u5B58");
  }
  function buildRangeControls() {
    const container = ui.panel.querySelector("[data-lsb-ranges]");
    container.className = "lsb-section";
    RANGE_DEFINITIONS.forEach(function(definition) {
      const label = document.createElement("label");
      label.className = "lsb-range-row";
      const head = document.createElement("span");
      head.className = "lsb-range-head";
      const name = document.createElement("span");
      name.className = "lsb-range-label";
      name.textContent = definition.label;
      const output = document.createElement("output");
      output.className = "lsb-range-value";
      output.dataset.valueFor = definition.key;
      const input = document.createElement("input");
      input.className = "lsb-range";
      input.type = "range";
      input.min = String(definition.min);
      input.max = String(definition.max);
      input.step = String(definition.step);
      input.dataset.settingKey = definition.key;
      input.setAttribute("aria-label", definition.label);
      head.appendChild(name);
      head.appendChild(output);
      label.appendChild(head);
      label.appendChild(input);
      container.appendChild(label);
      input.addEventListener("input", function() {
        settings[definition.key] = Number(input.value);
        output.value = input.value + definition.unit;
        output.textContent = output.value;
        applySettings();
        scheduleSave();
      });
    });
  }
  function buildThemeControls() {
    const select = ui.panel.querySelector("[data-lsb-theme]");
    Object.keys(THEMES).forEach(function(key) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = THEMES[key].label;
      select.appendChild(option);
    });
    select.addEventListener("change", function() {
      settings.theme = select.value;
      settings.accent = THEMES[settings.theme].accent;
      settings.textColor = THEMES[settings.theme].textColor || DEFAULTS.textColor;
      settings.textPalette = findTextPalette(settings.textColor);
      applySettings();
      syncInterface();
      persistSettings();
    });
    const accentInput = ui.panel.querySelector("[data-lsb-accent]");
    accentInput.addEventListener("input", function() {
      settings.accent = accentInput.value.toLowerCase();
      applySettings();
      syncAccentControl();
      scheduleSave();
    });
    const textPalette = ui.panel.querySelector("[data-lsb-text-palette]");
    Object.keys(TEXT_PALETTES).forEach(function(key) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = TEXT_PALETTES[key].label;
      textPalette.appendChild(option);
    });
    textPalette.addEventListener("change", function() {
      settings.textPalette = textPalette.value;
      if (settings.textPalette !== "custom") {
        settings.textColor = TEXT_PALETTES[settings.textPalette].color;
      }
      applySettings();
      syncTextControl();
      persistSettings();
    });
    const textInput = ui.panel.querySelector("[data-lsb-text-color]");
    textInput.addEventListener("input", function() {
      settings.textPalette = "custom";
      settings.textColor = textInput.value.toLowerCase();
      applySettings();
      syncTextControl();
      scheduleSave();
    });
  }
  function bindInterfaceEvents() {
    ui.panel.querySelector("[data-lsb-home-personalized]").addEventListener("change", function(event) {
      settings.homePersonalized = event.target.checked;
      applySettings();
      syncInterface();
      persistSettings();
    });
    ui.panel.querySelector("[data-lsb-home-post-new-window]").addEventListener("change", function(event) {
      settings.homePostNewWindow = event.target.checked;
      applyHomePostNewWindow();
      syncInterface();
      persistSettings();
    });
    ui.panel.querySelector("[data-lsb-realtime-refresh]").addEventListener("change", function(event) {
      settings.realtimeRefresh = event.target.checked;
      applyRealtimeRefresh();
      syncInterface();
      persistSettings();
      showStatus("\u8BBE\u7F6E\u5DF2\u4FDD\u5B58");
    });
    ui.panel.querySelector("[data-lsb-realtime-interval]").addEventListener("input", function(event) {
      settings.realtimeRefreshInterval = Number(event.target.value);
      ui.panel.querySelector("[data-lsb-realtime-interval-output]").textContent = String(event.target.value);
      if (settings.realtimeRefresh) {
        applyRealtimeRefresh();
      }
      persistSettings();
    });
    ui.panel.querySelector("[data-lsb-home-sidebar-swap]").addEventListener("change", function(event) {
      settings.sidebarSwap = event.target.checked;
      applySidebarSwap();
      syncInterface();
      persistSettings();
    });
    ui.panel.querySelector("[data-lsb-identity-badges]").addEventListener("change", function(event) {
      settings.identityBadges = event.target.checked;
      applyHomeMarkerEnhancements();
      syncInterface();
      persistSettings();
    });
    ui.panel.querySelector("[data-lsb-uid-badges]").addEventListener("change", function(event) {
      settings.uidBadges = event.target.checked;
      applyHomeMarkerEnhancements();
      syncInterface();
      persistSettings();
    });
    ui.panel.querySelector("[data-lsb-avatar-profile-card]").addEventListener("change", function(event) {
      settings.avatarProfileCard = event.target.checked;
      applyHomeMarkerEnhancements();
      syncInterface();
      persistSettings();
    });
    ui.panel.querySelector("[data-lsb-auto-checkin]").addEventListener("change", function(event) {
      settings.autoCheckin = event.target.checked;
      applyAutoCheckin();
      syncInterface();
      persistSettings();
    });
    ui.panel.querySelector("[data-lsb-image-lightbox]").addEventListener("change", function(event) {
      settings.imageLightbox = event.target.checked;
      applyImageLightbox();
      syncInterface();
      persistSettings();
    });
    ui.panel.querySelector("[data-lsb-image-upload]").addEventListener("change", function(event) {
      settings.imageUpload = event.target.checked;
      applyImageUpload();
      syncInterface();
      persistSettings();
    });
    ui.panel.querySelector("[data-lsb-upload-settings-toggle]").addEventListener("click", function() {
      settings.imageUploadSettingsCollapsed = !settings.imageUploadSettingsCollapsed;
      syncImageUploadControls();
      persistSettings();
    });
    const profilesContainer = ui.panel.querySelector("[data-lsb-upload-profiles]");
    profilesContainer.addEventListener("click", function(event) {
      const target = event.target;
      const item = target && target.closest ? target.closest("[data-lsb-upload-profile-id]") : null;
      if (item) {
        openUploadEditor(item.getAttribute("data-lsb-upload-profile-id"), false);
      }
    });
    ui.panel.querySelector("[data-lsb-upload-profile-add]").addEventListener("click", function() {
      const profile = createImageUploadProfile(settings);
      settings.imageUploadProfiles.push(profile);
      settings.imageUploadActiveProfileId = profile.id;
      syncImageUploadControls();
      openUploadEditor(profile.id, true);
    });
    ui.panel.querySelector("[data-lsb-upload-editor-close]").addEventListener("click", function() {
      closeUploadEditor(true);
    });
    ui.panel.querySelector("[data-lsb-upload-editor-delete]").addEventListener("click", function() {
      if (uploadEditorIsNew) {
        closeUploadEditor(true);
        return;
      }
      const profiles = settings.imageUploadProfiles || [];
      if (profiles.length <= 1) {
        showStatus("\u81F3\u5C11\u4FDD\u7559\u4E00\u4E2A\u56FE\u5E8A\u914D\u7F6E");
        return;
      }
      const index = profiles.findIndex(function(item) {
        return item.id === uploadEditorId;
      });
      if (index >= 0) {
        profiles.splice(index, 1);
      }
      settings.imageUploadActiveProfileId = profiles[0].id;
      closeUploadEditor(false);
      syncImageUploadControls();
      persistSettings();
      showStatus("\u5DF2\u5220\u9664\u56FE\u5E8A\u914D\u7F6E");
    });
    ui.panel.querySelector("[data-lsb-upload-editor-save]").addEventListener("click", saveUploadEditor);
    [
      ["[data-lsb-upload-name]", "name"],
      ["[data-lsb-upload-provider]", "provider"],
      ["[data-lsb-upload-host]", "host"],
      ["[data-lsb-upload-endpoint]", "endpoint"],
      ["[data-lsb-upload-method]", "method"],
      ["[data-lsb-upload-body-type]", "bodyType"],
      ["[data-lsb-upload-headers]", "headers"],
      ["[data-lsb-upload-file-field]", "fileField"],
      ["[data-lsb-upload-response-path]", "responsePath"],
      ["[data-lsb-upload-auth-mode]", "authMode"],
      ["[data-lsb-upload-token]", "token"]
    ].forEach(function(item) {
      const control = ui.panel.querySelector(item[0]);
      control.addEventListener("change", function() {
        if (!uploadEditorDraft) {
          return;
        }
        uploadEditorDraft[item[1]] = control.value.trim();
        if (item[1] === "provider") {
          applyProviderPreset(uploadEditorDraft);
        }
        fillUploadEditorForm(uploadEditorDraft);
      });
    });
    const parseFilterTextarea = function(value, maxItems) {
      let items = String(value).split(/[\n,]+/).map(function(s) {
        return s.trim();
      }).filter(Boolean);
      if (maxItems > 0) {
        items = items.slice(0, maxItems);
      }
      return items;
    };
    const titleFiltersTextarea = ui.panel.querySelector("[data-lsb-title-filters]");
    titleFiltersTextarea.addEventListener("blur", function() {
      const value = titleFiltersTextarea.value;
      settings.titleFilters = parseFilterTextarea(value, 10);
      titleFiltersTextarea.value = settings.titleFilters.join("\n");
      applyFilters();
      persistSettings();
    });
    const userFiltersTextarea = ui.panel.querySelector("[data-lsb-user-filters]");
    userFiltersTextarea.addEventListener("blur", function() {
      const value = userFiltersTextarea.value;
      settings.userFilters = parseFilterTextarea(value, 10);
      userFiltersTextarea.value = settings.userFilters.join("\n");
      applyFilters();
      persistSettings();
    });
    ui.toggleButton.addEventListener("click", function() {
      if (suppressToggleClick) {
        suppressToggleClick = false;
        return;
      }
      setPanelOpen(ui.panel.hidden);
    });
    ui.panel.querySelectorAll("[data-lsb-tab]").forEach(function(tab) {
      tab.addEventListener("click", function() {
        const key = tab.getAttribute("data-lsb-tab");
        ui.panel.querySelectorAll("[data-lsb-tab]").forEach(function(item) {
          item.classList.toggle("lsb-tab-active", item === tab);
        });
        ui.panel.querySelectorAll("[data-lsb-tab-panel]").forEach(function(content) {
          content.hidden = content.getAttribute("data-lsb-tab-panel") !== key;
        });
      });
    });
    ui.panel.querySelector("[data-lsb-close]").addEventListener("click", function() {
      setPanelOpen(false);
    });
    ui.panel.querySelector("[data-lsb-done]").addEventListener("click", function() {
      persistSettings();
      setPanelOpen(false);
    });
    ui.panel.querySelector("[data-lsb-reset]").addEventListener("click", function() {
      const previousLeft = settings.panelLeft;
      const previousTop = settings.panelTop;
      const previousToggleLeft = settings.toggleLeft;
      const previousToggleTop = settings.toggleTop;
      Object.assign(settings, normalizeSettings(DEFAULTS));
      settings.panelLeft = previousLeft;
      settings.panelTop = previousTop;
      settings.toggleLeft = previousToggleLeft;
      settings.toggleTop = previousToggleTop;
      applySettings();
      syncInterface();
      persistSettings();
      showStatus("\u5DF2\u6062\u590D\u9ED8\u8BA4\u4E2D\u6027\u6DF1\u7070\u65B9\u6848");
    });
    document.addEventListener("keydown", function(event) {
      if (event.key === "Escape" && ui.panel && !ui.panel.hidden) {
        setPanelOpen(false);
      }
    });
    if (modalBackdrop) {
      modalBackdrop.addEventListener("click", function() {
        setPanelOpen(false);
      });
    }
  }
  function bindDragEvents() {
    let toggleDragState = null;
    ui.toggleButton.addEventListener("pointerdown", function(event) {
      if (event.button !== 0) {
        return;
      }
      const rect = ui.toggleButton.getBoundingClientRect();
      toggleDragState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        moved: false
      };
      ui.toggleButton.classList.add("lsb-toggle-dragging");
      if (ui.toggleButton.setPointerCapture) {
        ui.toggleButton.setPointerCapture(event.pointerId);
      }
      event.preventDefault();
    });
    ui.toggleButton.addEventListener("pointermove", function(event) {
      if (!toggleDragState || event.pointerId !== toggleDragState.pointerId) {
        return;
      }
      if (Math.abs(event.clientX - toggleDragState.startX) > 4 || Math.abs(event.clientY - toggleDragState.startY) > 4) {
        toggleDragState.moved = true;
      }
      if (toggleDragState.moved) {
        setTogglePosition(event.clientX - toggleDragState.offsetX, event.clientY - toggleDragState.offsetY, false);
      }
    });
    const finishToggleDrag = function(event) {
      if (!toggleDragState || event.pointerId !== toggleDragState.pointerId) {
        return;
      }
      if (ui.toggleButton.releasePointerCapture) {
        try {
          ui.toggleButton.releasePointerCapture(event.pointerId);
        } catch (error) {
        }
      }
      const moved = toggleDragState.moved;
      suppressToggleClick = true;
      toggleDragState = null;
      ui.toggleButton.classList.remove("lsb-toggle-dragging");
      if (moved) {
        persistSettings();
      } else if (event.type === "pointerup") {
        setPanelOpen(ui.panel.hidden);
      }
      window.setTimeout(function() {
        suppressToggleClick = false;
      }, 0);
    };
    ui.toggleButton.addEventListener("pointerup", finishToggleDrag);
    ui.toggleButton.addEventListener("pointercancel", finishToggleDrag);
    window.addEventListener("resize", function() {
      if (settings.toggleLeft !== null && settings.toggleTop !== null) {
        setTogglePosition(settings.toggleLeft, settings.toggleTop, false);
        scheduleSave();
      }
    });
  }
  function setTogglePosition(left, top, persist) {
    if (!ui.toggleButton) {
      return;
    }
    const margin = 8;
    const maxLeft = Math.max(margin, window.innerWidth - ui.toggleButton.offsetWidth - margin);
    const maxTop = Math.max(margin, window.innerHeight - ui.toggleButton.offsetHeight - margin);
    const nextLeft = Math.round(Math.min(maxLeft, Math.max(margin, left)));
    const nextTop = Math.round(Math.min(maxTop, Math.max(margin, top)));
    ui.toggleButton.style.left = nextLeft + "px";
    ui.toggleButton.style.top = nextTop + "px";
    ui.toggleButton.style.right = "auto";
    ui.toggleButton.style.bottom = "auto";
    settings.toggleLeft = nextLeft;
    settings.toggleTop = nextTop;
    if (persist) {
      persistSettings();
    }
  }
  function restoreTogglePosition() {
    if (!ui.toggleButton || settings.toggleLeft === null || settings.toggleTop === null) {
      return;
    }
    setTogglePosition(settings.toggleLeft, settings.toggleTop, false);
  }
  function syncInterface() {
    if (!ui.panel) {
      return;
    }
    RANGE_DEFINITIONS.forEach(function(definition) {
      const input = ui.panel.querySelector('[data-setting-key="' + definition.key + '"]');
      const output = ui.panel.querySelector('[data-value-for="' + definition.key + '"]');
      input.value = String(settings[definition.key]);
      output.value = settings[definition.key] + definition.unit;
      output.textContent = output.value;
    });
    ui.panel.querySelector("[data-lsb-theme]").value = settings.theme;
    ui.panel.querySelector("[data-lsb-home-personalized]").checked = settings.homePersonalized;
    ui.panel.querySelector("[data-lsb-home-post-new-window]").checked = settings.homePostNewWindow;
    ui.panel.querySelector("[data-lsb-realtime-refresh]").checked = settings.realtimeRefresh;
    const realtimeInterval = ui.panel.querySelector("[data-lsb-realtime-interval]");
    realtimeInterval.value = String(settings.realtimeRefreshInterval);
    ui.panel.querySelector("[data-lsb-realtime-interval-output]").textContent = String(settings.realtimeRefreshInterval);
    ui.panel.querySelector("[data-lsb-realtime-interval-line]").style.display = settings.realtimeRefresh ? "" : "none";
    ui.panel.querySelector("[data-lsb-home-sidebar-swap]").checked = settings.sidebarSwap;
    ui.panel.querySelector("[data-lsb-identity-badges]").checked = settings.identityBadges;
    ui.panel.querySelector("[data-lsb-uid-badges]").checked = settings.uidBadges;
    ui.panel.querySelector("[data-lsb-avatar-profile-card]").checked = settings.avatarProfileCard;
    ui.panel.querySelector("[data-lsb-auto-checkin]").checked = settings.autoCheckin;
    ui.panel.querySelector("[data-lsb-image-lightbox]").checked = settings.imageLightbox;
    ui.panel.querySelector("[data-lsb-image-upload]").checked = settings.imageUpload;
    syncImageUploadControls();
    const titleFiltersTextarea = ui.panel.querySelector("[data-lsb-title-filters]");
    if (titleFiltersTextarea) {
      titleFiltersTextarea.value = (settings.titleFilters || []).join("\n");
    }
    const userFiltersTextarea = ui.panel.querySelector("[data-lsb-user-filters]");
    if (userFiltersTextarea) {
      userFiltersTextarea.value = (settings.userFilters || []).join("\n");
    }
    syncAccentControl();
    syncTextControl();
  }
  function syncAccentControl() {
    if (!ui.panel) {
      return;
    }
    ui.panel.querySelector("[data-lsb-accent]").value = settings.accent;
    ui.panel.querySelector("[data-lsb-accent-value]").value = settings.accent.toUpperCase();
    ui.panel.querySelector("[data-lsb-accent-value]").textContent = settings.accent.toUpperCase();
    ui.panel.style.setProperty("--lsb-ui-accent", settings.accent);
    ui.toggleButton.style.setProperty("--lsb-ui-accent", settings.accent);
  }
  function syncTextControl() {
    if (!ui.panel) {
      return;
    }
    ui.panel.querySelector("[data-lsb-text-palette]").value = settings.textPalette;
    ui.panel.querySelector("[data-lsb-text-color]").value = settings.textColor;
    ui.panel.querySelector("[data-lsb-text-color-value]").value = settings.textColor.toUpperCase();
    ui.panel.querySelector("[data-lsb-text-color-value]").textContent = settings.textColor.toUpperCase();
    ui.panel.style.setProperty("--lsb-ui-text", settings.textColor);
    ui.toggleButton.style.setProperty("--lsb-ui-text", settings.textColor);
  }
  function setPanelOpen(open) {
    if (!ui.panel || !ui.toggleButton) {
      return;
    }
    ui.panel.hidden = !open;
    if (modalBackdrop) {
      modalBackdrop.hidden = !open;
    }
    ui.toggleButton.setAttribute("aria-expanded", String(open));
    ui.toggleButton.setAttribute("aria-label", open ? "\u5173\u95ED\u5E03\u5C40\u4E0E\u4E3B\u9898\u8BBE\u7F6E" : "\u6253\u5F00\u5E03\u5C40\u4E0E\u4E3B\u9898\u8BBE\u7F6E");
    if (open) {
      syncInterface();
      window.requestAnimationFrame(function() {
        ui.panel.querySelector("[data-lsb-close]").focus();
      });
    } else {
      ui.toggleButton.focus();
    }
  }

  // dist/checkUpdate.js
  function checkUpdate() {
    const currentScriptVersion = GM_info.script.version;
    const lastCheckTime = parseInt(localStorage.getItem(LOCAL_STORAGE_LAST_CHECK_TIME) || "0", 10);
    const now = Date.now();
    const isStandardVersion = /^[0-9]+\.[0-9]+\.[0-9]+$/.test(currentScriptVersion);
    const currentCheckInterval = isStandardVersion ? UPDATE_CHECK_INTERVAL : PREVIEW_UPDATE_CHECK_INTERVAL;
    if (now - lastCheckTime < currentCheckInterval) {
      console.log("[LSB] \u8DDD\u79BB\u4E0A\u6B21\u68C0\u67E5\u66F4\u65B0\u65F6\u95F4\u4E0D\u8DB3\uFF0C\u8DF3\u8FC7\u68C0\u67E5\u3002");
      return;
    }
    console.log("[LSB] \u6B63\u5728\u68C0\u67E5\u66F4\u65B0...");
    localStorage.setItem(LOCAL_STORAGE_LAST_CHECK_TIME, now.toString());
    const versionPath = isStandardVersion ? "pub" : "perv";
    const updateUrl = STATIC_BASE_URL + "/" + versionPath + "/" + UPDATE_VERSION_FILE;
    GM_xmlhttpRequest({
      method: "GET",
      url: updateUrl,
      onload: function(response) {
        try {
          const remotePackageJson = JSON.parse(response.responseText);
          const remoteVersion = remotePackageJson.version;
          if (remoteVersion && remoteVersion !== currentScriptVersion) {
            console.log("[LSB] \u53D1\u73B0\u65B0\u7248\u672C\uFF01\u5F53\u524D\u7248\u672C:", currentScriptVersion, "\u6700\u65B0\u7248\u672C:", remoteVersion);
            const userScriptUrl = STATIC_BASE_URL + "/" + versionPath + "/" + UPDATE_SCRIPT_FILE;
            showUpdateDialog(remoteVersion, currentScriptVersion, userScriptUrl);
          } else {
            console.log("[LSB] \u5F53\u524D\u5DF2\u662F\u6700\u65B0\u7248\u672C\u3002");
          }
        } catch (error) {
          console.error("[LSB] \u89E3\u6790\u66F4\u65B0\u4FE1\u606F\u5931\u8D25:", error);
        }
      },
      onerror: function(response) {
        console.error("[LSB] \u68C0\u67E5\u66F4\u65B0\u5931\u8D25:", response.status, response.statusText);
      }
    });
  }
  function showUpdateDialog(remoteVersion, currentVersion, userScriptUrl) {
    if (document.getElementById("lsb-update-dialog")) {
      return;
    }
    const dialog = document.createElement("div");
    dialog.id = "lsb-update-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-label", "\u53D1\u73B0\u65B0\u7248\u672C");
    dialog.style.cssText = [
      "position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);",
      "z-index: 2147483647; width: min(340px, calc(100vw - 32px));",
      "padding: 18px 20px; box-sizing: border-box;",
      "background: var(--panel, #1b1b1b); color: var(--text, #eeeeee);",
      "border: 1px solid var(--line, #343434); border-radius: 12px;",
      "box-shadow: 0 18px 46px var(--shadow-medium, rgba(0,0,0,.48));",
      'font: 13px/1.5 -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;',
      "text-align: center;"
    ].join(" ");
    dialog.innerHTML = [
      '<div style="font-size: 15px; font-weight: 700; margin-bottom: 10px;">\u53D1\u73B0\u65B0\u7248\u672C ' + remoteVersion + "</div>",
      '<div style="color: var(--text-muted, #b6b6b6); margin-bottom: 16px;">\u5F53\u524D\u7248\u672C ' + currentVersion + "\uFF0C\u70B9\u51FB\u4E0B\u65B9\u6309\u94AE\u524D\u5F80\u65B0\u7248\u672C\u9875\u9762\u3002</div>",
      '<div style="display: flex; gap: 10px; justify-content: center;">',
      '  <button id="lsb-update-open" style="flex: 1; padding: 9px 12px; border: 0; border-radius: 8px; background: var(--brand, #b8b8b8); color: #111; font: inherit; font-weight: 600; cursor: pointer;">\u53BB\u66F4\u65B0</button>',
      '  <button id="lsb-update-close" style="flex: 1; padding: 9px 12px; border: 1px solid var(--line, #343434); border-radius: 8px; background: transparent; color: var(--text-muted, #b6b6b6); font: inherit; cursor: pointer;">\u7A0D\u540E\u518D\u8BF4</button>',
      "</div>"
    ].join("");
    document.body.appendChild(dialog);
    dialog.querySelector("#lsb-update-open").addEventListener("click", function() {
      if (typeof GM_openInTab === "function") {
        GM_openInTab(userScriptUrl, false);
      } else {
        window.open(userScriptUrl, "_blank");
      }
      dialog.remove();
    });
    dialog.querySelector("#lsb-update-close").addEventListener("click", function() {
      dialog.remove();
    });
  }

  // dist/main.js
  var homeObserver = null;
  function addStyle(cssText) {
    if (typeof GM_addStyle === "function") {
      GM_addStyle(cssText);
      return;
    }
    const style = document.createElement("style");
    style.id = "linux-sb-wide-layout-style";
    style.textContent = cssText;
    (document.head || document.documentElement).appendChild(style);
  }
  function buildStartupCss(currentSettings) {
    const variables = {
      "--lsb-wide-max": currentSettings.maxWidth + "px",
      "--lsb-header-height": currentSettings.headerHeight + "px",
      "--lsb-base-font-size": currentSettings.fontSize + "px",
      "--lsb-radius": currentSettings.radius + "px",
      "--radius": currentSettings.radius + "px",
      "--radius-sm": Math.max(0, currentSettings.radius - 2) + "px",
      "--lsb-tab-radius": Math.min(currentSettings.radius, 12) + "px",
      "--lsb-search-radius": Math.min(currentSettings.radius, 12) + "px",
      "--lsb-sidebar-width": currentSettings.sidebarWidth + "px",
      "--lsb-shell-padding": currentSettings.shellPadding + "px",
      "--lsb-column-gap": currentSettings.columnGap + "px",
      "--bg-soft": "var(--bg)",
      "--card-bg": "var(--panel)"
    };
    const theme = THEMES[currentSettings.theme] || THEMES.neutral;
    if (theme.vars) {
      Object.keys(theme.vars).forEach(function(name) {
        variables[name] = theme.vars[name];
      });
    }
    const accentRgb = hexToRgb(currentSettings.accent);
    const background = theme.vars && theme.vars["--bg"] ? theme.vars["--bg"] : "#1a1b2e";
    variables["--brand"] = currentSettings.accent;
    variables["--brand-hover"] = mixHex(currentSettings.accent, "#ffffff", 0.18);
    variables["--brand-soft"] = "rgba(" + accentRgb.r + "," + accentRgb.g + "," + accentRgb.b + ",.16)";
    variables["--focus-ring"] = "rgba(" + accentRgb.r + "," + accentRgb.g + "," + accentRgb.b + ",.34)";
    variables["--text"] = currentSettings.textColor;
    variables["--text-muted"] = mixHex(currentSettings.textColor, background, 0.34);
    variables["--text-subtle"] = mixHex(currentSettings.textColor, background, 0.55);
    variables["--text-disabled"] = mixHex(currentSettings.textColor, background, 0.72);
    if (currentSettings.theme !== "original") {
      variables["--swal2-background"] = "var(--panel)";
      variables["--swal2-color"] = "var(--text)";
      variables["--swal2-validation-message-background"] = "var(--line-soft)";
      variables["--swal2-validation-message-color"] = "var(--text-muted)";
    }
    return [
      ":root:not([data-lsb-ready]) {",
      Object.keys(variables).map(function(name) {
        return "  " + name + ": " + variables[name] + " !important;";
      }).join("\n"),
      "}"
    ].join("\n");
  }
  function startHomeObserver() {
    if (homeObserver || typeof MutationObserver !== "function") {
      return;
    }
    homeObserver = new MutationObserver(function(mutations) {
      applyHomePersonalization();
      applyHomePostNewWindow();
      enhanceSearchFields(document);
      enforceRadiusOverrides();
      scheduleFilter();
      if (shouldRefreshHomeMarkerEnhancements(mutations)) {
        scheduleHomeMarkerEnhancements();
      }
      updateImageLightboxTargets();
      updateImageUploadTargets();
    });
    homeObserver.observe(document, { childList: true, subtree: true });
  }
  Object.assign(settings, loadSettings());
  addStyle(buildStartupCss(settings) + "\n" + BASE_CSS);
  applySettings();
  startHomeObserver();
  checkUpdate();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureInterface, { once: true });
  } else {
    ensureInterface();
  }
  if (typeof GM_registerMenuCommand === "function") {
    GM_registerMenuCommand("\u6253\u5F00 LINUX SB \u5E03\u5C40\u8BBE\u7F6E", function() {
      ensureInterface();
      setPanelOpen(true);
    });
  }
})();
