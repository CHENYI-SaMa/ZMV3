const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('✅ Skill 5: Encoding/Mojibake Repair');
console.log('   - 扫描关键文件编码/乱码风险...');

const TARGET_FILES = [
  'services.html',
  'order.html',
  'payment.html',
  'admin/index.html',
  'admin/orders.html',
  'admin/order-pending.html',
  'admin/order-processing.html',
  'admin/order-completed.html',
  'admin/boosters.html',
  'admin/products-categories.html',
  'admin/js/sidebar.js',
  'js/data.js',
  'js/cloudbase.js',
  'js/payment-password.js'
];

// 常见 UTF-8/GBK 误解码片段（用于预警，不作为强制错误）
const MOJIBAKE_TOKENS = [
  '鏂囦欢',
  '缁囬害',
  '鐢电珵',
  '浠ｇ粌',
  '鏀粯',
  '鏈嶅姟',
  '鍏ㄩ儴',
  '璁㈠崟',
  '鏃犵晱',
  '娴嬭瘯',
  '鍒嗙被'
];

const BROKEN_TAG_REGEX = /(?<!<)\/(span|div|th|td|tr|option|a|h[1-6]|p|button)>/i;

const errors = [];
const warnings = [];

for (const relPath of TARGET_FILES) {
  if (!fs.existsSync(relPath)) {
    warnings.push(`[SKIP] ${relPath} 不存在，跳过`);
    continue;
  }

  const content = fs.readFileSync(relPath, 'utf8');
  const lines = content.split(/\r?\n/);

  if (content.includes('\uFFFD')) {
    errors.push(`[ERROR] ${relPath} 包含 U+FFFD（�），存在高风险编码损坏`);
  }

  let brokenTagLine = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (BROKEN_TAG_REGEX.test(lines[i])) {
      brokenTagLine = i + 1;
      break;
    }
  }
  if (brokenTagLine !== -1) {
    errors.push(`[ERROR] ${relPath}:${brokenTagLine} 疑似标签残片（如 /span>）`);
  }

  if (path.extname(relPath).toLowerCase() === '.js') {
    try {
      new vm.Script(content, { filename: relPath });
    } catch (err) {
      errors.push(`[ERROR] ${relPath} JS 语法异常: ${err.message}`);
    }
  }

  let tokenHits = 0;
  for (const token of MOJIBAKE_TOKENS) {
    let index = 0;
    while (index < content.length) {
      const found = content.indexOf(token, index);
      if (found === -1) break;
      tokenHits += 1;
      index = found + token.length;
    }
  }

  if (tokenHits > 0) {
    warnings.push(`[WARN] ${relPath} 命中 ${tokenHits} 处常见乱码片段（建议后续清理文案）`);
  }
}

for (const line of warnings) {
  console.log(`   ${line}`);
}
for (const line of errors) {
  console.log(`   ${line}`);
}

if (errors.length > 0) {
  console.log(`❌ 编码检查失败：${errors.length} 个错误，${warnings.length} 个警告\n`);
  process.exit(1);
}

if (warnings.length > 0) {
  console.log(`⚠️ 编码检查通过（含警告）：0 错误，${warnings.length} 个警告\n`);
} else {
  console.log('✅ 编码检查完成：0 错误，0 警告\n');
}
