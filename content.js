/**
 * YouTube Sort Back - Content Script
 * YouTube検索結果ページに並び替えボタンを追加する
 */
(() => {
  "use strict";

  // ========================================
  // 定数
  // ========================================

  /** ソートモードに対応するYouTubeのspパラメータ値 */
  const SORT_PARAMS = {
    UPLOAD_DATE: "CAI=",
    VIEW_COUNT: "CAM=",
  };

  /** i18nメッセージを取得（未定義の場合はfallbackを使う） */
  const t = (key, fallback) => {
    try {
      const msg = chrome?.i18n?.getMessage?.(key);
      return msg || fallback;
    } catch {
      return fallback;
    }
  };

  /** ソートモードの表示ラベル */
  const getModeLabel = (mode) => {
    if (mode === "UPLOAD_DATE") return t("sortUploadDate", "最新順");
    if (mode === "VIEW_COUNT") return t("sortViewCount", "視聴回数順");
    return "";
  };

  /** オーバーレイ要素のID */
  const OVERLAY_ID = "yt-sort-back-overlay";

  /** URL変更検知のポーリング間隔（ミリ秒） */
  const URL_POLL_INTERVAL_MS = 500;

  /** リトライ時の試行回数 */
  const RETRY_ATTEMPTS = 6;

  /** リトライ時の間隔（ミリ秒） */
  const RETRY_INTERVAL_MS = 250;

  // ========================================
  // ユーティリティ関数
  // ========================================

  /**
   * spパラメータを正規化する（多重エンコードを解除）
   * @param {string|null} sp - spパラメータの値
   * @returns {string|null} 正規化された値
   */
  const normalizeSp = (sp) => {
    if (!sp) return sp;

    let value = sp;
    const MAX_DECODE_ITERATIONS = 3;

    for (let i = 0; i < MAX_DECODE_ITERATIONS; i++) {
      if (!/%[0-9a-f]{2}/i.test(value)) break;

      try {
        const decoded = decodeURIComponent(value);
        if (decoded === value) break;
        value = decoded;
      } catch {
        break;
      }
    }

    return value;
  };

  /**
   * 現在のページがYouTube検索結果ページかどうかを判定
   * @returns {boolean}
   */
  const isResultsPage = () => {
    const url = new URL(location.href);
    return url.pathname === "/results" && url.searchParams.has("search_query");
  };

  /**
   * オーバーレイ要素を削除する
   */
  const removeOverlay = () => {
    const overlay = document.getElementById(OVERLAY_ID);
    if (overlay) overlay.remove();
  };

  /**
   * spパラメータからソートモードを取得
   * @param {string|null} sp - spパラメータの値
   * @returns {string|null} ソートモード（"UPLOAD_DATE" | "VIEW_COUNT" | null）
   */
  const getModeFromSp = (sp) => {
    if (!sp) return null;

    const normalized = normalizeSp(sp);

    if (normalized === SORT_PARAMS.UPLOAD_DATE) return "UPLOAD_DATE";
    if (normalized === SORT_PARAMS.VIEW_COUNT) return "VIEW_COUNT";

    return null;
  };

  /**
   * 指定されたソートモードでURLを更新してナビゲート
   * @param {string} mode - ソートモード（"UPLOAD_DATE" | "VIEW_COUNT"）
   */
  const setSpAndNavigate = (mode) => {
    const url = new URL(location.href);
    url.searchParams.set("sp", SORT_PARAMS[mode]);

    const newUrl = url.toString();
    if (newUrl === location.href) return;

    location.assign(newUrl);
  };

  // ========================================
  // UI関連
  // ========================================

  /**
   * オーバーレイのスタイルを生成
   * @returns {string} CSSテキスト
   */
  const getOverlayStyles = () => `
    :host {
      all: initial;
    }
    .wrap {
      position: fixed;
      right: 16px;
      bottom: 16px;
      z-index: 2147483647;
      display: flex;
      gap: 8px;
      padding: 8px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.92);
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.16);
      backdrop-filter: blur(6px);
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    }
    button {
      all: unset;
      cursor: pointer;
      padding: 8px 10px;
      border-radius: 999px;
      font-size: 12px;
      line-height: 1;
      background: rgba(0, 0, 0, 0.06);
      color: #0f0f0f;
      user-select: none;
      transition: background 0.15s, color 0.15s;
    }
    button:hover {
      background: rgba(0, 0, 0, 0.12);
    }
    button[data-active="true"] {
      background: #0f0f0f;
      color: #fff;
    }
    button[data-active="true"]:hover {
      background: #262626;
    }
  `;

  /**
   * ソートボタンを作成
   * @param {string} mode - ソートモード
   * @param {string} label - ボタンのラベル
   * @returns {HTMLButtonElement}
   */
  const createSortButton = (mode, label) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.mode = mode;
    button.addEventListener("click", () => setSpAndNavigate(mode));
    return button;
  };

  /**
   * オーバーレイを作成または更新する
   */
  const ensureOverlay = () => {
    if (!isResultsPage()) {
      removeOverlay();
      return;
    }

    if (document.getElementById(OVERLAY_ID)) return;

    // Shadow DOMを使用してスタイルの衝突を防ぐ
    const host = document.createElement("div");
    host.id = OVERLAY_ID;

    const shadow = host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = getOverlayStyles();

    const wrap = document.createElement("div");
    wrap.className = "wrap";

    const btnUpload = createSortButton("UPLOAD_DATE", getModeLabel("UPLOAD_DATE"));
    const btnViews = createSortButton("VIEW_COUNT", getModeLabel("VIEW_COUNT"));

    wrap.append(btnUpload, btnViews);
    shadow.append(style, wrap);
    document.documentElement.appendChild(host);

    /**
     * ボタンのアクティブ状態を更新
     */
    const updateActiveState = () => {
      const currentSp = new URL(location.href).searchParams.get("sp");
      const currentMode = getModeFromSp(currentSp);

      btnUpload.dataset.active = String(currentMode === "UPLOAD_DATE");
      btnViews.dataset.active = String(currentMode === "VIEW_COUNT");
    };

    updateActiveState();

    // URL変更を検知してアクティブ状態を更新
    let lastHref = location.href;
    setInterval(() => {
      if (location.href === lastHref) return;
      lastHref = location.href;
      updateActiveState();
    }, URL_POLL_INTERVAL_MS);
  };

  // ========================================
  // イベント処理
  // ========================================

  /**
   * オーバーレイ更新をデバウンスしてスケジュール
   */
  const scheduleEnsureOverlay = (() => {
    let timerId = null;

    return () => {
      if (timerId !== null) {
        clearTimeout(timerId);
      }

      timerId = setTimeout(() => {
        timerId = null;
        ensureOverlay();
      }, 0);
    };
  })();

  /**
   * リトライ付きでオーバーレイを確保する
   * @param {number} attempts - 試行回数
   */
  const ensureOverlayWithRetry = (attempts = RETRY_ATTEMPTS) => {
    let remaining = attempts;

    const tick = () => {
      ensureOverlay();
      remaining -= 1;

      if (remaining > 0) {
        setTimeout(tick, RETRY_INTERVAL_MS);
      }
    };

    tick();
  };

  // ========================================
  // 初期化
  // ========================================

  /**
   * 拡張機能を初期化する
   */
  const initialize = () => {
    ensureOverlay();

    // YouTubeのSPA遷移を検知
    window.addEventListener("yt-navigate-finish", () => ensureOverlayWithRetry());

    // ブラウザの戻る/進むを検知
    window.addEventListener("popstate", () => ensureOverlayWithRetry());

    // タブがアクティブになったときに再確認
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        ensureOverlayWithRetry();
      }
    });

    // DOM変更を監視（YouTubeが動的にコンテンツを更新するため）
    const observer = new MutationObserver(() => scheduleEnsureOverlay());
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  };

  initialize();
})();
