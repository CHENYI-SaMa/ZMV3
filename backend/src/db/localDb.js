'use strict';

/**
 * 本地内存数据库 Mock（USE_LOCAL_DB=true 时使用）
 * 使用 Map 存储各集合数据，模拟 CloudBase 数据库操作
 */

const DEFAULT_GAMES = [
  { _id: 'game_delta', code: 'delta', name: '三角洲行动', icon: 'fa-crosshairs', sort: 0 },
  { _id: 'game_valorant', code: 'valorant', name: '无畏契约', icon: 'fa-shield-alt', sort: 1 },
  { _id: 'game_honor', code: 'honor', name: '王者荣耀', icon: 'fa-crown', sort: 2 }
];

const DEFAULT_CATEGORIES = [
  { _id: 'cat_delta_boost', game: 'delta', name: '代练服务', icon: 'fa-crosshairs', sort: 0 },
  { _id: 'cat_delta_account', game: 'delta', name: '账号交易', icon: 'fa-user-shield', sort: 1 },
  { _id: 'cat_delta_play', game: 'delta', name: '陪玩服务', icon: 'fa-headset', sort: 2 },
  { _id: 'cat_valorant_boost', game: 'valorant', name: '代练服务', icon: 'fa-shield-alt', sort: 0 },
  { _id: 'cat_honor_boost', game: 'honor', name: '代练服务', icon: 'fa-crown', sort: 0 }
];

const DEFAULT_PRODUCTS = [
  {
    _id: 'prod_001',
    id: 10001,
    name: '三角洲黄金段位代练',
    game: 'delta',
    gameName: '三角洲行动',
    category: '代练服务',
    price: 288,
    cost: 180,
    profit: 108,
    priceUnit: '单',
    stock: 99,
    sales: 256,
    sort: 0,
    desc: '专业三角洲代练，快速提升段位',
    detail: '由高段位玩家代练，安全快速，提供详细报告',
    image: '',
    status: 1,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'prod_002',
    id: 10002,
    name: '三角洲白金陪玩',
    game: 'delta',
    gameName: '三角洲行动',
    category: '陪玩服务',
    price: 68,
    cost: 40,
    profit: 28,
    priceUnit: '小时',
    stock: 50,
    sales: 128,
    sort: 1,
    desc: '专业陪玩，轻松愉快的游戏体验',
    detail: '高水平玩家陪玩，带你体验游戏乐趣',
    image: '',
    status: 1,
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_BOOSTERS = [
  {
    _id: 'booster_001',
    id: 'booster_001',
    name: '凌夜',
    phone: '13800000001',
    level: 5,
    status: 'online',
    games: ['三角洲行动'],
    rating: 4.9,
    orders: 128,
    completed: 124,
    income: 18600,
    createdAt: '2026-03-01',
    bio: '专业代练打手'
  },
  {
    _id: 'booster_002',
    id: 'booster_002',
    name: '星河',
    phone: '13800000002',
    level: 4,
    status: 'busy',
    games: ['无畏契约', '三角洲行动'],
    rating: 4.8,
    orders: 96,
    completed: 92,
    income: 13200,
    createdAt: '2026-03-08',
    bio: '多款游戏专业打手'
  }
];

const store = {
  users: new Map(),
  orders: new Map(),
  products: new Map(DEFAULT_PRODUCTS.map((p) => [p._id, p])),
  categories: new Map(DEFAULT_CATEGORIES.map((c) => [c._id, c])),
  games: new Map(DEFAULT_GAMES.map((g) => [g._id, g])),
  wallets: new Map(),
  boosters: new Map(DEFAULT_BOOSTERS.map((b) => [b._id, b])),
  admins: new Map(),
  sms_codes: new Map()
};

function generateId(prefix, map) {
  const num = String(map.size + 1 + Math.floor(Math.random() * 1000)).padStart(7, '0');
  return `${prefix}${num}`;
}

function matchQuery(item, query) {
  for (const [key, value] of Object.entries(query)) {
    if (value && typeof value === 'object') {
      if (value.$in !== undefined) {
        if (!value.$in.includes(item[key])) return false;
      } else if (value.$gte !== undefined || value.$lte !== undefined) {
        const v = item[key];
        if (value.$gte !== undefined && v < value.$gte) return false;
        if (value.$lte !== undefined && v > value.$lte) return false;
      } else if (value.$neq !== undefined) {
        if (item[key] === value.$neq) return false;
      } else {
        if (item[key] !== value) return false;
      }
    } else {
      if (item[key] !== value) return false;
    }
  }
  return true;
}

function buildWhereChain(items, query) {
  let matched = items.filter((item) => matchQuery(item, query));
  let _orderedItems = matched;

  const chain = {
    get() {
      return { data: _orderedItems };
    },
    getOne() {
      return { data: _orderedItems[0] || null };
    },
    count() {
      return { total: _orderedItems.length };
    },
    update(updates) {
      const { $set } = updates;
      _orderedItems.forEach((item) => {
        const updated = { ...item, ...$set };
        items._map.set(item._id, updated);
      });
      return { updated: _orderedItems.length };
    },
    remove() {
      _orderedItems.forEach((item) => items._map.delete(item._id));
      return { deleted: _orderedItems.length };
    },
    orderBy(field, direction) {
      _orderedItems = [..._orderedItems].sort((a, b) => {
        if (a[field] < b[field]) return direction === 'desc' ? 1 : -1;
        if (a[field] > b[field]) return direction === 'desc' ? -1 : 1;
        return 0;
      });
      return chain;
    },
    skip(n) {
      const skipped = _orderedItems.slice(n);
      return {
        limit(m) {
          return { get() { return { data: skipped.slice(0, m) }; } };
        },
        get() { return { data: skipped }; }
      };
    },
    limit(m) {
      return { get() { return { data: _orderedItems.slice(0, m) }; } };
    }
  };
  return chain;
}

// Collection helper – returns a simple CRUD interface
function collection(name) {
  const map = store[name];
  if (!map) throw new Error(`Unknown collection: ${name}`);

  const mapWithRef = Array.from(map.values());
  mapWithRef._map = map;

  return {
    add(doc) {
      const _id = doc._id || `${name}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const record = { ...doc, _id };
      map.set(_id, record);
      return { id: _id };
    },

    where(query) {
      const items = Array.from(map.values());
      items._map = map;
      return buildWhereChain(items, query);
    },

    doc(id) {
      return {
        get() {
          const item = map.get(id);
          return { data: item || null };
        },
        update(updates) {
          const { $set } = updates;
          const item = map.get(id);
          if (item) {
            map.set(id, { ...item, ...$set });
          }
          return { updated: item ? 1 : 0 };
        },
        remove() {
          const existed = map.has(id);
          map.delete(id);
          return { deleted: existed ? 1 : 0 };
        }
      };
    },

    get() {
      return { data: Array.from(map.values()) };
    }
  };
}

module.exports = { collection, generateId, store };
