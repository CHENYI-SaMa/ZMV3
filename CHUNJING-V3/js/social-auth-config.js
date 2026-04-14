(function () {
  if (window.SOCIAL_AUTH_CONFIG) {
    return;
  }

  window.SOCIAL_AUTH_CONFIG = {
    pollIntervalMs: 2500,
    pollTimeoutMs: 120000,
    providers: {
      wechat: {
        enabled: false,
        createSessionUrl: "",
        queryStatusUrl: "",
        clientId: "",
        redirectUri: "",
        scope: "snsapi_login"
      },
      qq: {
        enabled: false,
        createSessionUrl: "",
        queryStatusUrl: "",
        clientId: "",
        redirectUri: "",
        scope: "get_user_info"
      }
    }
  };
})();
