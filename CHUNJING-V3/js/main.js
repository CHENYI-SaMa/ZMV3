/* =========================================
   文件名: js/main.js
   文件说明: 织麦电竞 · 主页面 JavaScript 交互
   ========================================= */

// ========== 工具函数 ==========
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const CONTACT_MESSAGE_STORAGE_KEY = 'zhimai_contact_messages';
const CONTACT_SERVICE_TYPE_STORAGE_KEY = 'zhimai_contact_service_types';
const CONTACT_SERVICE_TYPE_SYNC_KEY = 'zhimai_contact_service_types_updated_at';
const DEFAULT_CONTACT_SERVICE_TYPES = [
  '哈弗币代肝',
  '3x3任务代做',
  '日常任务清理',
  '账号出租评估',
  '账号代售',
  '其他咨询'
];

function readLocalJSONSafe(key, fallbackValue) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallbackValue;
  } catch (error) {
    return fallbackValue;
  }
}

function hasLocalStorageKey(key) {
  try {
    return localStorage.getItem(key) !== null;
  } catch (error) {
    return false;
  }
}

function writeLocalJSONSafe(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeContactServiceTypeName(name) {
  return String(name || '').trim();
}

function collectContactServiceTypesFromGames() {
  const games = readLocalJSONSafe('zhimai_games', []);
  if (!Array.isArray(games)) return [];

  const names = [];
  games.forEach((game) => {
    if (!game || typeof game !== 'object') return;

    const list = Array.isArray(game.serviceTypes) ? game.serviceTypes : [];
    list.forEach((item) => {
      const text = normalizeContactServiceTypeName(item);
      if (text) names.push(text);
    });

    const fallbackName = normalizeContactServiceTypeName(game.displayServiceText || game.serviceType || '');
    if (fallbackName) names.push(fallbackName);
  });

  return Array.from(new Set(names));
}

function normalizeContactServiceTypes(rawList) {
  const source = Array.isArray(rawList) ? rawList : [];
  const normalized = source
    .map((item, index) => {
      if (typeof item === 'string') {
        const text = normalizeContactServiceTypeName(item);
        if (!text) return null;
        return {
          id: `CST_${index + 1}`,
          name: text,
          sort: index + 1,
          status: 1
        };
      }

      if (!item || typeof item !== 'object') return null;

      const name = normalizeContactServiceTypeName(item.name || item.label || item.value || '');
      if (!name) return null;

      const sort = Number(item.sort);
      return {
        id: String(item.id || `CST_${index + 1}`),
        name,
        sort: Number.isFinite(sort) ? sort : (index + 1),
        status: item.status === 0 ? 0 : 1
      };
    })
    .filter(Boolean);

  return normalized
    .sort((a, b) => {
      if (a.sort !== b.sort) return a.sort - b.sort;
      return String(a.name).localeCompare(String(b.name), 'zh-CN');
    })
    .map((item, idx) => ({ ...item, sort: idx + 1 }));
}

function ensureContactServiceTypeStore() {
  if (hasLocalStorageKey(CONTACT_SERVICE_TYPE_STORAGE_KEY)) {
    const stored = normalizeContactServiceTypes(readLocalJSONSafe(CONTACT_SERVICE_TYPE_STORAGE_KEY, []));
    writeLocalJSONSafe(CONTACT_SERVICE_TYPE_STORAGE_KEY, stored);
    return stored;
  }

  const seeded = collectContactServiceTypesFromGames();
  const fallbackSource = seeded.length > 0 ? seeded : DEFAULT_CONTACT_SERVICE_TYPES;
  const defaults = normalizeContactServiceTypes(
    fallbackSource.map((name, index) => ({
      id: `CST_${index + 1}`,
      name,
      sort: index + 1,
      status: 1
    }))
  );

  writeLocalJSONSafe(CONTACT_SERVICE_TYPE_STORAGE_KEY, defaults);
  return defaults;
}

function getActiveContactServiceTypes() {
  return ensureContactServiceTypeStore().filter((item) => item.status === 1);
}

function hydrateContactServiceTypeSelect() {
  const select = $('#service');
  if (!select) return;

  const currentValue = String(select.value || '').trim();
  const serviceTypes = getActiveContactServiceTypes();

  select.innerHTML = '<option value="">请选择服务类型</option>';
  serviceTypes.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.name;
    option.textContent = item.name;
    select.appendChild(option);
  });

  if (currentValue && serviceTypes.some((item) => item.name === currentValue)) {
    select.value = currentValue;
  }
}

