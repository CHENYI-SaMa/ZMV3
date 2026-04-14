/**
 * 文件名: admin/js/admin.js
 * 文件说明: 织麦电竞 · 后台管理系统 JavaScript
 * 功能描述:
 *   - 侧边栏展开/收起控制
 *   - 子菜单交互
 *   - 数据表格操作
 *   - 弹窗/模态框控制
 *   - 图表初始化（Chart.js）
 *   - 通用工具函数
 */

document.addEventListener('DOMContentLoaded', function() {
  // 侧边栏切换
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', function() {
      sidebar.classList.toggle('collapsed');
    });
  }

  // 子菜单展开/收起
  const hasSubmenuItems = document.querySelectorAll('.has-submenu');
  
  hasSubmenuItems.forEach(item => {
    const link = item.querySelector('.nav-link');
    
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // 关闭其他已展开的菜单
      hasSubmenuItems.forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('open')) {
          otherItem.classList.remove('open');
        }
      });
      
      // 切换当前菜单
      item.classList.toggle('open');
    });
  });

  // 初始化图表
  initOrderChart();
  
  // Tab 切换
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      // 仪表盘销售趋势周期切换优先走页面专用逻辑
      if (this.dataset.period && typeof window.setDashboardPeriod === 'function') {
        window.setDashboardPeriod(this.dataset.period);
        return;
      }

      tabBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // 这里可以添加切换数据的功能
      const period = this.textContent;
      updateChartData(period);
    });
  });

  syncAdminHeaderIdentity();
});

function isAdminLoggedIn() {
  return localStorage.getItem('zhimai_admin_logged_in') === 'true';
}

function getAdminProfile() {
  const sessionAdmin = JSON.parse(localStorage.getItem('zhimai_admin_user') || 'null');
  if (sessionAdmin && typeof sessionAdmin === 'object') {
    return sessionAdmin;
  }

  const legacyAdmin = JSON.parse(localStorage.getItem('zhimai_admin') || 'null');
  if (legacyAdmin && typeof legacyAdmin === 'object') {
    return legacyAdmin;
  }

  return null;
}

function ensureAdminAuth() {
  if (!isAdminLoggedIn()) {
    window.location.href = '/admin/login.html';
    return false;
  }

  return true;
}

function adminLogout() {
  localStorage.removeItem('zhimai_admin_token');
  localStorage.removeItem('zhimai_admin_logged_in');
  localStorage.removeItem('zhimai_admin_user');

  window.location.href = '/admin/login.html';
}

function fillAdminName(selector) {
  const admin = getAdminProfile();
  const name = admin?.nickname || admin?.name || admin?.username;

  if (!name) return;

  document.querySelectorAll(selector).forEach((node) => {
    node.textContent = name;
  });
}

function resolveAdminRoleLabel(admin) {
  const rawRole = String(admin?.role || '').trim().toLowerCase();
  if (!rawRole) return '超管';

  if (['super', 'superadmin', 'super_admin', 'root', 'admin'].includes(rawRole)) return '超管';
  if (['operator', 'ops', 'operation'].includes(rawRole)) return '运营';
  if (['customer_service', 'service', 'support', 'cs'].includes(rawRole)) return '客服';

  return String(admin.role).trim() || '超管';
}

function syncAdminHeaderIdentity() {
  const admin = getAdminProfile();
  if (!admin) return;

  const displayName = String(admin.nickname || admin.name || admin.username || '').trim();
  const roleLabel = resolveAdminRoleLabel(admin);
  if (!displayName) return;

  document.querySelectorAll('.header-user-info').forEach((wrapper) => {
    const spans = wrapper.querySelectorAll('span');
    if (spans[0]) {
      spans[0].textContent = displayName;
    }
    const roleNode = wrapper.querySelector('.header-user-role') || spans[1];
    if (roleNode) {
      roleNode.textContent = roleLabel;
    }
  });

  document.querySelectorAll('.user-name, #adminName, #adminUserName').forEach((node) => {
    node.textContent = displayName;
  });

  document.querySelectorAll('.header-user-role, #adminUserRole').forEach((node) => {
    node.textContent = roleLabel;
  });
}

// 初始化订单统计图表
function initOrderChart() {
  const ctx = document.getElementById('orderChart');
  
  if (!ctx) return;
  
  // 生成近30天的日期
  const dates = [];
  const amounts = [];
  const counts = [];
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push((date.getMonth() + 1) + '-' + date.getDate());
    
    // 模拟数据
    if (i === 25) {
      amounts.push(0.01);
      counts.push(1);
    } else {
      amounts.push(0);
      counts.push(0);
    }
  }
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dates,
      datasets: [
        {
          label: '订单金额',
          data: amounts,
          backgroundColor: '#1890ff',
          borderColor: '#1890ff',
          borderWidth: 1,
          yAxisID: 'y'
        },
        {
          label: '订单数',
          data: counts,
          type: 'line',
          borderColor: '#52c41a',
          backgroundColor: 'rgba(82, 196, 26, 0.1)',
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#52c41a',
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: 12,
          cornerRadius: 4,
          displayColors: true
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 11
            },
            maxRotation: 45
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: '金额'
          },
          grid: {
            color: '#f0f0f0'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: '数量'
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    }
  });
}

// 更新图表数据
function updateChartData(period) {
  // 这里可以根据选择的时间段重新加载数据
  console.log('切换时间段:', period);
}

// 表格全选功能
function initTableSelect() {
  const selectAllCheckbox = document.getElementById('selectAll');
  const rowCheckboxes = document.querySelectorAll('.row-checkbox');
  
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', function() {
      rowCheckboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
      });
    });
  }
}

// 确认删除
function confirmDelete(message) {
  return confirm(message || '确定要删除吗？此操作不可恢复。');
}

// 显示提示消息
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// 表单验证
function validateForm(form) {
  const requiredFields = form.querySelectorAll('[required]');
  let isValid = true;
  
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      isValid = false;
      field.classList.add('error');
    } else {
      field.classList.remove('error');
    }
  });
  
  return isValid;
}

// 搜索功能
function initSearch(inputSelector, tableSelector) {
  const searchInput = document.querySelector(inputSelector);
  const table = document.querySelector(tableSelector);
  
  if (searchInput && table) {
    searchInput.addEventListener('input', function() {
      const keyword = this.value.toLowerCase();
      const rows = table.querySelectorAll('tbody tr');
      
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(keyword) ? '' : 'none';
      });
    });
  }
}
