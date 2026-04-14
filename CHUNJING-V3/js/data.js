/**
 * 文件名: js/data.js
 * 文件说明: 织麦电竞 - 统一数据管理系统
 * 功能描述: 
 *   - 前后端数据共享，使用腾讯云 CloudBase 数据库存储
 *   - 提供 DataManager 类管理商品、订单、优惠券、用户、通知等数据
 *   - 包含默认数据初始化、数据增删改查方法
 *   - 前后台数据同步，后台修改后前端实时生效
 * Demo-only note: this project has no backend; payment password state is kept in
 *   localStorage for local development only. Move to a backend secrets flow before production.
 */

// ==================== 腾讯云 CloudBase 配置 ====================
const CLOUDBASE_CONFIG = {
  env: 'zmdj', // 环境ID，可修改
  // 如需匿名登录，后续可在此配置
};

const USE_LOCAL_MOCK =
  typeof window !== 'undefined' && typeof window.USE_LOCAL_MOCK === 'boolean'
    ? window.USE_LOCAL_MOCK
    : true;

if (typeof window !== 'undefined') {
  window.USE_LOCAL_MOCK = USE_LOCAL_MOCK;
}

const LOCAL_MOCK_BASELINE_VERSION = 'stable-local-mock-2026-03-31';
const TEST_CONSOLE_ACCOUNT_PHONE = '13800138000';
const TEST_CONSOLE_ACCOUNT_USERNAME = '测试用户';
const TEST_CONSOLE_DEFAULT_WALLET_BALANCE = 0;
const TEST_CONSOLE_DEFAULT_PAYMENT_PASSWORD = '';

