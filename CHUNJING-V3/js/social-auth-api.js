(function () {
  const PROVIDERS = Object.freeze(["wechat", "qq"]);

  function normalizeProvider(provider) {
    const value = String(provider || "").trim().toLowerCase();
    return PROVIDERS.includes(value) ? value : "wechat";
  }

  function getConfig() {
    const config = window.SOCIAL_AUTH_CONFIG || {};
    const providers = config.providers || {};
    return {
      pollIntervalMs: Number(config.pollIntervalMs || 2500),
      pollTimeoutMs: Number(config.pollTimeoutMs || 120000),
      providers: {
        wechat: providers.wechat || {},
        qq: providers.qq || {}
      }
    };
  }

  function resolveProviderConfig(provider) {
    const normalizedProvider = normalizeProvider(provider);
    const config = getConfig();
    return {
      provider: normalizedProvider,
      config,
      providerConfig: config.providers[normalizedProvider] || {}
    };
  }

  async function requestJson(url, init) {
    const response = await fetch(url, init);
    const text = await response.text();
    let payload = {};

    if (text) {
      payload = JSON.parse(text);
    }

    if (!response.ok) {
      const message = (payload && payload.message) || `HTTP ${response.status}`;
      throw new Error(message);
    }

    return payload;
  }

  function pickData(payload) {
    if (payload && typeof payload === "object" && payload.data && typeof payload.data === "object") {
      return payload.data;
    }
    return payload && typeof payload === "object" ? payload : {};
  }

  function makePlaceholderQr(provider) {
    const normalizedProvider = normalizeProvider(provider);
    const providerLabel = normalizedProvider === "qq" ? "QQ" : "微信";
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280" viewBox="0 0 280 280">
  <rect width="280" height="280" rx="16" fill="#0b1020"/>
  <rect x="20" y="20" width="240" height="240" rx="12" fill="#ffffff"/>
  <rect x="40" y="40" width="52" height="52" fill="#0b1020"/>
  <rect x="188" y="40" width="52" height="52" fill="#0b1020"/>
  <rect x="40" y="188" width="52" height="52" fill="#0b1020"/>
  <g fill="#0b1020">
    <rect x="108" y="40" width="8" height="8"/>
    <rect x="124" y="40" width="8" height="8"/>
    <rect x="140" y="40" width="8" height="8"/>
    <rect x="108" y="56" width="8" height="8"/>
    <rect x="140" y="56" width="8" height="8"/>
    <rect x="108" y="72" width="8" height="8"/>
    <rect x="124" y="72" width="8" height="8"/>
    <rect x="140" y="72" width="8" height="8"/>
    <rect x="108" y="108" width="8" height="8"/>
    <rect x="124" y="108" width="8" height="8"/>
    <rect x="140" y="108" width="8" height="8"/>
    <rect x="156" y="108" width="8" height="8"/>
    <rect x="172" y="108" width="8" height="8"/>
    <rect x="188" y="108" width="8" height="8"/>
    <rect x="108" y="124" width="8" height="8"/>
    <rect x="140" y="124" width="8" height="8"/>
    <rect x="172" y="124" width="8" height="8"/>
    <rect x="108" y="140" width="8" height="8"/>
    <rect x="124" y="140" width="8" height="8"/>
    <rect x="156" y="140" width="8" height="8"/>
    <rect x="188" y="140" width="8" height="8"/>
    <rect x="108" y="156" width="8" height="8"/>
    <rect x="140" y="156" width="8" height="8"/>
    <rect x="156" y="156" width="8" height="8"/>
    <rect x="188" y="156" width="8" height="8"/>
    <rect x="108" y="172" width="8" height="8"/>
    <rect x="124" y="172" width="8" height="8"/>
    <rect x="140" y="172" width="8" height="8"/>
    <rect x="172" y="172" width="8" height="8"/>
    <rect x="188" y="172" width="8" height="8"/>
  </g>
  <text x="140" y="246" text-anchor="middle" font-size="14" fill="#0b1020">${providerLabel}扫码登录待接入</text>
</svg>`;
    return {
      qrCodeUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      message: `${providerLabel}扫码登录接口未配置，当前为接入预留页面`
    };
  }

  async function createQrSession(provider, extraPayload) {
    const context = resolveProviderConfig(provider);
    const providerConfig = context.providerConfig;

    if (!providerConfig.enabled || !providerConfig.createSessionUrl) {
      return {
        ok: false,
        code: "NOT_CONFIGURED",
        message: "扫码登录接口未配置",
        placeholder: makePlaceholderQr(context.provider)
      };
    }

    const payload = {
      provider: context.provider,
      clientId: String(providerConfig.clientId || ""),
      redirectUri: String(providerConfig.redirectUri || ""),
      scope: String(providerConfig.scope || ""),
      ...extraPayload
    };

    try {
      const response = await requestJson(providerConfig.createSessionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = pickData(response);
      const sessionId = String(data.sessionId || data.sid || "").trim();
      const qrCodeUrl = String(data.qrCodeUrl || data.qr_url || "").trim();
      const expiresAt = Number(data.expiresAt || data.expireAt || 0);

      if (!sessionId || !qrCodeUrl) {
        return {
          ok: false,
          code: "INVALID_RESPONSE",
          message: "扫码接口返回缺少 sessionId 或 qrCodeUrl"
        };
      }

      return {
        ok: true,
        sessionId,
        qrCodeUrl,
        expiresAt: Number.isFinite(expiresAt) ? expiresAt : 0
      };
    } catch (error) {
      return {
        ok: false,
        code: "REQUEST_FAILED",
        message: error && error.message ? error.message : "创建扫码会话失败"
      };
    }
  }

  async function queryQrStatus(provider, sessionId) {
    const context = resolveProviderConfig(provider);
    const providerConfig = context.providerConfig;
    const normalizedSessionId = String(sessionId || "").trim();

    if (!providerConfig.enabled || !providerConfig.queryStatusUrl || !normalizedSessionId) {
      return {
        ok: false,
        code: "NOT_CONFIGURED",
        message: "状态查询接口未配置"
      };
    }

    try {
      const response = await requestJson(providerConfig.queryStatusUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          provider: context.provider,
          sessionId: normalizedSessionId
        })
      });
      const data = pickData(response);
      const status = String(data.status || "pending").trim().toLowerCase();

      return {
        ok: true,
        status,
        token: data.token || "",
        user: data.user || null,
        raw: data
      };
    } catch (error) {
      return {
        ok: false,
        code: "REQUEST_FAILED",
        message: error && error.message ? error.message : "查询扫码状态失败"
      };
    }
  }

  window.socialAuthApi = {
    PROVIDERS,
    getConfig,
    normalizeProvider,
    createQrSession,
    queryQrStatus,
    makePlaceholderQr
  };
})();
