(function () {
  const PAYMENT_PASSWORD_REGEX = /^\d{6}$/;
  // Demo-only note: this project has no backend, so password state is kept in local storage.

  function getLoggedInUser() {
    return JSON.parse(localStorage.getItem('zhimai_user') || sessionStorage.getItem('zhimai_user') || 'null');
  }

  function setLoggedInUser(user) {
    if (localStorage.getItem('zhimai_user')) {
      localStorage.setItem('zhimai_user', JSON.stringify(user));
    }

    if (sessionStorage.getItem('zhimai_user')) {
      sessionStorage.setItem('zhimai_user', JSON.stringify(user));
    }
  }

  function getStoredUsers() {
    if (typeof dataManager !== 'undefined' && dataManager && typeof dataManager.getUsers === 'function') {
      try {
        const users = dataManager.getUsers();
        if (Array.isArray(users)) {
          return users;
        }
      } catch (error) {
        // Fall back to localStorage when shared data access is unavailable.
      }
    }

    return JSON.parse(localStorage.getItem('zhimai_users') || '[]');
  }

  function saveStoredUsers(users) {
    if (typeof dataManager !== 'undefined' && dataManager && typeof dataManager.saveUsers === 'function') {
      try {
        dataManager.saveUsers(users);
        return;
      } catch (error) {
        // Fall back to localStorage when shared data access is unavailable.
      }
    }

    localStorage.setItem('zhimai_users', JSON.stringify(users));
  }

  function getCurrentUserState() {
    const currentUser = getLoggedInUser();
    if (!currentUser) return null;

    const users = getStoredUsers();
    const matchedUsers = users.filter(user => isSameUser(user, currentUser));
    const storedUser = matchedUsers.length ? matchedUsers[matchedUsers.length - 1] : null;

    if (!storedUser) {
      return currentUser;
    }

    const nextUser = { ...currentUser, ...storedUser };
    const storedPassword = getPaymentPasswordFromUser(storedUser);
    const currentPassword = getPaymentPasswordFromUser(currentUser);
    nextUser.paymentPassword = PAYMENT_PASSWORD_REGEX.test(storedPassword) ? storedPassword : currentPassword;
    setLoggedInUser(nextUser);
    return nextUser;
  }

  function persistLoggedInUserPatch(patch) {
    const currentUser = getCurrentUserState();
    if (!currentUser) return null;

    const nextUser = { ...currentUser, ...patch };
    const users = getStoredUsers();
    const matchedIndexes = [];
    users.forEach((user, index) => {
      if (isSameUser(user, nextUser)) {
        matchedIndexes.push(index);
      }
    });

    if (matchedIndexes.length > 0) {
      matchedIndexes.forEach((index) => {
        users[index] = { ...users[index], ...nextUser };
      });
    } else {
      users.push(nextUser);
    }

    saveStoredUsers(users);
    setLoggedInUser(nextUser);

    return nextUser;
  }

  function normalizePasswordInput(value) {
    return String(value ?? '').trim();
  }

  function getPaymentPasswordFromUser(user) {
    if (!user || typeof user !== 'object') {
      return '';
    }

    const passwordCandidates = [
      user.paymentPassword,
      user.walletPayPassword,
      user.payPassword,
      user.walletPassword,
      user.payPwd
    ];

    for (const candidate of passwordCandidates) {
      const password = normalizePasswordInput(candidate);
      if (PAYMENT_PASSWORD_REGEX.test(password)) {
        return password;
      }
    }

    return '';
  }

  function isSameUser(source, target) {
    if (!source || !target) return false;

    const sourceId = String(source.id ?? '').trim();
    const targetId = String(target.id ?? '').trim();
    if (sourceId && targetId && sourceId === targetId) {
      return true;
    }

    const sourcePhone = String(source.phone ?? '').trim();
    const targetPhone = String(target.phone ?? '').trim();
    if (sourcePhone && targetPhone && sourcePhone === targetPhone) {
      return true;
    }

    return false;
  }

  function setPaymentPassword(rawPassword) {
    const nextPassword = normalizePasswordInput(rawPassword);
    if (!PAYMENT_PASSWORD_REGEX.test(nextPassword)) {
      return { ok: false, code: 'INVALID_FORMAT' };
    }

    const user = persistLoggedInUserPatch({
      paymentPassword: nextPassword,
      walletPayPassword: nextPassword
    });

    if (!user) {
      return { ok: false, code: 'NO_USER' };
    }

    return { ok: true, user };
  }

  function verifyPaymentPassword(rawPassword, user = getCurrentUserState()) {
    const inputPassword = normalizePasswordInput(rawPassword);
    const storedPassword = getPaymentPasswordFromUser(user);

    if (!PAYMENT_PASSWORD_REGEX.test(inputPassword) || !PAYMENT_PASSWORD_REGEX.test(storedPassword)) {
      return false;
    }

    return inputPassword === storedPassword;
  }

  function hasPaymentPassword(user = null) {
    const candidates = [];

    if (user) {
      candidates.push(user);
    }

    const latestUser = getCurrentUserState();
    if (latestUser) {
      candidates.push(latestUser);
    }

    const baseUser = latestUser || user;
    if (baseUser) {
      const users = getStoredUsers();
      users.forEach((item) => {
        if (isSameUser(item, baseUser)) {
          candidates.push(item);
        }
      });
    }

    return candidates.some((item) => PAYMENT_PASSWORD_REGEX.test(getPaymentPasswordFromUser(item)));
  }

  function maskPhoneNumber(phone) {
    const phoneText = String(phone || '');
    if (phoneText.length < 7) {
      return phoneText || '未绑定手机号';
    }

    return `${phoneText.slice(0, 3)}****${phoneText.slice(-4)}`;
  }

  function generateMockSmsCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  function normalizeReturnToTarget(target, defaultTarget = 'profile.html?tab=security') {
    const rawTarget = String(target || '').trim();
    if (!rawTarget) {
      return defaultTarget;
    }

    if (rawTarget.includes('\n') || rawTarget.includes('\r')) {
      return defaultTarget;
    }

    if (/^(javascript:|data:|vbscript:)/i.test(rawTarget)) {
      return defaultTarget;
    }

    try {
      const parsed = new URL(rawTarget, window.location.origin);
      if (parsed.origin !== window.location.origin) {
        return defaultTarget;
      }
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return defaultTarget;
      }
      return `${parsed.pathname}${parsed.search}${parsed.hash}` || defaultTarget;
    } catch (_) {
      return defaultTarget;
    }
  }

  function getReturnTo(defaultTarget = 'profile.html?tab=security') {
    const params = new URLSearchParams(window.location.search);
    return normalizeReturnToTarget(params.get('returnTo'), defaultTarget);
  }

  window.paymentPasswordMock = {
    PAYMENT_PASSWORD_REGEX,
    generateMockSmsCode,
    getCurrentUserState,
    getLoggedInUser,
    getReturnTo,
    hasPaymentPassword,
    maskPhoneNumber,
    normalizePasswordInput,
    persistLoggedInUserPatch,
    setPaymentPassword,
    verifyPaymentPassword
  };
})();
