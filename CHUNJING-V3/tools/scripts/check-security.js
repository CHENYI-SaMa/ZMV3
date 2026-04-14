const fs = require('fs');
const path = require('path');

function readLines(file) {
  return fs.readFileSync(file, 'utf8').split(/\r?\n/);
}

const targetGroups = [
  { name: 'admin-index.html', paths: ['admin/index.html'] },
  { name: 'orders.html', paths: ['admin/orders.html', 'orders.html'] },
  { name: 'order-pending.html', paths: ['admin/order-pending.html'] },
  { name: 'order-processing.html', paths: ['admin/order-processing.html'] },
  { name: 'order-completed.html', paths: ['admin/order-completed.html'] },
  { name: 'login.html', paths: ['admin/login.html', 'login.html'] },
  { name: 'payment.html', paths: ['payment.html'] },
  { name: 'payment-password.js', paths: ['js/payment-password.js', 'payment-password.js'] },
  { name: 'cloudbase.js', paths: ['js/cloudbase.js'] },
  { name: 'data.js', paths: ['js/data.js'] }
];

const targetMap = {};
const missingTargets = [];

for (const group of targetGroups) {
  const resolved = group.paths.find((p) => fs.existsSync(p));
  if (resolved) {
    targetMap[group.name] = resolved;
  } else {
    missingTargets.push(group.name);
  }
}

const rules = [
  {
    severity: 'HIGH',
    title: 'Raw untrusted order field interpolation',
    files: ['admin-index.html', 'orders.html', 'order-pending.html', 'order-processing.html', 'order-completed.html'],
    regex: /\$\{(?:o|order|currentOrder)\.(username|userId|userPhone|contactPhone|gameAccount|contactSocial|remark|productName)\}/,
    advice: 'Render escaped safe variables (or textContent), never direct order/user fields.'
  },
  {
    severity: 'HIGH',
    title: 'Raw productImage interpolation into HTML',
    files: ['admin-index.html', 'orders.html', 'order-pending.html', 'order-processing.html', 'order-completed.html'],
    regex: /<img[^>]+src="\$\{(?:o|order|currentOrder)\.productImage/,
    advice: 'Sanitize image URL before interpolation, or build DOM nodes with property assignment.'
  },
  {
    severity: 'HIGH',
    title: 'Direct payment password write in payment flow page',
    files: ['payment.html'],
    regex: /paymentPassword\s*:\s*password/,
    advice: 'Use centralized helper setPaymentPassword(...) only.'
  },
  {
    severity: 'HIGH',
    title: 'Direct payment password compare against currentUser',
    files: ['payment.html'],
    regex: /currentUser\.paymentPassword/,
    advice: 'Use centralized helper verifyPaymentPassword(...) only.'
  },
  {
    severity: 'HIGH',
    title: 'Weak default admin credential seed',
    files: ['cloudbase.js', 'data.js', 'login.html'],
    regex: /admin123|passwordAlt|username\s*:\s*['"]admin['"]\s*,\s*password\s*:/,
    advice: 'Do not auto-seed weak default admin credentials in shared baseline.'
  },
  {
    severity: 'MEDIUM',
    title: 'innerHTML sink in sensitive pages',
    files: ['admin-index.html', 'orders.html', 'order-pending.html', 'order-processing.html', 'order-completed.html', 'login.html', 'payment.html'],
    regex: /innerHTML\s*=/,
    advice: 'Prefer textContent / DOM API for untrusted data paths.'
  },
  {
    severity: 'MEDIUM',
    title: 'Demo-only password persistence surface',
    files: ['payment-password.js', 'data.js'],
    regex: /localStorage\.(setItem|getItem)\([^)]*payment|paymentPassword/,
    advice: 'Keep demo-only marker explicit; move to backend secrets flow before production.'
  }
];

const findings = [];

for (const rule of rules) {
  for (const fileName of rule.files) {
    const filePath = targetMap[fileName];
    if (!filePath || !fs.existsSync(filePath)) continue;

    const lines = readLines(filePath);
    lines.forEach((line, index) => {
      if (rule.regex.test(line)) {
        findings.push({
          severity: rule.severity,
          title: rule.title,
          file: filePath,
          line: index + 1,
          snippet: line.trim(),
          advice: rule.advice
        });
      }
    });
  }
}

console.log('✅ Skill 6: Frontend Security Triage');
console.log('Coverage targets:');
for (const group of targetGroups) {
  const resolved = targetMap[group.name];
  console.log(`  - ${group.name}: ${resolved || '[missing]'}`);
}
if (missingTargets.length > 0) {
  console.log(`⚠️ Missing target files: ${missingTargets.join(', ')}`);
}

if (findings.length === 0) {
  console.log('No security findings in scoped checks.');
  process.exit(0);
}

for (const f of findings) {
  console.log(`[${f.severity}] ${f.title} -> ${f.file}:${f.line}`);
  console.log(`  ${f.snippet}`);
  console.log(`  Advice: ${f.advice}`);
}

const highCount = findings.filter((f) => f.severity === 'HIGH').length;
const mediumCount = findings.filter((f) => f.severity === 'MEDIUM').length;

if (highCount > 0) {
  console.log(`❌ Security gate failed: ${highCount} HIGH finding(s), ${mediumCount} MEDIUM finding(s).`);
  process.exit(1);
}

console.log(`⚠️ Security warnings: ${mediumCount} MEDIUM finding(s).`);
console.log('✅ No HIGH finding. Security gate passed.');
