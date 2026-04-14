/**
 * 文件: admin/js/sidebar.js
 * 说明: 后台侧边栏统一渲染与当前页面高亮
 */

(function () {
  const SIDEBAR_HTML = `
  <div class="sidebar-header">
    <div class="logo">
      <div class="logo-icon"><i class="fa fa-bolt"></i></div>
      <span class="logo-text">织麦电竞</span>
    </div>
  </div>
  <nav class="sidebar-nav">
    <ul class="nav-list">
      <li class="nav-item" data-page="index">
        <a href="/admin/index.html" class="nav-link">
          <i class="fa fa-home"></i>
          <span>仪表盘</span>
        </a>
      </li>

      <li class="nav-item has-submenu" data-group="products">
        <a href="#" class="nav-link">
          <i class="fa fa-box"></i>
          <span>商品管理</span>
          <i class="fa fa-chevron-right arrow"></i>
        </a>
        <ul class="submenu">
          <li data-page="products-categories"><a href="/admin/products-categories.html">商品与分类</a></li>
        </ul>
      </li>

      <li class="nav-item has-submenu" data-group="orders">
        <a href="#" class="nav-link">
          <i class="fa fa-file-alt"></i>
          <span>订单管理</span>
          <i class="fa fa-chevron-right arrow"></i>
        </a>
        <ul class="submenu">
          <li data-page="orders"><a href="/admin/orders.html">全部订单</a></li>
          <li data-page="order-pending"><a href="/admin/order-pending.html">待处理</a></li>
          <li data-page="order-processing"><a href="/admin/order-processing.html">处理中</a></li>
          <li data-page="order-completed"><a href="/admin/order-completed.html">已完成</a></li>
        </ul>
      </li>

      <li class="nav-item has-submenu" data-group="boost">
        <a href="#" class="nav-link">
          <i class="fa fa-gamepad"></i>
          <span>代打陪玩</span>
          <i class="fa fa-chevron-right arrow"></i>
        </a>
        <ul class="submenu">
          <li data-page="boosters"><a href="/admin/boosters.html">打手管理</a></li>
          <li data-page="boost-orders"><a href="/admin/boost-orders.html">代练订单</a></li>
        </ul>
      </li>

      <li class="nav-item has-submenu" data-group="members">
        <a href="#" class="nav-link">
          <i class="fa fa-users"></i>
          <span>会员管理</span>
          <i class="fa fa-chevron-right arrow"></i>
        </a>
        <ul class="submenu">
          <li data-page="members"><a href="/admin/members.html">会员列表</a></li>
          <li data-page="member-level"><a href="/admin/member-level.html">会员等级</a></li>
        </ul>
      </li>

      <li class="nav-item has-submenu" data-group="marketing">
        <a href="#" class="nav-link">
          <i class="fa fa-tag"></i>
          <span>营销管理</span>
          <i class="fa fa-chevron-right arrow"></i>
        </a>
        <ul class="submenu">
          <li data-page="coupons"><a href="/admin/coupons.html">优惠券</a></li>
          <li data-page="messages"><a href="/admin/messages.html">用户留言</a></li>
          <li data-page="promotions"><a href="/admin/promotions.html">优惠活动</a></li>
        </ul>
      </li>

      <li class="nav-item has-submenu" data-group="system">
        <a href="#" class="nav-link">
          <i class="fa fa-cog"></i>
          <span>系统设置</span>
          <i class="fa fa-chevron-right arrow"></i>
        </a>
        <ul class="submenu">
          <li data-page="settings"><a href="/admin/settings.html">基础设置</a></li>
          <li data-page="admin-users"><a href="/admin/admin-users.html">管理员</a></li>
        </ul>
      </li>
    </ul>
  </nav>
`;

  const PAGE_GROUP_MAP = {
    "products-categories": "products",
    "boosters": "boost",
    "boost-orders": "boost",
    "orders": "orders",
    "order-pending": "orders",
    "order-processing": "orders",
    "order-completed": "orders",
    "members": "members",
    "member-level": "members",
    "coupons": "marketing",
    "messages": "marketing",
    "promotions": "marketing",
    "settings": "system",
    "admin-users": "system"
  };

  function getCurrentPage() {
    return String(window.location.pathname || "")
      .split("/")
      .pop()
      .replace(".html", "");
  }

  function removePersonalCenterMenuEntry() {
    const dropdownMenu = document.getElementById("dropdownMenu");
    if (!dropdownMenu) return;

    dropdownMenu.querySelectorAll("a").forEach(function (link) {
      const label = String(link.textContent || "").replace(/\s+/g, "");
      const href = String(link.getAttribute("href") || "").toLowerCase();
      if (label.includes("个人中心") || href.includes("admin-profile")) {
        link.remove();
      }
    });
  }

  function initSidebar() {
    removePersonalCenterMenuEntry();

    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;

    sidebar.innerHTML = SIDEBAR_HTML;

    const fileName = getCurrentPage();
    const currentLink = sidebar.querySelector(`[data-page="${fileName}"] a`);
    if (currentLink) {
      currentLink.classList.add("active");
    }

    if (fileName === "index") {
      const indexLink = sidebar.querySelector('[data-page="index"] a');
      if (indexLink) indexLink.classList.add("active");
    }

    const group = PAGE_GROUP_MAP[fileName];
    if (group) {
      const groupItem = sidebar.querySelector(`[data-group="${group}"]`);
      if (groupItem) {
        groupItem.classList.add("open");
        const submenu = groupItem.querySelector(".submenu");
        if (submenu) submenu.style.maxHeight = "300px";
      }
    }

    const groups = sidebar.querySelectorAll(".has-submenu");
    groups.forEach(function (item) {
      const link = item.querySelector(".nav-link");
      if (!link) return;

      link.addEventListener("click", function (e) {
        e.preventDefault();

        groups.forEach(function (other) {
          if (other !== item && other.classList.contains("open")) {
            other.classList.remove("open");
            const sub = other.querySelector(".submenu");
            if (sub) sub.style.maxHeight = null;
          }
        });

        item.classList.toggle("open");
        const sub = item.querySelector(".submenu");
        if (sub) {
          sub.style.maxHeight = item.classList.contains("open") ? "300px" : null;
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSidebar);
  } else {
    initSidebar();
  }
})();