function createSecureRandomHex(bytes = 16) {
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.getRandomValues === 'function') {
    const randomBytes = new Uint8Array(Math.max(1, Number(bytes) || 16));
    window.crypto.getRandomValues(randomBytes);
    return Array.from(randomBytes, (item) => item.toString(16).padStart(2, '0')).join('');
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

function createPasswordSalt() {
  return createSecureRandomHex(16);
}

function derivePasswordHash(password, salt) {
  const text = `${String(password || '')}::${String(salt || '')}`;
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
    .join('');
}

// ==================== 默认商品数据 ====================
const DEFAULT_PRODUCTS = [
  {
    id: 10001,
    name: '三角洲行动-10M',
    category: '代练服务',
    price: 60.00,
    priceUnit: '',
    stock: 999,
    sales: 129,
    status: 1,
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=60&h=60&fit=crop',
    desc: '专业代肝哈弗币，安全高效，支持各种支付方式。10M哈弗币快速到账，人工操作不封号。',
    detail: '服务内容：\n1. 哈弗币代肝 10M\n2. 预计完成时间：1-2天\n3. 支持账号密码或扫码登录\n4. 完成后截图确认\n5. 7天售后保障',
    game: 'delta',
    gameName: '三角洲行动',
    createdAt: '2026-03-20',
    showStock: true
  },
  {
    id: 10002,
    name: '三角洲行动-20M',
    category: '代练服务',
    price: 120.00,
    priceUnit: '',
    stock: 999,
    sales: 56,
    status: 1,
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=60&h=60&fit=crop',
    desc: '专业代肝哈弗币，安全高效，支持各种支付方式。20M哈弗币快速到账，人工操作不封号。',
    detail: '服务内容：\n1. 哈弗币代肝 20M\n2. 预计完成时间：2-3天\n3. 支持账号密码或扫码登录\n4. 完成后截图确认\n5. 7天售后保障',
    game: 'delta',
    gameName: '三角洲行动',
    createdAt: '2026-03-18',
    showStock: true
  },
  {
    id: 10003,
    name: '满级账号 - 全角色解锁+稀有皮肤',
    category: '账号交易',
    price: 1288.00,
    priceUnit: '',
    stock: 1,
    sales: 3,
    status: 0,
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=300&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=60&h=60&fit=crop',
    desc: '满级账号出售，全角色解锁，附带多款稀有皮肤，即买即玩。',
    detail: '账号详情：\n1. 满级账号\n2. 全角色解锁\n3. 稀有皮肤：龙魂、暗影等\n4. 绑定手机可换绑\n5. 提供永久售后',
    game: 'delta',
    gameName: '三角洲行动',
    createdAt: '2026-03-15',
    showStock: false
  },
  {
    id: 10004,
    name: '日常任务代做 - 每日签到+活动',
    category: '代练服务',
    price: 15.00,
    priceUnit: '/天',
    stock: 999,
    sales: 256,
    status: 1,
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b2b0a?w=400&h=300&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1552820728-8b83bb6b2b0a?w=60&h=60&fit=crop',
    desc: '每日签到+活动任务代做，包月更优惠，解放你的时间。',
    detail: '服务内容：\n1. 每日签到\n2. 日常活动任务\n3. 周常任务\n4. 包月送周卡一张\n5. 每日截图汇报',
    game: 'delta',
    gameName: '三角洲行动',
    createdAt: '2026-03-10',
    showStock: true
  },
  {
    id: 10005,
    name: '专业陪玩 - 1小时（语音开黑）',
    category: '陪玩服务',
    price: 50.00,
    priceUnit: '/小时',
    stock: 50,
    sales: 89,
    status: 1,
    image: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=400&h=300&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=60&h=60&fit=crop',
    desc: '专业陪玩语音开黑，技术过硬，服务周到，带你上分。',
    detail: '服务内容：\n1. 语音开黑陪玩\n2. 1小时起订\n3. 技术型/娱乐型可选\n4. 支持指定英雄\n5. 不满意可更换陪玩',
    game: 'delta',
    gameName: '三角洲行动',
    createdAt: '2026-03-05',
    showStock: true
  },
  {
    id: 10006,
    name: '王者荣耀 - 王者段位代打',
    category: '代练服务',
    price: 288.00,
    priceUnit: '',
    stock: 20,
    sales: 45,
    status: 1,
    image: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=400&h=300&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=60&h=60&fit=crop',
    desc: '王者荣耀王者段位代打，专业车队，胜率保证。',
    detail: '服务内容：\n1. 星耀到王者段位\n2. 胜率80%以上\n3. 指定英雄可协商\n4. 支持分付',
    game: 'honor',
    gameName: '王者荣耀',
    createdAt: '2026-03-12',
    showStock: true
  },
  {
    id: 10007,
    name: '英雄联盟 - 排位上分',
    category: '代练服务',
    price: 188.00,
    priceUnit: '',
    stock: 30,
    sales: 32,
    status: 1,
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=60&h=60&fit=crop',
    desc: '英雄联盟排位上分，钻石大师段位代打。',
    detail: '服务内容：\n1. 黄金到钻石段位\n2. KDA保证\n3. 指定位置可协商\n4. 直播代打可选',
    game: 'lol',
    gameName: '英雄联盟',
    createdAt: '2026-03-08',
    showStock: true
  },
  {
    id: 10008,
    name: '和平精英 - 战神段位代打',
    category: '代练服务',
    price: 588.00,
    priceUnit: '',
    stock: 10,
    sales: 18,
    status: 1,
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=60&h=60&fit=crop',
    desc: '和平精英战神段位代打，无敌战神不是梦。',
    detail: '服务内容：\n1. 王牌到战神段位\n2. KD保证3.0以上\n3. 送专属称号\n4. 全程直播',
    game: 'gamebox',
    gameName: '和平精英',
    createdAt: '2026-03-01',
    showStock: true
  },
  // 无畏契约商品
  {
    id: 10009,
    name: '无畏契约 - 定位赛代打',
    category: '代练服务',
    price: 88.00,
    priceUnit: '',
    stock: 50,
    sales: 67,
    status: 1,
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=60&h=60&fit=crop',
    desc: '无畏契约定位赛代打，专业枪男带你定高段位。',
    detail: '服务内容：\n1. 定位赛5场全打\n2. 目标段位：黄金-铂金\n3. 胜率80%以上\n4. 可指定特工\n5. 提供战绩截图',
    game: 'valorant',
    gameName: '无畏契约',
    createdAt: '2026-03-25',
    showStock: true
  },
  {
    id: 10010,
    name: '无畏契约 - 段位上分（黄金-钻石）',
    category: '代练服务',
    price: 168.00,
    priceUnit: '',
    stock: 30,
    sales: 42,
    status: 1,
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=60&h=60&fit=crop',
    desc: '无畏契约黄金到钻石段位代打，快速上分不掉队。',
    detail: '服务内容：\n1. 黄金到钻石段位\n2. KDA保证1.5以上\n3. 可指定位置\n4. 支持直播观看\n5. 分段付款可选',
    game: 'valorant',
    gameName: '无畏契约',
    createdAt: '2026-03-24',
    showStock: true
  },
  {
    id: 10011,
    name: '无畏契约 - 高段位代打（钻石-神话）',
    category: '代练服务',
    price: 388.00,
    priceUnit: '',
    stock: 15,
    sales: 23,
    status: 1,
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=300&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=60&h=60&fit=crop',
    desc: '无畏契约钻石到神话段位，高端局专业打手。',
    detail: '服务内容：\n1. 钻石到神话段位\n2. 顶级枪男操作\n3. 可指定特工阵容\n4. 全程可直播\n5. 失败全额退款',
    game: 'valorant',
    gameName: '无畏契约',
    createdAt: '2026-03-22',
    showStock: true
  },
  {
    id: 10012,
    name: '无畏契约 - 陪玩语音开黑',
    category: '陪玩服务',
    price: 45.00,
    priceUnit: '/小时',
    stock: 20,
    sales: 89,
    status: 1,
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b2b0a?w=400&h=300&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1552820728-8b83bb6b2b0a?w=60&h=60&fit=crop',
    desc: '无畏契约专业陪玩，温柔妹妹/技术哥哥带你飞。',
    detail: '服务内容：\n1. 语音开黑陪玩\n2. 1小时起订\n3. 技术型/娱乐型可选\n4. 可指定特工教学\n5. 不满意可更换',
    game: 'valorant',
    gameName: '无畏契约',
    createdAt: '2026-03-20',
    showStock: true
  },
  {
    id: 10013,
    name: '无畏契约 - 通行证代肝',
    category: '代练服务',
    price: 128.00,
    priceUnit: '',
    stock: 40,
    sales: 56,
    status: 1,
    image: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=400&h=300&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=60&h=60&fit=crop',
    desc: '无畏契约战斗通行证代肝，满级奖励全拿。',
    detail: '服务内容：\n1. 通行证等级代肝\n2. 满级奖励全拿\n3. 包含周任务/日常\n4. 每日进度汇报\n5. 安全不封号',
    game: 'valorant',
    gameName: '无畏契约',
    createdAt: '2026-03-18',
    showStock: true
  }
];

// ==================== 默认优惠券数据 ====================
const DEFAULT_COUPONS = [
  {
    id: 'CP001',
    name: '新用户专享券',
    type: 'fixed',
    value: 10,
    minOrder: 50,
    startDate: '2026-03-01',
    endDate: '2026-12-31',
    status: 1,
    total: 9999,
    used: 0,
    desc: '新用户注册即送，满50元可用'
  },
  {
    id: 'CP002',
    name: '满减优惠券',
    type: 'fixed',
    value: 50,
    minOrder: 300,
    startDate: '2026-03-01',
    endDate: '2026-06-30',
    status: 1,
    total: 500,
    used: 0,
    desc: '满300减50，限时优惠'
  },
  {
    id: 'CP003',
    name: '8折优惠券',
    type: 'percent',
    value: 20,
    minOrder: 200,
    startDate: '2026-03-01',
    endDate: '2026-05-31',
    status: 1,
    total: 200,
    used: 0,
    desc: '满200享8折优惠'
  }
];

// ==================== 数据管理类 ====================
class DataManager {
  constructor() {
    this.useCloudBase = false; // 是否使用云数据库
    this.db = null; // 云数据库实例
    this.initData();
  }

  readLocalJSON(key, fallbackValue) {
    try {
      const rawValue = localStorage.getItem(key);
      return rawValue ? JSON.parse(rawValue) : fallbackValue;
    } catch (error) {
      localStorage.removeItem(key);
      return fallbackValue;
    }
  }

  ensureLocalValue(key, fallbackValue, validator) {
    const currentValue = this.readLocalJSON(key, null);
    if (!validator(currentValue)) {
      localStorage.setItem(key, JSON.stringify(fallbackValue));
    }
  }

  applyLocalMockRollbackBaseline() {
    const versionKey = 'zhimai_local_mock_version';
    if (localStorage.getItem(versionKey) === LOCAL_MOCK_BASELINE_VERSION) {
      return;
    }

    [
      'zhimai_user',
      'zhimai_token',
      'zhimai_users',
      'zhimai_products',
      'zhimai_coupons',
      'zhimai_orders',
      'zhimai_user_coupons',
      'zhimai_addresses',
      'zhimai_notifications',
      'zhimai_stats',
      'zhimai_wallets'
    ].forEach(key => localStorage.removeItem(key));

    sessionStorage.removeItem('zhimai_user');
    sessionStorage.removeItem('zhimai_token');
    localStorage.setItem(versionKey, LOCAL_MOCK_BASELINE_VERSION);
  }

  // 初始化所有数据
  initData() {
    if (USE_LOCAL_MOCK) {
      this.useCloudBase = false;
      this.initLocalStorage();
      console.log('[DataManager] Local mock mode enabled, skipping CloudBase bootstrap');
      return;
    }

    // 检查是否支持 CloudBase（需要引入 SDK）
    if (typeof cloudbase !== 'undefined') {
      this.initCloudBase();
    } else {
      this.initLocalStorage();
    }
  }

  // 初始化本地存储（备用方案）
  initLocalStorage() {
    this.applyLocalMockRollbackBaseline();

    // 商品数据
    this.ensureLocalValue('zhimai_products', DEFAULT_PRODUCTS, Array.isArray);
    // 优惠券数据
    this.ensureLocalValue('zhimai_coupons', DEFAULT_COUPONS, Array.isArray);
    // 订单数据
    this.ensureLocalValue('zhimai_orders', [], Array.isArray);
    // 用户优惠券
    this.ensureLocalValue('zhimai_user_coupons', [], Array.isArray);
    // 用户地址
    this.ensureLocalValue('zhimai_addresses', [], Array.isArray);
    // 通知消息
    this.ensureLocalValue('zhimai_notifications', [], Array.isArray);
    // 用户列表
    this.ensureLocalValue('zhimai_users', [], Array.isArray);
    // 钱包数据
    this.ensureLocalValue('zhimai_wallets', {}, value => Boolean(value) && typeof value === 'object' && !Array.isArray(value));
    // 统计数据
    this.ensureLocalValue('zhimai_stats', {
      totalOrders: 0,
      totalSales: 0,
      totalUsers: 0,
      todayOrders: 0,
      todaySales: 0
    }, value => Boolean(value) && typeof value === 'object' && !Array.isArray(value));
    console.log('[DataManager] 本地数据初始化完成');
  }

  // 初始化腾讯云 CloudBase
  async initCloudBase() {
    try {
      const app = cloudbase.init({
        env: CLOUDBASE_CONFIG.env
      });
      this.db = app.database();
      this.useCloudBase = true;
      console.log('[DataManager] CloudBase 初始化成功');
      
      // 同步默认数据到云端（如果云端为空）
      await this.syncDefaultData();
    } catch (error) {
      console.error('[DataManager] CloudBase 初始化失败:', error);
      this.useCloudBase = false;
      this.initLocalStorage();
    }
  }

  // 同步默认数据到云端
  async syncDefaultData() {
    try {
      // 检查商品集合是否为空
      const productsCount = await this.db.collection('products').count();
      if (productsCount.total === 0) {
        // 批量添加默认商品
        for (const product of DEFAULT_PRODUCTS) {
          await this.db.collection('products').add({ data: product });
        }
        console.log('[DataManager] 默认商品已同步到云端');
      }

      // 检查优惠券集合是否为空
      const couponsCount = await this.db.collection('coupons').count();
      if (couponsCount.total === 0) {
        for (const coupon of DEFAULT_COUPONS) {
          await this.db.collection('coupons').add({ data: coupon });
        }
        console.log('[DataManager] 默认优惠券已同步到云端');
      }
    } catch (error) {
      console.error('[DataManager] 同步默认数据失败:', error);
    }
  }

  resolveCategoryNameFromStore(categoryValue, gameCode = '') {
    const rawCategory = String(categoryValue || '').trim();
    if (!rawCategory) return rawCategory;
    if (!/^cat_/i.test(rawCategory)) return rawCategory;

    try {
      const storedCategories = JSON.parse(localStorage.getItem('zhimai_categories') || '[]');
      if (!Array.isArray(storedCategories)) return rawCategory;

      const findById = (item) => String(item?._id || item?.id || '').trim() === rawCategory;
      const findWithName = (item) => Boolean(String(item?.name || '').trim());

      const sameGameMatch = storedCategories.find((item) => {
        if (!findById(item) || !findWithName(item)) return false;
        if (!gameCode) return true;
        const itemGame = String(item?.game || '').trim();
        return !itemGame || itemGame === String(gameCode).trim();
      });
      if (sameGameMatch) return String(sameGameMatch.name).trim();

      const anyMatch = storedCategories.find((item) => findById(item) && findWithName(item));
      return anyMatch ? String(anyMatch.name).trim() : rawCategory;
    } catch (error) {
      return rawCategory;
    }
  }

  normalizeProductCategoryForDisplay(product) {
    if (!product || typeof product !== 'object') return product;

    const rawCategory = String(product.category || '').trim();
    const resolvedCategory = this.resolveCategoryNameFromStore(rawCategory, product.game);
    if (!resolvedCategory || resolvedCategory === rawCategory) return product;

    const normalized = { ...product, category: resolvedCategory };
    if (!product.categoryId) normalized.categoryId = rawCategory;
    return normalized;
  }

  // ==================== 商品管理 ====================
  async getProducts() {
    if (this.useCloudBase && this.db) {
      try {
        const { data } = await this.db.collection('products').get();
        const list = Array.isArray(data) ? data : [];
        return list.map((item) => this.normalizeProductCategoryForDisplay(item));
      } catch (error) {
        console.error('[DataManager] 获取商品失败:', error);
        return [];
      }
    }
    const data = localStorage.getItem('zhimai_products');
    const list = data ? JSON.parse(data) : [];
    return Array.isArray(list) ? list.map((item) => this.normalizeProductCategoryForDisplay(item)) : [];
  }

  async getActiveProducts() {
    const products = await this.getProducts();
    return products.filter(p => p && (p.status === 1 || p.status === '1' || p.status === 'active'));
  }

  async getProductById(id) {
    if (this.useCloudBase && this.db) {
      try {
        const { data } = await this.db.collection('products').doc(id.toString()).get();
        return this.normalizeProductCategoryForDisplay(data);
      } catch (error) {
        console.error('[DataManager] 获取商品详情失败:', error);
        return null;
      }
    }
    const products = await this.getProducts();
    return products.find(p => p.id === parseInt(id));
  }

  async getProductsByGame(game) {
    if (this.useCloudBase && this.db) {
      try {
        const { data } = await this.db.collection('products')
          .where({ game: game })
          .get();
        const list = Array.isArray(data) ? data : [];
        const normalized = list.map((item) => this.normalizeProductCategoryForDisplay(item));
        return normalized.filter(p => p && (p.status === 1 || p.status === '1' || p.status === 'active'));
      } catch (error) {
        console.error('[DataManager] 获取游戏商品失败:', error);
        return [];
      }
    }
    const products = await this.getActiveProducts();
    return products.filter(p => p.game === game);
  }

  async updateProduct(id, data) {
    if (this.useCloudBase && this.db) {
      try {
        await this.db.collection('products').doc(id.toString()).update({ data });
        return true;
      } catch (error) {
        console.error('[DataManager] 更新商品失败:', error);
        return false;
      }
    }
    const products = await this.getProducts();
    const index = products.findIndex(p => p.id === parseInt(id));
    if (index !== -1) {
      products[index] = { ...products[index], ...data };
      localStorage.setItem('zhimai_products', JSON.stringify(products));
      return true;
    }
    return false;
  }

  async toggleProductStatus(id) {
    const product = await this.getProductById(id);
    if (product) {
      const isActive = product.status === 1 || product.status === '1' || product.status === 'active';
      return this.updateProduct(id, { status: isActive ? 0 : 1 });
    }
    return false;
  }

  async deleteProduct(id) {
    if (this.useCloudBase && this.db) {
      try {
        await this.db.collection('products').doc(id.toString()).remove();
        return true;
      } catch (error) {
        console.error('[DataManager] 删除商品失败:', error);
        return false;
      }
    }
    const products = await this.getProducts();
    const filtered = products.filter(p => p.id !== parseInt(id));
    localStorage.setItem('zhimai_products', JSON.stringify(filtered));
    return true;
  }

  async addProduct(data) {
    if (this.useCloudBase && this.db) {
      try {
        const products = await this.getProducts();
        const newId = Math.max(...products.map(p => p.id), 10000) + 1;
        const newProduct = {
          id: newId,
          ...data,
          sales: 0,
          createdAt: new Date().toISOString().split('T')[0]
        };
        await this.db.collection('products').add({ data: newProduct });
        return newProduct;
      } catch (error) {
        console.error('[DataManager] 添加商品失败:', error);
        return null;
      }
    }
    const products = await this.getProducts();
    const newId = Math.max(...products.map(p => p.id), 10000) + 1;
    const newProduct = {
      id: newId,
      ...data,
      sales: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    products.push(newProduct);
    localStorage.setItem('zhimai_products', JSON.stringify(products));
    return newProduct;
  }

  // ==================== 订单管理 ====================
  async getOrders() {
    if (this.useCloudBase && this.db) {
      try {
        const { data } = await this.db.collection('orders').get();
        return data || [];
      } catch (error) {
        console.error('[DataManager] 获取订单失败:', error);
        return [];
      }
    }
    const data = localStorage.getItem('zhimai_orders');
    return data ? JSON.parse(data) : [];
  }

  async getOrdersByUser(userId) {
    if (this.useCloudBase && this.db) {
      try {
        const { data } = await this.db.collection('orders')
          .where({ userId: userId })
          .get();
        return data || [];
      } catch (error) {
        console.error('[DataManager] 获取用户订单失败:', error);
        return [];
      }
    }
    const orders = await this.getOrders();
    return orders.filter(o => o.userId === userId);
  }

  async getOrderById(orderId) {
    if (this.useCloudBase && this.db) {
      try {
        const { data } = await this.db.collection('orders').doc(orderId).get();
        return data;
      } catch (error) {
        console.error('[DataManager] 获取订单详情失败:', error);
        return null;
      }
    }
    const orders = await this.getOrders();
    return orders.find(o => o.id === orderId);
  }

  async createOrder(orderData) {
    const orderId = 'ZM' + Date.now().toString(36).toUpperCase();
    const newOrder = {
      id: orderId,
      ...orderData,
      status: 'pending', // pending, paid, processing, completed, cancelled, refunded
      statusText: '待支付',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (this.useCloudBase && this.db) {
      try {
        await this.db.collection('orders').add({ data: newOrder });
      } catch (error) {
        console.error('[DataManager] 创建订单失败:', error);
        return null;
      }
    } else {
      const orders = await this.getOrders();
      orders.unshift(newOrder);
      localStorage.setItem('zhimai_orders', JSON.stringify(orders));
    }
    
    // 更新统计
    this.updateStats('newOrder', newOrder.totalAmount);
    
    // 发送通知
    this.addNotification({
      userId: orderData.userId,
      title: '订单创建成功',
      content: `您的订单 ${orderId} 已创建，请尽快支付`,
      type: 'order',
      link: `order-detail.html?id=${orderId}`
    });
    
    return newOrder;
  }

  async updateOrderStatus(orderId, status, statusText) {
    const updateData = {
      status: status,
      statusText: statusText,
      updatedAt: new Date().toISOString()
    };

    if (this.useCloudBase && this.db) {
      try {
        await this.db.collection('orders').doc(orderId).update({ data: updateData });
      } catch (error) {
        console.error('[DataManager] 更新订单状态失败:', error);
        return false;
      }
    } else {
      const orders = await this.getOrders();
      const index = orders.findIndex(o => o.id === orderId);
      if (index !== -1) {
        orders[index] = { ...orders[index], ...updateData };
        localStorage.setItem('zhimai_orders', JSON.stringify(orders));
      } else {
        return false;
      }
    }
    
    // 发送状态变更通知
    const order = await this.getOrderById(orderId);
    if (order) {
      this.addNotification({
        userId: order.userId,
        title: '订单状态更新',
        content: `您的订单 ${orderId} 状态已更新为：${statusText}`,
        type: 'order',
        link: `order-detail.html?id=${orderId}`
      });
    }
    
    return true;
  }

  async payOrder(orderId, paymentMethod) {
    const order = await this.getOrderById(orderId);
    if (order && order.status === 'pending') {
      await this.updateOrderStatus(orderId, 'paid', '已支付');
      
      // 更新商品销量
      const product = await this.getProductById(order.productId);
      if (product) {
        await this.updateProduct(product.id, { 
          sales: (product.sales || 0) + order.quantity,
          stock: Math.max(0, product.stock - order.quantity)
        });
      }
      
      // 更新统计
      this.updateStats('payOrder', order.totalAmount);
      
      return true;
    }
    return false;
  }

  async cancelOrder(orderId, reason) {
    const order = await this.getOrderById(orderId);
    if (order && ['pending', 'paid'].includes(order.status)) {
      await this.updateOrderStatus(orderId, 'cancelled', '已取消');
      
      // 恢复库存
      const product = await this.getProductById(order.productId);
      if (product) {
        await this.updateProduct(product.id, { 
          stock: product.stock + order.quantity
        });
      }
      
      this.addNotification({
        userId: order.userId,
        title: '订单已取消',
        content: `您的订单 ${orderId} 已取消，原因：${reason || '用户取消'}`,
        type: 'order'
      });
      
      return true;
    }
    return false;
  }

  // ==================== 优惠券管理 ====================
  async getCoupons() {
    if (this.useCloudBase && this.db) {
      try {
        const { data } = await this.db.collection('coupons').get();
        return data || [];
      } catch (error) {
        console.error('[DataManager] 获取优惠券失败:', error);
        return [];
      }
    }
    const data = localStorage.getItem('zhimai_coupons');
    return data ? JSON.parse(data) : [];
  }

  async getUserCoupons(userId) {
    if (this.useCloudBase && this.db) {
      try {
        const { data } = await this.db.collection('user_coupons')
          .where({ userId: userId, status: 'unused' })
          .get();
        return data || [];
      } catch (error) {
        console.error('[DataManager] 获取用户优惠券失败:', error);
        return [];
      }
    }
    const data = localStorage.getItem('zhimai_user_coupons');
    const userCoupons = data ? JSON.parse(data) : [];
    return userCoupons.filter(c => c.userId === userId && c.status === 'unused');
  }

  async claimCoupon(userId, couponId) {
    const coupons = await this.getCoupons();
    const coupon = coupons.find(c => c.id === couponId);
    
    if (!coupon || coupon.status !== 1) return { success: false, msg: '优惠券不存在' };
    if (coupon.used >= coupon.total) return { success: false, msg: '优惠券已领完' };
    
    const newUserCoupon = {
      id: 'UC' + Date.now(),
      userId: userId,
      couponId: couponId,
      name: coupon.name,
      type: coupon.type,
      value: coupon.value,
      minOrder: coupon.minOrder,
      status: 'unused',
      claimedAt: new Date().toISOString(),
      expireAt: coupon.endDate
    };

    if (this.useCloudBase && this.db) {
      try {
        // 检查是否已领取
        const { data: existing } = await this.db.collection('user_coupons')
          .where({ userId: userId, couponId: couponId })
          .get();
        if (existing && existing.length > 0) {
          return { success: false, msg: '您已领取过该优惠券' };
        }
        
        await this.db.collection('user_coupons').add({ data: newUserCoupon });
        // 更新优惠券已领数量
        await this.db.collection('coupons').doc(couponId).update({
          data: { used: (coupon.used || 0) + 1 }
        });
      } catch (error) {
        console.error('[DataManager] 领取优惠券失败:', error);
        return { success: false, msg: '领取失败' };
      }
    } else {
      const userCoupons = JSON.parse(localStorage.getItem('zhimai_user_coupons') || '[]');
      if (userCoupons.find(c => c.userId === userId && c.couponId === couponId)) {
        return { success: false, msg: '您已领取过该优惠券' };
      }
      userCoupons.push(newUserCoupon);
      localStorage.setItem('zhimai_user_coupons', JSON.stringify(userCoupons));
      // 更新优惠券已领数量
      coupon.used++;
      localStorage.setItem('zhimai_coupons', JSON.stringify(coupons));
    }
    
    return { success: true, msg: '领取成功' };
  }

  async useCoupon(userCouponId) {
    if (this.useCloudBase && this.db) {
      try {
        await this.db.collection('user_coupons').doc(userCouponId).update({
          data: { status: 'used', usedAt: new Date().toISOString() }
        });
        return true;
      } catch (error) {
        console.error('[DataManager] 使用优惠券失败:', error);
        return false;
      }
    }
    const userCoupons = JSON.parse(localStorage.getItem('zhimai_user_coupons') || '[]');
    const index = userCoupons.findIndex(c => c.id === userCouponId);
    if (index !== -1) {
      userCoupons[index].status = 'used';
      userCoupons[index].usedAt = new Date().toISOString();
      localStorage.setItem('zhimai_user_coupons', JSON.stringify(userCoupons));
      return true;
    }
    return false;
  }

  // ==================== 地址管理 ====================
  getAddresses(userId) {
    const data = localStorage.getItem('zhimai_addresses');
    const addresses = data ? JSON.parse(data) : [];
    return addresses.filter(a => a.userId === userId);
  }

  addAddress(addressData) {
    const addresses = JSON.parse(localStorage.getItem('zhimai_addresses') || '[]');
    const newAddress = {
      id: 'ADDR' + Date.now(),
      ...addressData,
      createdAt: new Date().toISOString()
    };
    addresses.push(newAddress);
    localStorage.setItem('zhimai_addresses', JSON.stringify(addresses));
    return newAddress;
  }

  updateAddress(id, data) {
    const addresses = JSON.parse(localStorage.getItem('zhimai_addresses') || '[]');
    const index = addresses.findIndex(a => a.id === id);
    if (index !== -1) {
      addresses[index] = { ...addresses[index], ...data };
      localStorage.setItem('zhimai_addresses', JSON.stringify(addresses));
      return true;
    }
    return false;
  }

  deleteAddress(id) {
    const addresses = JSON.parse(localStorage.getItem('zhimai_addresses') || '[]');
    const filtered = addresses.filter(a => a.id !== id);
    localStorage.setItem('zhimai_addresses', JSON.stringify(filtered));
    return true;
  }

  // ==================== 通知管理 ====================
  getNotifications(userId) {
    const data = localStorage.getItem('zhimai_notifications');
    const notifications = data ? JSON.parse(data) : [];
    return notifications.filter(n => n.userId === userId || n.userId === 'all');
  }

  getUnreadCount(userId) {
    return this.getNotifications(userId).filter(n => !n.read).length;
  }

  addNotification(notification) {
    const notifications = JSON.parse(localStorage.getItem('zhimai_notifications') || '[]');
    notifications.unshift({
      id: 'NT' + Date.now(),
      ...notification,
      read: false,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('zhimai_notifications', JSON.stringify(notifications));
    return true;
  }

  markNotificationRead(notificationId) {
    const notifications = JSON.parse(localStorage.getItem('zhimai_notifications') || '[]');
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      notifications[index].read = true;
      localStorage.setItem('zhimai_notifications', JSON.stringify(notifications));
      return true;
    }
    return false;
  }

  markAllRead(userId) {
    const notifications = JSON.parse(localStorage.getItem('zhimai_notifications') || '[]');
    notifications.forEach(n => {
      if (n.userId === userId) n.read = true;
    });
    localStorage.setItem('zhimai_notifications', JSON.stringify(notifications));
    return true;
  }

  // ==================== 统计管理 ====================
  getStats() {
    const data = localStorage.getItem('zhimai_stats');
    return data ? JSON.parse(data) : { totalOrders: 0, totalSales: 0, totalUsers: 0 };
  }

  updateStats(type, amount = 0) {
    const stats = this.getStats();
    const today = new Date().toISOString().split('T')[0];
    
    switch(type) {
      case 'newOrder':
        stats.totalOrders++;
        break;
      case 'payOrder':
        stats.totalSales += amount;
        break;
      case 'newUser':
        stats.totalUsers++;
        break;
    }
    
    localStorage.setItem('zhimai_stats', JSON.stringify(stats));
    return stats;
  }

  // ==================== 用户管理 ====================
  async getUsers() {
    if (this.useCloudBase && this.db) {
      try {
        const { data } = await this.db.collection('users').get();
        return data || [];
      } catch (error) {
        console.error('[DataManager] 获取用户失败:', error);
        return [];
      }
    }
    const data = localStorage.getItem('zhimai_users');
    return data ? JSON.parse(data) : [];
  }

  async getUserById(userId) {
    if (this.useCloudBase && this.db) {
      try {
        const { data } = await this.db.collection('users').doc(userId).get();
        return data;
      } catch (error) {
        console.error('[DataManager] 获取用户详情失败:', error);
        return null;
      }
    }
    const users = await this.getUsers();
    return users.find(u => u.id === userId);
  }

  async updateUser(userId, data) {
    if (this.useCloudBase && this.db) {
      try {
        await this.db.collection('users').doc(userId).update({ data });
        return true;
      } catch (error) {
        console.error('[DataManager] 更新用户失败:', error);
        return false;
      }
    }
    const users = await this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index] = { ...users[index], ...data };
      localStorage.setItem('zhimai_users', JSON.stringify(users));
      return true;
    }
    return false;
  }

  async addUser(userData) {
    if (this.useCloudBase && this.db) {
      try {
        await this.db.collection('users').add({ data: userData });
        return true;
      } catch (error) {
        console.error('[DataManager] 添加用户失败:', error);
        return false;
      }
    }
    const users = await this.getUsers();
    users.push(userData);
    localStorage.setItem('zhimai_users', JSON.stringify(users));
    return true;
  }

  // 切换环境ID
  setEnv(envId) {
    CLOUDBASE_CONFIG.env = envId;
    console.log('[DataManager] 环境ID已切换为:', envId);
    // 重新初始化
    if (!USE_LOCAL_MOCK && typeof cloudbase !== 'undefined') {
      this.initCloudBase();
    }
  }

  // 生成订单号
  generateOrderId() {
    return 'ZM' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 3).toUpperCase();
  }
}

// ==================== 打手默认数据 ====================
const DEFAULT_BOOSTERS = [
  { id: 'B001', name: '玄刃', level: '大神', game: '三角洲行动', status: 1, rating: 4.9, orders: 128, intro: '专业哈弗币代肝，日均10M+', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xuanjian' },
  { id: 'B002', name: '星辰', level: '王者', game: '三角洲行动', status: 1, rating: 4.8, orders: 96, intro: '3x3任务高手，速度快效率高', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xingchen' },
  { id: 'B003', name: '影速', level: '强者', game: '三角洲行动', status: 0, rating: 4.7, orders: 65, intro: '多年代练经验，稳定可靠', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yingsu' },
];

// ==================== DataManager 扩展：同步快捷方法（供后台页面使用）====================
// 注意：原始方法是 async，这些同步方法直接操作 localStorage，适合纯前端后台使用

Object.assign(DataManager.prototype, {

  // 同步获取商品列表
  getProducts() {
    const data = localStorage.getItem('zhimai_products');
    return data ? JSON.parse(data) : DEFAULT_PRODUCTS;
  },

  // 同步保存商品列表
  saveProducts(products) {
    localStorage.setItem('zhimai_products', JSON.stringify(products));
  },

  // 同步获取订单列表
  getOrders() {
    const data = localStorage.getItem('zhimai_orders');
    return data ? JSON.parse(data) : [];
  },

  // 同步保存订单列表
  saveOrders(orders) {
    localStorage.setItem('zhimai_orders', JSON.stringify(orders));
  },

  // 同步获取单个订单
  getOrderById(orderId) {
    const orders = this.getOrders();
    return orders.find(order => order.id == orderId) || null;
  },

  // 同步获取优惠券列表
  getCoupons() {
    const data = localStorage.getItem('zhimai_coupons');
    return data ? JSON.parse(data) : DEFAULT_COUPONS;
  },

  // 同步保存优惠券列表
  saveCoupons(coupons) {
    localStorage.setItem('zhimai_coupons', JSON.stringify(coupons));
  },

  // 获取打手列表
  getBoosters() {
    const data = localStorage.getItem('zhimai_boosters');
    if (!data) {
      localStorage.setItem('zhimai_boosters', JSON.stringify(DEFAULT_BOOSTERS));
      return DEFAULT_BOOSTERS;
    }
    return JSON.parse(data);
  },

  // 保存打手列表
  saveBoosters(boosters) {
    localStorage.setItem('zhimai_boosters', JSON.stringify(boosters));
  },

  // 同步获取用户列表
  getUsers() {
    const data = localStorage.getItem('zhimai_users');
    return data ? JSON.parse(data) : [];
  },

  // 同步获取单个用户
  getUserById(userId) {
    const users = this.getUsers();
    return users.find(user => String(user.id) === String(userId)) || null;
  },

  // 同步保存用户列表
  saveUsers(users) {
    localStorage.setItem('zhimai_users', JSON.stringify(users));
  },

  getCurrentLoggedInUser() {
    const localUser = this.readLocalJSON('zhimai_user', null);
    if (localUser) return localUser;

    try {
      const rawSessionUser = sessionStorage.getItem('zhimai_user');
      return rawSessionUser ? JSON.parse(rawSessionUser) : null;
    } catch (error) {
      sessionStorage.removeItem('zhimai_user');
      return null;
    }
  },

  getResolvedCurrentUser() {
    const currentUser = this.getCurrentLoggedInUser();
    if (!currentUser) return null;

    const users = this.getUsers();
    const storedUser = users.find(user =>
      user && (
        String(user.id) === String(currentUser.id)
        || (currentUser.phone && String(user.phone) === String(currentUser.phone))
      )
    );

    if (!storedUser) {
      return currentUser;
    }

    const nextUser = { ...currentUser, ...storedUser };
    this.setCurrentLoggedInUser(nextUser);
    return nextUser;
  },

  setCurrentLoggedInUser(user) {
    const hasLocalUser = localStorage.getItem('zhimai_user') !== null;
    const hasSessionUser = sessionStorage.getItem('zhimai_user') !== null;

    if (!user) {
      if (hasLocalUser) localStorage.removeItem('zhimai_user');
      if (hasSessionUser) sessionStorage.removeItem('zhimai_user');
      return;
    }

    if (hasLocalUser) {
      localStorage.setItem('zhimai_user', JSON.stringify(user));
    }

    if (hasSessionUser) {
      sessionStorage.setItem('zhimai_user', JSON.stringify(user));
    }
  },

  isTestAccountUser(user) {
    if (!user || typeof user !== 'object') return false;
    return String(user.phone || '') === TEST_CONSOLE_ACCOUNT_PHONE
      || String(user.username || '') === TEST_CONSOLE_ACCOUNT_USERNAME;
  },

  ensureUserRecord(userId) {
    let user = this.getUserById(userId);
    const currentUser = this.getCurrentLoggedInUser();

    if (!user && currentUser && String(currentUser.id) === String(userId)) {
      const users = this.getUsers();
      users.push(currentUser);
      this.saveUsers(users);
      user = currentUser;
    }

    if (!user) {
      throw new Error('当前用户不存在，请重新登录后再试');
    }

    return user;
  },

  ensureTestAccountUser(userId) {
    if (!USE_LOCAL_MOCK) {
      throw new Error('该工具仅限本地 mock 模式使用');
    }

    let user = this.getUserById(userId);
    const currentUser = this.getCurrentLoggedInUser();

    if (!user && currentUser && String(currentUser.id) === String(userId) && this.isTestAccountUser(currentUser)) {
      const users = this.getUsers();
      users.push(currentUser);
      this.saveUsers(users);
      user = currentUser;
    }

    if (!this.isTestAccountUser(user)) {
      throw new Error('仅测试账号可使用本地测试控制台');
    }

    return user;
  },

  getWalletStore() {
    const wallets = this.readLocalJSON('zhimai_wallets', {});
    return wallets && typeof wallets === 'object' && !Array.isArray(wallets) ? wallets : {};
  },

  saveWalletStore(wallets) {
    localStorage.setItem('zhimai_wallets', JSON.stringify(wallets || {}));
    return wallets || {};
  },

  updateUserRecord(userId, patch) {
    const user = this.ensureUserRecord(userId);
    const users = this.getUsers();
    const userIndex = users.findIndex(item => String(item.id) === String(user.id));
    const nextUser = { ...user, ...patch };

    if (userIndex >= 0) {
      users[userIndex] = nextUser;
    } else {
      users.push(nextUser);
    }

    this.saveUsers(users);

    const currentUser = this.getCurrentLoggedInUser();
    if (currentUser && String(currentUser.id) === String(nextUser.id)) {
      this.setCurrentLoggedInUser({ ...currentUser, ...nextUser });
    }

    return nextUser;
  },

  updateCurrentUserProfile(userId, patch) {
    return this.updateUserRecord(userId, patch);
  },

  updateCurrentUserLoginPassword(userId, newPassword) {
    const passwordSalt = createPasswordSalt();
    const passwordHash = derivePasswordHash(newPassword, passwordSalt);
    return this.updateUserRecord(userId, {
      password: '',
      passwordHash,
      passwordSalt
    });
  },

  bindCurrentUserEmail(userId, email) {
    return this.updateUserRecord(userId, { email });
  },

  getUserScopedOrders(userId) {
    return this.getOrders().filter(order => String(order.userId) === String(userId));
  },

  getUserScopedCoupons(userId) {
    return this.readLocalJSON('zhimai_user_coupons', [])
      .filter(coupon => String(coupon.userId) === String(userId));
  },

  getTestUserSummary(userId) {
    const user = this.ensureTestAccountUser(userId);
    const orders = this.getUserScopedOrders(user.id);
    const coupons = this.getUserScopedCoupons(user.id);
    const wallets = this.getWalletStore();
    const wallet = wallets[user.id] || {
      balance: Number(user.balance || TEST_CONSOLE_DEFAULT_WALLET_BALANCE),
      transactions: []
    };
    const localUser = this.readLocalJSON('zhimai_user', null);
    let sessionUser = null;

    try {
      const rawSessionUser = sessionStorage.getItem('zhimai_user');
      sessionUser = rawSessionUser ? JSON.parse(rawSessionUser) : null;
    } catch (error) {
      sessionStorage.removeItem('zhimai_user');
    }

    return {
      userId: user.id,
      phone: user.phone || '',
      username: user.username || user.nickname || '测试账号',
      walletBalance: Number(wallet.balance || 0),
      orderCount: orders.length,
      ownedCouponCount: coupons.length,
      hasPaymentPassword: /^\d{6}$/.test(user.paymentPassword || ''),
      loginStatus: {
        local: Boolean(localUser && String(localUser.id) === String(user.id)),
        session: Boolean(sessionUser && String(sessionUser.id) === String(user.id))
      },
      isLocalMock: USE_LOCAL_MOCK
    };
  },

  addTestOrderForUser(userId) {
    const user = this.ensureTestAccountUser(userId);
    const product = this.getProducts().find(item => item && (item.status === 1 || item.status === '1' || item.status === 'active')) || DEFAULT_PRODUCTS[0];
    const orders = this.getOrders();
    const createdAt = new Date().toISOString();
    const expireAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const quantity = 1;
    const subtotal = Number(product.price || 0) * quantity;
    const newOrder = {
      id: this.generateOrderId(),
      userId: user.id,
      productId: product.id,
      productName: product.name,
      productImage: product.image || product.thumbnail || '',
      price: Number(product.price || 0),
      quantity,
      subtotal,
      discount: 0,
      totalAmount: subtotal,
      status: 'pending',
      statusText: '待支付',
      paymentMethod: 'wechat',
      gameAccount: `test_${String(user.phone || user.id).slice(-4)}`,
      gameServer: product.gameName || '测试区服',
      contactPhone: user.phone || '',
      remark: '本地测试控制台创建',
      createdAt,
      expireAt,
      updatedAt: createdAt
    };

    orders.unshift(newOrder);
    this.saveOrders(orders);

    return {
      success: true,
      message: '已为当前测试账号添加 1 条测试订单',
      order: newOrder,
      summary: this.getTestUserSummary(user.id)
    };
  },

  addTestCouponForUser(userId) {
    const user = this.ensureTestAccountUser(userId);
    const userCoupons = this.readLocalJSON('zhimai_user_coupons', []);
    const timestamp = Date.now();
    const newCoupon = {
      id: 'UTC' + timestamp,
      userId: user.id,
      couponId: 'TEST_USER_' + timestamp,
      name: '测试账号专用优惠券',
      type: 'fixed',
      value: 20,
      minOrder: 99,
      status: 'unused',
      claimedAt: new Date().toISOString(),
      expireAt: '2026-12-31',
      desc: '本地 mock 测试控制台发放'
    };

    userCoupons.unshift(newCoupon);
    localStorage.setItem('zhimai_user_coupons', JSON.stringify(userCoupons));

    return {
      success: true,
      message: '已为当前测试账号添加 1 张测试优惠券',
      coupon: newCoupon,
      summary: this.getTestUserSummary(user.id)
    };
  },

  restoreDefaultWalletBalance(userId) {
    const user = this.ensureTestAccountUser(userId);
    const wallets = this.getWalletStore();
    wallets[user.id] = {
      balance: TEST_CONSOLE_DEFAULT_WALLET_BALANCE,
      transactions: []
    };
    this.saveWalletStore(wallets);
    this.updateUserRecord(user.id, { balance: TEST_CONSOLE_DEFAULT_WALLET_BALANCE });

    return {
      success: true,
      message: `钱包余额已恢复为 ¥${TEST_CONSOLE_DEFAULT_WALLET_BALANCE.toFixed(2)}`,
      summary: this.getTestUserSummary(user.id)
    };
  },

  resetCurrentUserWallet(userId) {
    return this.restoreDefaultWalletBalance(userId);
  },

  resetCurrentUserOrders(userId) {
    const user = this.ensureTestAccountUser(userId);
    const orders = this.getOrders();
    const nextOrders = orders.filter(order => String(order.userId) !== String(user.id));
    this.saveOrders(nextOrders);

    return {
      success: true,
      message: `已清空当前测试账号的 ${orders.length - nextOrders.length} 条订单`,
      summary: this.getTestUserSummary(user.id)
    };
  },

  resetCurrentUserCoupons(userId) {
    const user = this.ensureTestAccountUser(userId);
    const userCoupons = this.readLocalJSON('zhimai_user_coupons', []);
    const nextUserCoupons = userCoupons.filter(coupon => String(coupon.userId) !== String(user.id));
    localStorage.setItem('zhimai_user_coupons', JSON.stringify(nextUserCoupons));

    return {
      success: true,
      message: `已清空当前测试账号的 ${userCoupons.length - nextUserCoupons.length} 张优惠券`,
      summary: this.getTestUserSummary(user.id)
    };
  },

  resetCurrentUserPaymentPassword(userId) {
    const user = this.ensureTestAccountUser(userId);
    this.updateUserRecord(user.id, { paymentPassword: '' });

    return {
      success: true,
      message: '当前测试账号的钱包支付密码已重置为未设置',
      summary: this.getTestUserSummary(user.id)
    };
  },

  setDefaultMockPaymentPassword(userId) {
    const user = this.ensureTestAccountUser(userId);
    this.updateUserRecord(user.id, { paymentPassword: TEST_CONSOLE_DEFAULT_PAYMENT_PASSWORD });

    return {
      success: true,
      message: '默认测试支付密码已清空（未设置）',
      summary: this.getTestUserSummary(user.id)
    };
  },

  restoreCurrentUserBaseline(userId) {
    const user = this.ensureTestAccountUser(userId);
    this.resetCurrentUserOrders(user.id);
    this.resetCurrentUserCoupons(user.id);
    this.restoreDefaultWalletBalance(user.id);
    this.resetCurrentUserPaymentPassword(user.id);

    return {
      success: true,
      message: '当前测试账号已恢复到可重复测试的本地基线状态',
      summary: this.getTestUserSummary(user.id)
    };
  },

});

// 创建全局实例
const dataManager = new DataManager();

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DataManager, dataManager };
}
