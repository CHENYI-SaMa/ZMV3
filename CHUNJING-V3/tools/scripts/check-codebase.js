const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

function safeExec(command) {
  try {
    return execSync(command, { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' }).trim();
  } catch (_) {
    return null;
  }
}

function countSourceFiles(root) {
  const exts = new Set(['.html', '.js', '.css']);
  const ignored = new Set(['node_modules', '.git', 'tmp', 'test-results']);
  let count = 0;

  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      if (ignored.has(name)) continue;
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (exts.has(path.extname(name))) {
        count += 1;
      }
    }
  }

  walk(root);
  return count;
}

console.log('✅ Skill 1: Codebase Mapping');

const gitAvailable = safeExec('git --version');
if (gitAvailable) {
  const commitCount = safeExec('git rev-list --count HEAD');
  const shortlog = safeExec('git shortlog -s -n --all');

  console.log(`   - Git 环境: ${gitAvailable}`);
  if (commitCount) {
    console.log(`   - 提交总数: ${commitCount}`);
  }

  if (shortlog) {
    const topContributors = shortlog
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(0, 3)
      .map((line) => line.trim().replace(/^\d+\s+/, ''));
    if (topContributors.length > 0) {
      console.log(`   - Top 贡献者: ${topContributors.join(', ')}`);
    }
  }
} else {
  const fileCount = countSourceFiles(process.cwd());
  console.log('   - Git 不可用，使用静态代码规模作为替代指标');
  console.log(`   - 源码文件数(HTML/JS/CSS): ${fileCount}`);
}

console.log('✅ 分析完成\n');