function createContactMessage(payload) {
  const messages = readLocalJSONSafe(CONTACT_MESSAGE_STORAGE_KEY, []);
  const list = Array.isArray(messages) ? messages : [];
  const nextMessage = {
    id: `MSG_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: String(payload.name || '').trim(),
    phone: String(payload.phone || '').trim(),
    wechat: String(payload.wechat || '').trim(),
    email: String(payload.email || '').trim(),
    service: String(payload.service || '').trim(),
    message: String(payload.message || '').trim(),
    userId: payload.userId ? String(payload.userId) : '',
    status: 'unread',
    source: 'index-contact-form',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  list.unshift(nextMessage);
  writeLocalJSONSafe(CONTACT_MESSAGE_STORAGE_KEY, list);
  return nextMessage;
}

// ========== 返回上一页 ==========
function goBack() {
  if (document.referrer && document.referrer !== window.location.href) {
    history.back();
  } else {
    window.location.href = 'index.html';
  }
}

// ========== 导航栏用户信息 ==========
function updateNavUserInfo() {
  const navAuthBtn = document.getElementById('navAuthBtn');
  if (!navAuthBtn) return;
  
  const currentUser = JSON.parse(localStorage.getItem('zhimai_user') || sessionStorage.getItem('zhimai_user') || 'null');
  
  if (currentUser) {
    // 已登录：显示用户头像（使用安全节点构建，避免模板注入）
    const username = String(currentUser.username || '').trim() || '用户';
    const navUserLink = document.createElement('a');
    navUserLink.href = 'profile.html';
    navUserLink.className = 'nav-user';
    navUserLink.id = 'navUserAvatar';
    navUserLink.title = username;

    const avatar = document.createElement('div');
    avatar.className = 'nav-avatar';
    avatar.textContent = username.charAt(0).toUpperCase();
    navUserLink.appendChild(avatar);

    navAuthBtn.replaceWith(navUserLink);
  }
  // 未登录：保持登录/注册按钮不变
}

// ========== 高亮当前锚点 ==========
function updateActiveNav() {
  const navLinkItems = $$('.nav-item');
  const sections = ['home', 'about', 'services', 'join', 'contact'];
  let current = 'home';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.top <= 100) current = id;
    }
  });
  navLinkItems.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
}

// ========== 粒子效果 ==========
function createParticles() {
  const container = $('#particles');
  if (!container) return;
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      width: ${Math.random() * 3 + 1}px;
      height: ${Math.random() * 3 + 1}px;
      --dur: ${Math.random() * 4 + 3}s;
      --delay: ${Math.random() * 5}s;
      opacity: 0;
    `;
    container.appendChild(p);
  }
}

// ========== 数字滚动动画 ==========
function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const duration = 2000;
  const step = target / (duration / 16);
  let current = 0;

  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.floor(current).toLocaleString();
  }, 16);
}

