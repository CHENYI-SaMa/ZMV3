const fs = require('fs');
const path = require('path');

const LEGACY_PAGES = [
  'products.html',
  'products-new.html',
  'product-add.html',
  'product-category.html',
  'shop.html',
  'all-orders.html'
];

const ignoredDirs = new Set(['node_modules', '.git', 'tmp', 'test-results', 'tools']);
const scanExts = new Set(['.html', '.js']);

function walkFiles(rootDir) {
  const files = [];

  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      if (ignoredDirs.has(name)) continue;
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (scanExts.has(path.extname(name))) {
        files.push(full);
      }
    }
  }

  walk(rootDir);
  return files;
}

function toProjectPath(absPath, rootDir) {
  return path.relative(rootDir, absPath).replace(/\\/g, '/');
}

const rootDir = process.cwd();
const files = walkFiles(rootDir);

const findings = [];
for (const absFile of files) {
  const relFile = toProjectPath(absFile, rootDir);
  const text = fs.readFileSync(absFile, 'utf8');
  const lines = text.split(/\r?\n/);

  for (const page of LEGACY_PAGES) {
    for (let i = 0; i < lines.length; i += 1) {
      if (!lines[i].includes(page)) continue;

      // Ignore self file references inside the same legacy page.
      if (relFile.endsWith(`/admin/${page}`) || relFile === `admin/${page}`) continue;

      findings.push({
        file: relFile,
        line: i + 1,
        page,
        snippet: lines[i].trim()
      });
    }
  }
}

console.log('✅ Skill 4: Legacy/Duplicate Page Detection');
console.log(`   - 冻结页候选: ${LEGACY_PAGES.join(', ')}`);

if (findings.length === 0) {
  console.log('   - 未发现活动引用命中冻结页');
} else {
  console.log(`   - 发现 ${findings.length} 处冻结页引用:`);
  for (const item of findings) {
    console.log(`   ⚠️  ${item.page} <- ${item.file}:${item.line}`);
    console.log(`      ${item.snippet}`);
  }
}

console.log('✅ 检测完成\n');
