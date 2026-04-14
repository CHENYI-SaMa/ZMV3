(function () {
  const USE_LOCAL_MOCK =
    typeof window !== "undefined" && typeof window.USE_LOCAL_MOCK === "boolean"
      ? window.USE_LOCAL_MOCK
      : true;
  const MOCK_API_DELAY =
    typeof window !== "undefined" && typeof window.MOCK_API_DELAY === "number"
      ? window.MOCK_API_DELAY
      : 120;

  window.USE_LOCAL_MOCK = USE_LOCAL_MOCK;
  window.MOCK_API_DELAY = MOCK_API_DELAY;

  const STORAGE_KEYS = {
    token: "zhimai_token",
    currentUser: "zhimai_user",
    users: "zhimai_users",
    orders: "zhimai_orders",
    products: "zhimai_products",
    categories: "zhimai_categories",
    wallets: "zhimai_wallets",
    boosters: "zhimai_boosters",
    games: "zhimai_games",
    adminUsers: "zhimai_admin_users",
    adminSession: "zhimai_admin",
    adminUser: "zhimai_admin_user",
    adminToken: "zhimai_admin_token",
    adminLoggedIn: "zhimai_admin_logged_in"
  };

  const STATUS_TEXT_MAP = {
    pending: "待支付",
    paying: "支付中",
    paid: "已支付",
    failed: "支付失败",
    processing: "处理中",
    completed: "已完成",
    cancelled: "已取消",
    refunded: "已退款"
  };

  const DEFAULT_ADMINS = [];

  const DEFAULT_GAMES = [
    { _id: "game_delta", code: "delta", name: "三角洲行动", icon: "fa-crosshairs", sort: 0 },
    { _id: "game_valorant", code: "valorant", name: "无畏契约", icon: "fa-shield-alt", sort: 1 },
    { _id: "game_honor", code: "honor", name: "王者荣耀", icon: "fa-crown", sort: 2 }
  ];

  const DEFAULT_CATEGORIES = [
    { _id: "cat_delta_boost", game: "delta", name: "代练服务", icon: "fa-crosshairs", sort: 0 },
    { _id: "cat_delta_account", game: "delta", name: "账号交易", icon: "fa-user-shield", sort: 1 },
    { _id: "cat_delta_play", game: "delta", name: "陪玩服务", icon: "fa-headset", sort: 2 }
  ];

  const DEFAULT_BOOSTERS = [
    {
      id: "booster_001",
      name: "凌夜",
      phone: "13800000001",
      level: 5,
      status: "online",
      games: ["三角洲行动"],
      rating: 4.9,
      orders: 128,
      completed: 124,
      income: 18600,
      createdAt: "2026-03-01",
      bio: "本地模拟打手"
    },
    {
      id: "booster_002",
      name: "星河",
      phone: "13800000002",
      level: 4,
      status: "busy",
      games: ["无畏契约", "三角洲行动"],
      rating: 4.8,
      orders: 96,
      completed: 92,
      income: 13200,
      createdAt: "2026-03-08",
      bio: "本地模拟打手"
    }
  ];

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, typeof ms === "number" ? ms : MOCK_API_DELAY));
  }

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function readStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : clone(fallback);
    } catch (error) {
      return clone(fallback);
    }
  }

  function writeStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function createId(prefix) {
    return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  }

  function createSecureRandomHex(bytes = 16) {
    if (typeof window !== "undefined" && window.crypto && typeof window.crypto.getRandomValues === "function") {
      const randomBytes = new Uint8Array(Math.max(1, Number(bytes) || 16));
      window.crypto.getRandomValues(randomBytes);
      return Array.from(randomBytes, (item) => item.toString(16).padStart(2, "0")).join("");
    }

    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  }

  function createPasswordSalt() {
    return createSecureRandomHex(16);
  }

  function derivePasswordHashLegacy(password, salt) {
    const text = `${String(password || "")}::${String(salt || "")}`;
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (`00000000${(hash >>> 0).toString(16)}`).slice(-8);
  }

  function isLegacyPasswordHash(hash) {
    return /^[0-9a-f]{8}$/i.test(String(hash || ""));
  }

  function derivePasswordHash(password, salt) {
    const text = `${String(password || "")}::${String(salt || "")}`;
    let h1 = 0xdeadbeef ^ text.length;
    let h2 = 0x41c6ce57 ^ text.length;
    let h3 = 0xc0decafe ^ text.length;
    let h4 = 0x9e3779b9 ^ text.length;

    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      h1 = Math.imul(h1 ^ code, 2654435761);
      h2 = Math.imul(h2 ^ code, 1597334677);
      h3 = Math.imul(h3 ^ code, 2246822507);
      h4 = Math.imul(h4 ^ code, 3266489909);
    }

    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h3 ^ (h3 >>> 13), 3266489909);
    h3 = Math.imul(h3 ^ (h3 >>> 16), 2246822507) ^ Math.imul(h4 ^ (h4 >>> 13), 3266489909);
    h4 = Math.imul(h4 ^ (h4 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return [h1, h2, h3, h4]
      .map((item) => (`00000000${(item >>> 0).toString(16)}`).slice(-8))
      .join("");
  }

  function createSessionToken(prefix = "token") {
    const normalizedPrefix = String(prefix || "token").replace(/[^a-z0-9_-]/gi, "").toLowerCase() || "token";

    if (typeof window !== "undefined" && window.crypto) {
      if (typeof window.crypto.randomUUID === "function") {
        return `${normalizedPrefix}_${window.crypto.randomUUID()}`;
      }
      if (typeof window.crypto.getRandomValues === "function") {
        const bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);
        const tokenBody = Array.from(bytes, (item) => item.toString(16).padStart(2, "0")).join("");
        return `${normalizedPrefix}_${tokenBody}`;
      }
    }

    return `${normalizedPrefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
  }

  function verifyPasswordRecord(user, password) {
    if (user && user.passwordHash && user.passwordSalt) {
      const currentHash = String(user.passwordHash || "");
      const normalizedSalt = String(user.passwordSalt || "");
      const nextHash = derivePasswordHash(password, normalizedSalt);
      if (nextHash === currentHash) return true;
      if (isLegacyPasswordHash(currentHash)) {
        return derivePasswordHashLegacy(password, normalizedSalt) === currentHash;
      }
      return false;
    }
    return String(user?.password || "") === String(password || "");
  }

  function upgradePasswordRecord(user, password) {
    if (!user) return user;
    const hasHashRecord = Boolean(user.passwordHash && user.passwordSalt);
    const needUpgrade = !hasHashRecord || isLegacyPasswordHash(user.passwordHash);
    if (!needUpgrade) return user;
    const passwordSalt = createPasswordSalt();
    return {
      ...user,
      password: "",
      passwordHash: derivePasswordHash(password, passwordSalt),
      passwordSalt
    };
  }

  function generateUniqueUserId(users) {
    const exists = new Set((users || []).map((item) => String(item.id || "")));
    let nextId = "";
    do {
      const randomDigits = Math.floor(Math.random() * 10000000).toString().padStart(7, "0");
      nextId = `ZM${randomDigits}`;
    } while (exists.has(nextId));
    return nextId;
  }

  function slugify(value) {
    const normalized = String(value || "item").trim().toLowerCase();
    const ascii = normalized
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (ascii) {
      return ascii;
    }

    const unicode = Array.from(normalized)
      .map((char) => char.charCodeAt(0).toString(16))
      .join("-");

    return unicode || "item";
  }

  function todayIso() {
    return new Date().toISOString();
  }

  function safeMessage(error, fallback) {
    if (error && typeof error.message === "string" && error.message.trim()) {
      return error.message.trim();
    }
    return fallback || "操作失败，请稍后重试";
  }

  async function success(data, message) {
    await wait();
    return { code: 200, data: clone(data), message: message || "ok" };
  }

  async function failure(message) {
    await wait();
    throw new Error(message || "操作失败，请稍后重试");
  }

  function getUsers() {
    return readStorage(STORAGE_KEYS.users, []);
  }

  function saveUsers(users) {
    return writeStorage(STORAGE_KEYS.users, users);
  }

  function sanitizeUser(user) {
    if (!user) return null;
    const { password, passwordHash, passwordSalt, ...safeUser } = user;
    const wallet = ensureWallet(user.id, Number(user.balance || 0));
    return {
      ...safeUser,
      balance: Number(wallet.balance || 0),
      nickname: user.nickname || user.username || user.phone || "用户",
      username: user.username || user.nickname || user.phone || "用户",
      avatar: user.avatar || "",
      paymentPassword: user.paymentPassword || ""
    };
  }

  function getCurrentUser() {
    const fromLocal = readStorage(STORAGE_KEYS.currentUser, null);
    if (fromLocal) return fromLocal;
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEYS.currentUser) || "null");
    } catch (error) {
      return null;
    }
  }

  function persistCurrentUser(user, token) {
    const safeUser = sanitizeUser(user);
    if (!safeUser) return null;

    const users = getUsers();
    const index = users.findIndex((item) => item.id === safeUser.id);
    if (index === -1) {
      users.unshift({
        ...safeUser,
        password: "",
        passwordHash: user.passwordHash || "",
        passwordSalt: user.passwordSalt || ""
      });
    } else {
      users[index] = { ...users[index], ...safeUser };
    }
    saveUsers(users);

    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(safeUser));
    sessionStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(safeUser));
    if (token) {
      sessionStorage.setItem(STORAGE_KEYS.token, token);
    }
    return safeUser;
  }

  function getWalletStore() {
    return readStorage(STORAGE_KEYS.wallets, {});
  }

  function saveWalletStore(wallets) {
    return writeStorage(STORAGE_KEYS.wallets, wallets);
  }

  function ensureWallet(userId, fallbackBalance) {
    const wallets = getWalletStore();
    if (!wallets[userId]) {
      wallets[userId] = {
        balance: Number(fallbackBalance || 0),
        transactions: []
      };
      saveWalletStore(wallets);
    }
    return wallets[userId];
  }

  function updateWalletBalance(userId, nextBalance, transaction) {
    const wallets = getWalletStore();
    const wallet = ensureWallet(userId, 0);
    wallet.balance = Number(Number(nextBalance || 0).toFixed(2));
    wallet.transactions = Array.isArray(wallet.transactions) ? wallet.transactions : [];
    if (transaction) {
      wallet.transactions.unshift(transaction);
    }
    wallets[userId] = wallet;
    saveWalletStore(wallets);

    const users = getUsers();
    const index = users.findIndex((item) => item.id === userId);
    if (index !== -1) {
      users[index].balance = wallet.balance;
      saveUsers(users);
    }

    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      persistCurrentUser({ ...currentUser, balance: wallet.balance });
    }

    return wallet;
  }

  function getAdmins() {
    const admins = readStorage(STORAGE_KEYS.adminUsers, []);
    if (admins.length > 0) return admins;
    return clone(DEFAULT_ADMINS);
  }

  function getCurrentAdmin() {
    return readStorage(STORAGE_KEYS.adminUser, null) || readStorage(STORAGE_KEYS.adminSession, null);
  }

  function persistAdminSession(admin) {
    const { password, passwordHash, passwordSalt, ...safePayload } = admin || {};
    const safeAdmin = {
      ...safePayload,
      name: safePayload.nickname || safePayload.name || safePayload.username,
      loginTime: todayIso()
    };
    localStorage.setItem(STORAGE_KEYS.adminLoggedIn, "true");
    localStorage.setItem(STORAGE_KEYS.adminSession, JSON.stringify(safeAdmin));
    localStorage.setItem(STORAGE_KEYS.adminUser, JSON.stringify(safeAdmin));
    localStorage.setItem(STORAGE_KEYS.adminToken, createSessionToken("admin_token"));
    return safeAdmin;
  }

  function clearAdminSession() {
    localStorage.removeItem(STORAGE_KEYS.adminLoggedIn);
    localStorage.removeItem(STORAGE_KEYS.adminSession);
    localStorage.removeItem(STORAGE_KEYS.adminUser);
    localStorage.removeItem(STORAGE_KEYS.adminToken);
  }

  function getGames() {
    const games = readStorage(STORAGE_KEYS.games, []);
    if (games.length > 0) return games;
    return writeStorage(STORAGE_KEYS.games, clone(DEFAULT_GAMES));
  }

  function getProductsRaw() {
    return readStorage(STORAGE_KEYS.products, []);
  }

  function saveProductsRaw(products) {
    return writeStorage(STORAGE_KEYS.products, products);
  }

  function ensureCategories() {
    const saved = readStorage(STORAGE_KEYS.categories, []);
    if (saved.length > 0) return saved;

    const products = getProductsRaw();
    if (products.length === 0) {
      return writeStorage(STORAGE_KEYS.categories, clone(DEFAULT_CATEGORIES));
    }

    const categories = [];
    const seen = new Set();
    products.forEach((product) => {
      const game = product.game || "delta";
      const name = product.category || "默认分类";
      const key = `${game}:${name}`;
      if (seen.has(key)) return;
      seen.add(key);
      categories.push({
        _id: `cat_${slugify(game)}_${slugify(name)}`,
        game,
        name,
        icon: "fa-folder",
        sort: categories.length
      });
    });

    return writeStorage(STORAGE_KEYS.categories, categories);
  }

  function saveCategories(categories) {
    return writeStorage(STORAGE_KEYS.categories, categories);
  }

  function findCategoryById(categoryId) {
    return ensureCategories().find((item) => String(item._id || item.id) === String(categoryId));
  }

  function ensureCategoryForProduct(game, categoryName) {
    const categories = ensureCategories();
    const hit = categories.find((item) => item.game === game && item.name === categoryName);
    if (hit) return hit;

    const created = {
      _id: `cat_${slugify(game)}_${slugify(categoryName)}`,
      game: game || "delta",
      name: categoryName || "默认分类",
      icon: "fa-folder",
      sort: categories.length
    };
    categories.push(created);
    saveCategories(categories);
    return created;
  }

  function resolveProductCategoryId(product) {
    if (findCategoryById(product.category)) {
      return String(product.category);
    }
    return ensureCategoryForProduct(product.game || "delta", product.category || "默认分类")._id;
  }

  function nextProductId() {
    const ids = getProductsRaw().map((item) => Number(item.id)).filter((item) => Number.isFinite(item));
    return (ids.length ? Math.max(...ids) : 10000) + 1;
  }

  function normalizeProductForApi(product) {
    return {
      ...product,
      _id: String(product._id || product.id || createId("prod")),
      id: product.id || product._id || createId("prod"),
      category: resolveProductCategoryId(product),
      price: Number(product.price || 0),
      cost: Number(product.cost || 0),
      profit: Number(product.profit || 0),
      stock: Number(product.stock || 0),
      sales: Number(product.sales || 0),
      sort: Number(product.sort || 0),
      status: product.status === 1 || product.status === "active" ? "active" : "inactive",
      createdAt: product.createdAt || todayIso().split("T")[0]
    };
  }

  function normalizeProductForStorage(data, existing) {
    const category = findCategoryById(data.category);
    const price = Number(data.price != null ? data.price : existing?.price || 0);
    const cost = Number(data.cost != null ? data.cost : existing?.cost || 0);
    const rawStatus = data.status != null ? data.status : existing?.status;
    return {
      ...(existing || {}),
      _id: existing?._id || data.productId || data._id || createId("prod"),
      id: existing?.id || data.id || nextProductId(),
      name: data.name != null ? data.name : existing?.name || "未命名商品",
      game: data.game != null ? data.game : existing?.game || category?.game || "delta",
      gameName: data.gameName != null ? data.gameName : existing?.gameName || "",
      category: category ? category.name : data.categoryName || existing?.category || data.category || "默认分类",
      price: price,
      cost: cost,
      profit: Math.max(0, price - cost),
      priceUnit: data.priceUnit != null ? data.priceUnit : existing?.priceUnit || "",
      stock: Number(data.stock != null ? data.stock : existing?.stock || 0),
      sales: Number(data.sales != null ? data.sales : existing?.sales || 0),
      sort: Number(data.sort != null ? data.sort : existing?.sort || 0),
      desc: data.desc != null ? data.desc : existing?.desc || "",
      detail: data.detail != null ? data.detail : existing?.detail || "",
      image: data.image != null ? data.image : existing?.image || "",
      thumbnail: data.thumbnail != null ? data.thumbnail : existing?.thumbnail || data.image || "",
      status: rawStatus === "active" || rawStatus === 1 || rawStatus === "1" ? 1 : 0,
      showStock: typeof (data.showStock != null ? data.showStock : existing?.showStock) === "boolean"
        ? (data.showStock != null ? data.showStock : existing?.showStock)
        : true,
      createdAt: existing?.createdAt || data.createdAt || todayIso().split("T")[0]
    };
  }

  function getOrdersRaw() {
    return readStorage(STORAGE_KEYS.orders, []);
  }

  function saveOrdersRaw(orders) {
    return writeStorage(STORAGE_KEYS.orders, orders);
  }

  function normalizeOrder(order) {
    const user = getUsers().find((item) => item.id === order.userId);
    return {
      ...order,
      _id: order._id || order.id,
      id: order.id || order._id || createId("ZM"),
      orderNo: order.orderNo || order.id || order._id || createId("ZM"),
      username: order.username || user?.username || user?.nickname || "--",
      userPhone: order.userPhone || order.contactPhone || user?.phone || "--",
      price: Number(order.price || 0),
      subtotal: Number(order.subtotal || order.totalAmount || 0),
      discount: Number(order.discount || 0),
      totalAmount: Number(order.totalAmount || order.price || 0),
      quantity: Number(order.quantity || 1),
      status: order.status || "pending",
      statusText: order.statusText || STATUS_TEXT_MAP[order.status] || "待处理",
      paymentMethod: order.paymentMethod || "wechat",
      createdAt: order.createdAt || todayIso(),
      updatedAt: order.updatedAt || order.createdAt || todayIso()
    };
  }

  function patchOrder(orderId, patch) {
    const orders = getOrdersRaw();
    const index = orders.findIndex((item) => String(item.id || item._id) === String(orderId));
    if (index === -1) {
      throw new Error("订单不存在");
    }
    const nextOrder = {
      ...orders[index],
      ...patch,
      statusText: patch.statusText || STATUS_TEXT_MAP[patch.status || orders[index].status] || orders[index].statusText,
      updatedAt: todayIso()
    };
    orders[index] = nextOrder;
    saveOrdersRaw(orders);
    return normalizeOrder(nextOrder);
  }

  function applyPaidProductSideEffects(order) {
    const products = getProductsRaw();
    const index = products.findIndex((item) => String(item.id) === String(order.productId) || String(item._id) === String(order.productId));
    if (index === -1) return;
    products[index] = {
      ...products[index],
      sales: Number(products[index].sales || 0) + Number(order.quantity || 1),
      stock: Math.max(0, Number(products[index].stock || 0) - Number(order.quantity || 1))
    };
    saveProductsRaw(products);
  }

  function getBoostersRaw() {
    const boosters = readStorage(STORAGE_KEYS.boosters, []);
    if (boosters.length > 0) return boosters;
    return writeStorage(STORAGE_KEYS.boosters, clone(DEFAULT_BOOSTERS));
  }

  function saveBoostersRaw(boosters) {
    return writeStorage(STORAGE_KEYS.boosters, boosters);
  }

  function buildDashboardStats() {
    const orders = getOrdersRaw().map(normalizeOrder);
    const today = todayIso().split("T")[0];
    const todayOrders = orders.filter((order) => String(order.createdAt || "").startsWith(today));
    return {
      today: {
        revenue: todayOrders
          .filter((order) => ["paid", "processing", "completed"].includes(order.status))
          .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
        orders: todayOrders.length
      },
      users: {
        total: getUsers().length
      },
      products: {
        total: getProductsRaw().length
      }
    };
  }

  const MockService = {
    async mockGetWallet(userId) {
      const wallet = ensureWallet(userId, 0);
      return success({ userId, balance: Number(wallet.balance || 0), transactions: wallet.transactions || [] });
    },
    async mockGetUserProfile(userId) {
      const user = getUsers().find((item) => item.id === userId);
      if (!user) return failure("用户不存在");
      return success(sanitizeUser(user));
    },
    async mockCreateOrder(orderData) {
      const order = normalizeOrder({
        id: "ZM" + Date.now().toString(36).toUpperCase(),
        ...orderData,
        status: "pending",
        statusText: STATUS_TEXT_MAP.pending,
        createdAt: todayIso(),
        updatedAt: todayIso()
      });
      saveOrdersRaw([order, ...getOrdersRaw()]);
      return success(order, "订单已创建");
    },
    async mockGetOrderById(orderId) {
      const order = getOrdersRaw().find((item) => String(item.id || item._id) === String(orderId));
      if (!order) return failure("订单不存在");
      return success(normalizeOrder(order));
    },
    async mockPayOrder(orderId, paymentMethod) {
      const current = getOrdersRaw().find((item) => String(item.id || item._id) === String(orderId));
      if (!current) return failure("订单不存在");
      patchOrder(orderId, { status: "paying", paymentMethod: paymentMethod || current.paymentMethod || "wechat" });
      await wait(MOCK_API_DELAY + 80);

      const order = normalizeOrder(getOrdersRaw().find((item) => String(item.id || item._id) === String(orderId)));
      if (order.paymentMethod === "balance") {
        const wallet = ensureWallet(order.userId, 0);
        if (Number(wallet.balance || 0) < Number(order.totalAmount || 0)) {
          patchOrder(orderId, { status: "failed" });
          throw new Error("余额不足，请更换支付方式");
        }
        updateWalletBalance(order.userId, Number(wallet.balance || 0) - Number(order.totalAmount || 0), {
          id: createId("wallet_txn"),
          type: "payment",
          amount: Number(order.totalAmount || 0),
          orderId,
          createdAt: todayIso()
        });
      }

      const paidOrder = patchOrder(orderId, { status: "paid", paidAt: todayIso() });
      applyPaidProductSideEffects(paidOrder);
      return success(paidOrder, "支付成功");
    }
  };

  async function dispatch(service, action, data) {
    if (!USE_LOCAL_MOCK) {
      return failure("当前环境未启用本地模拟服务");
    }

    try {
      if (service === "user" && action === "register") {
        const users = getUsers();
        if (users.some((item) => item.phone === String(data.phone || "").trim())) {
          return failure("该手机号已注册");
        }
        const passwordSalt = createPasswordSalt();
        const created = {
          id: generateUniqueUserId(users),
          phone: String(data.phone || "").trim(),
          password: "",
          passwordHash: derivePasswordHash(String(data.password || ""), passwordSalt),
          passwordSalt,
          username: String(data.username || "用户"),
          nickname: String(data.username || "用户"),
          avatar: data.avatar || "",
          balance: 0,
          createdAt: todayIso()
        };
        saveUsers([created, ...users]);
        ensureWallet(created.id, created.balance);
        return success({ user: sanitizeUser(created) }, "注册成功");
      }

      if (service === "user" && action === "login") {
        const users = getUsers();
        const user = users.find((item) => item.phone === String(data.phone || "").trim());
        if (!user || !verifyPasswordRecord(user, String(data.password || ""))) {
          return failure("手机号或密码错误");
        }
        const upgradedUser = upgradePasswordRecord(user, String(data.password || ""));
        if (upgradedUser !== user) {
          const index = users.findIndex((item) => String(item.id) === String(user.id));
          if (index >= 0) {
            users[index] = upgradedUser;
            saveUsers(users);
          }
        }
        const token = createSessionToken("token");
        const safeUser = persistCurrentUser(upgradedUser, token);
        return success({ token, user: safeUser }, "登录成功");
      }

      if (service === "product" && action === "getGames") {
        return success(getGames());
      }

      if (service === "product" && action === "uploadImage") {
        const fileContent = String(data.fileContent || "");
        return success({
          url: fileContent.startsWith("data:") ? fileContent : `data:image/*;base64,${fileContent}`,
          fileName: data.fileName || createId("image")
        }, "上传成功");
      }

      if (service === "product" && action === "getCategories") {
        return success(ensureCategories());
      }

      if (service === "product" && action === "createCategory") {
        const categories = ensureCategories();
        const created = {
          _id: createId("cat"),
          name: String(data.name || "未命名分类"),
          icon: data.icon || "fa-folder",
          sort: Number(data.sort || categories.length),
          description: data.description || "",
          game: data.game || "delta",
          parentId: data.parentId || null
        };
        categories.push(created);
        saveCategories(categories);
        return success(created, "分类已创建");
      }

      if (service === "product" && action === "updateCategory") {
        const categories = ensureCategories();
        const index = categories.findIndex((item) => String(item._id) === String(data.categoryId));
        if (index === -1) return failure("分类不存在");
        categories[index] = { ...categories[index], ...data, _id: categories[index]._id };
        saveCategories(categories);
        return success(categories[index], "分类已更新");
      }

      if (service === "product" && action === "deleteCategory") {
        const products = getProductsRaw();
        const target = findCategoryById(data.categoryId);
        if (!target) return failure("分类不存在");
        if (products.some((item) => item.game === target.game && item.category === target.name)) {
          return failure("该分类下仍有商品，请先处理商品");
        }
        saveCategories(ensureCategories().filter((item) => String(item._id) !== String(data.categoryId)));
        return success(true, "分类已删除");
      }

      if (service === "product" && action === "list") {
        let list = getProductsRaw().map(normalizeProductForApi);
        if (data.category) {
          list = list.filter((item) => String(item.category) === String(data.category));
        }
        const page = Number(data.page || 1);
        const pageSize = Number(data.pageSize || list.length || 10);
        const start = (page - 1) * pageSize;
        return success({
          list: list.slice(start, start + pageSize),
          total: list.length,
          page,
          pageSize
        });
      }

      if (service === "product" && action === "get") {
        const product = getProductsRaw().find((item) => String(item._id || item.id) === String(data.productId));
        if (!product) return failure("商品不存在");
        return success(normalizeProductForApi(product));
      }

      if (service === "product" && action === "create") {
        const created = normalizeProductForStorage(data);
        saveProductsRaw([created, ...getProductsRaw()]);
        return success(normalizeProductForApi(created), "商品已创建");
      }

      if (service === "product" && action === "update") {
        const products = getProductsRaw();
        const index = products.findIndex((item) => String(item._id || item.id) === String(data.productId));
        if (index === -1) return failure("商品不存在");
        products[index] = normalizeProductForStorage(data, products[index]);
        saveProductsRaw(products);
        return success(normalizeProductForApi(products[index]), "商品已更新");
      }

      if (service === "product" && action === "delete") {
        saveProductsRaw(getProductsRaw().filter((item) => String(item._id || item.id) !== String(data.productId)));
        return success(true, "商品已删除");
      }

      if (service === "order" && action === "adminList") {
        let list = getOrdersRaw().map(normalizeOrder).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        if (data.status && data.status !== "all") {
          list = list.filter((item) => item.status === data.status);
        }
        const page = Number(data.page || 1);
        const pageSize = Number(data.pageSize || list.length || 10);
        const start = (page - 1) * pageSize;
        return success({
          list: list.slice(start, start + pageSize),
          total: list.length,
          page,
          pageSize
        });
      }

      if (service === "order" && action === "adminUpdateStatus") {
        return success(patchOrder(data.orderId, { status: data.status }), "订单状态已更新");
      }

      if (service === "order" && action === "adminCancel") {
        return success(patchOrder(data.orderId, { status: "cancelled", cancelReason: data.reason || "" }), "订单已取消");
      }

      if (service === "order" && action === "create") {
        return MockService.mockCreateOrder(data);
      }

      if (service === "order" && action === "get") {
        return MockService.mockGetOrderById(data.orderId);
      }

      if (service === "order" && action === "pay") {
        return MockService.mockPayOrder(data.orderId, data.paymentMethod);
      }

      if (service === "admin" && action === "login") {
        const admins = getAdmins();
        if (!Array.isArray(admins) || admins.length === 0) {
          return failure("后台账号未初始化，请先在服务端创建管理员账号");
        }
        const plainPassword = String(data.password || "");
        const admin = admins.find((item) =>
          item.username === String(data.username || "").trim() &&
          verifyPasswordRecord(item, plainPassword)
        );
        if (!admin) return failure("用户名或密码错误");
        const upgradedAdmin = upgradePasswordRecord(admin, plainPassword);
        if (upgradedAdmin !== admin) {
          const index = admins.findIndex((item) => String(item.id) === String(admin.id));
          if (index >= 0) {
            admins[index] = upgradedAdmin;
            writeStorage(STORAGE_KEYS.adminUsers, admins);
          }
        }
        const safeAdmin = persistAdminSession(upgradedAdmin);
        return success({ token: localStorage.getItem(STORAGE_KEYS.adminToken), user: safeAdmin }, "登录成功");
      }

      if (service === "admin" && action === "getDashboardStats") {
        return success(buildDashboardStats());
      }

      if (service === "admin" && action === "listBoosters") {
        const list = getBoostersRaw();
        return success({ list, total: list.length });
      }

      if (service === "admin" && action === "createBooster") {
        const boosters = getBoostersRaw();
        const created = {
          id: createId("booster"),
          name: data.name || "未命名打手",
          phone: data.phone || "",
          level: Number(data.level || 1),
          status: data.status || "offline",
          games: Array.isArray(data.games) ? data.games : String(data.games || "").split(/[、,]/).map((item) => item.trim()).filter(Boolean),
          bio: data.bio || "",
          rating: Number(data.rating || 4.8),
          orders: Number(data.orders || 0),
          completed: Number(data.completed || 0),
          income: Number(data.income || 0),
          createdAt: todayIso().split("T")[0]
        };
        boosters.unshift(created);
        saveBoostersRaw(boosters);
        return success(created, "打手已创建");
      }

      if (service === "admin" && action === "updateBooster") {
        const boosters = getBoostersRaw();
        const index = boosters.findIndex((item) => item.id === data.boosterId);
        if (index === -1) return failure("打手不存在");
        boosters[index] = {
          ...boosters[index],
          ...data,
          id: boosters[index].id,
          games: Array.isArray(data.games)
            ? data.games
            : data.games != null
              ? String(data.games).split(/[、,]/).map((item) => item.trim()).filter(Boolean)
              : boosters[index].games
        };
        saveBoostersRaw(boosters);
        return success(boosters[index], "打手已更新");
      }

      if (service === "admin" && action === "deleteBooster") {
        saveBoostersRaw(getBoostersRaw().filter((item) => item.id !== data.boosterId));
        return success(true, "打手已删除");
      }

      return failure("本地模拟接口未实现");
    } catch (error) {
      throw new Error(safeMessage(error, "本地模拟请求失败"));
    }
  }

  async function call(service, action, data) {
    return dispatch(service, action, data || {});
  }

  async function callFunction(name, payload) {
    return dispatch(name, payload?.action || "", payload?.data || {});
  }

  window.MockService = MockService;
  window.CloudBaseAPI = {
    callFunction,
    call,
    User: {
      login(phone, password) {
        return call("user", "login", { phone, password });
      },
      register(phone, password, username, avatar) {
        return call("user", "register", { phone, password, username, avatar });
      }
    },
    Order: {
      create(data) {
        return call("order", "create", data);
      },
      get(orderId) {
        return call("order", "get", { orderId });
      },
      pay(orderId, paymentMethod) {
        return call("order", "pay", { orderId, paymentMethod });
      },
      adminList(params) {
        return call("order", "adminList", params);
      },
      adminUpdateStatus(orderId, status) {
        return call("order", "adminUpdateStatus", { orderId, status });
      },
      adminCancel(orderId, reason) {
        return call("order", "adminCancel", { orderId, reason });
      }
    },
    Product: {
      list(category, page, pageSize) {
        return call("product", "list", { category, page, pageSize });
      },
      get(productId) {
        return call("product", "get", { productId });
      },
      create(data) {
        return call("product", "create", data);
      },
      update(data) {
        return call("product", "update", data);
      },
      delete(productId) {
        return call("product", "delete", { productId });
      },
      getCategories() {
        return call("product", "getCategories", {});
      },
      createCategory(data) {
        return call("product", "createCategory", data);
      },
      updateCategory(data) {
        return call("product", "updateCategory", data);
      },
      deleteCategory(data) {
        return call("product", "deleteCategory", typeof data === "object" ? data : { categoryId: data });
      }
    },
    Admin: {
      isLoggedIn() {
        return localStorage.getItem(STORAGE_KEYS.adminLoggedIn) === "true";
      },
      getCurrentAdmin() {
        return getCurrentAdmin();
      },
      logout() {
        clearAdminSession();
      },
      login(username, password) {
        return call("admin", "login", { username, password });
      },
      getDashboardStats() {
        return call("admin", "getDashboardStats", {});
      },
      listBoosters() {
        return call("admin", "listBoosters", {});
      },
      createBooster(data) {
        return call("admin", "createBooster", data);
      },
      updateBooster(data) {
        return call("admin", "updateBooster", data);
      },
      deleteBooster(boosterId) {
        return call("admin", "deleteBooster", { boosterId });
      }
    }
  };
})();