// ========== Toast 提示 ==========
function showToast(msg, type = 'info') {
  const existing = $('.zm-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  const icons = { success: 'check-circle', warning: 'exclamation-circle', info: 'info-circle' };
  const safeType = Object.prototype.hasOwnProperty.call(icons, type) ? type : 'info';
  toast.className = `zm-toast zm-toast-${safeType}`;
  const icon = document.createElement('i');
  icon.className = `fa fa-${icons[safeType]}`;
  toast.appendChild(icon);
  toast.appendChild(document.createTextNode(` ${String(msg == null ? '' : msg)}`));

  const style = document.createElement('style');
  if (!$('#toast-style')) {
    style.id = 'toast-style';
    style.textContent = `
      .zm-toast {
        position: fixed; bottom: 32px; right: 32px; z-index: 9999;
        padding: 14px 24px; border-radius: 12px;
        display: flex; align-items: center; gap: 10px;
        font-size: 0.9rem; font-weight: 600;
        backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        animation: toastIn 0.3s ease, toastOut 0.3s ease 2.7s forwards;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      }
      .zm-toast-success { background: rgba(108,99,255,0.9); color: #fff; }
      .zm-toast-warning { background: rgba(255,107,53,0.9); color: #fff; }
      @keyframes toastIn  { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:none; } }
      @keyframes toastOut { from { opacity:1; } to { opacity:0; transform:translateX(40px); } }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3100);
}

// ========== 初始化函数 ==========
function initNavbar() {
  const navbar = $('#navbar');
  
  // 导航栏滚动效果
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      if (navbar) navbar.classList.add('scrolled');
    } else {
      if (navbar) navbar.classList.remove('scrolled');
    }
    updateActiveNav();
  });
}

function initStatsAnimation() {
  const statNums = $$('.stat-num');
  let countersStarted = false;
  
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !countersStarted) {
        countersStarted = true;
        statNums.forEach(animateCounter);
      }
    });
  }, { threshold: 0.5 });

  const heroStats = $('.hero-stats');
  if (heroStats) statsObserver.observe(heroStats);
}

function initRevealAnimation() {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, idx) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, idx * 80);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  const revealTargets = [
    '.feature-card',
    '.about-card-main',
    '.about-info > *',
    '.service-showcase > *',
    '.review-card',
    '.contact-info > *',
    '.contact-form-wrap',
    '.footer-brand',
    '.footer-links',
  ];
  revealTargets.forEach(sel => {
    $$(sel).forEach(el => {
      el.classList.add('reveal');
      revealObserver.observe(el);
    });
  });
}

function initTabs() {
  const tabBtns = $$('.tab-btn');
  const tabContents = $$('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const content = $(`#tab-${target}`);
      if (content) content.classList.add('active');
    });
  });
}

function initContactForm() {
  const contactForm = $('#contactForm');
  if (!contactForm) return;

  hydrateContactServiceTypeSelect();

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#name').value.trim();
    const phone = $('#phone').value.trim();
    const wechatInput = $('#wechat');
    const emailInput = $('#email');
    const serviceInput = $('#service');
    const messageInput = $('#message');
    const wechat = String((wechatInput && wechatInput.value) || '').trim();
    const email = String((emailInput && emailInput.value) || '').trim();
    const service = String((serviceInput && serviceInput.value) || '').trim();
    const message = String((messageInput && messageInput.value) || '').trim();
    const currentUser = JSON.parse(localStorage.getItem('zhimai_user') || sessionStorage.getItem('zhimai_user') || 'null');

    if (!name || !phone || !wechat || !email || !service || !message) {
      showToast('请完整填写姓名、联系电话、微信号、邮箱、咨询服务和留言内容', 'warning');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      showToast('请输入有效的手机号', 'warning');
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('请输入有效的邮箱地址', 'warning');
      return;
    }
    if (!service) {
      showToast('请选择咨询服务类型', 'warning');
      return;
    }

    const btn = contactForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> 提交中…';

    setTimeout(() => {
      createContactMessage({
        name,
        phone,
        wechat,
        email,
        service,
        message,
        userId: currentUser && currentUser.id ? currentUser.id : ''
      });

      contactForm.closest('.contact-form-wrap').innerHTML = `
        <div class="form-success">
          <i class="fa fa-check-circle"></i>
          <h4>提交成功！</h4>
          <p>感谢您的留言，我们的客服团队将在 30 分钟内联系您。</p>
        </div>
      `;
      showToast('提交成功！我们将尽快联系您', 'success');
    }, 1500);
  });
}

function initContactServiceTypeSync() {
  if (!$('#contactForm')) return;

  window.addEventListener('storage', (event) => {
    if (event.key === CONTACT_SERVICE_TYPE_STORAGE_KEY || event.key === CONTACT_SERVICE_TYPE_SYNC_KEY) {
      hydrateContactServiceTypeSelect();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      hydrateContactServiceTypeSelect();
    }
  });

  window.addEventListener('pageshow', () => {
    hydrateContactServiceTypeSelect();
  });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
  // 更新导航栏用户信息
  updateNavUserInfo();
  
  // 初始化导航栏
  initNavbar();
  
  // 初始化动画效果
  createParticles();
  initStatsAnimation();
  initRevealAnimation();
  
  // 初始化交互组件
  initTabs();
  initContactForm();
  initContactServiceTypeSync();
  initSmoothScroll();
  
  // 高亮当前导航
  updateActiveNav();
  
  console.log('⚡ 织麦电竞官网 · 加载完成');
});
