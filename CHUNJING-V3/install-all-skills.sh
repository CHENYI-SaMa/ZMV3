#!/usr/bin/env bash

# ZhiMai Esports project - auto install 8 skills dependencies
# Usage: bash install-all-skills.sh

set -euo pipefail

echo "=========================================="
echo "Start installing dependencies for 8 skills"
echo "=========================================="
echo ""

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_DIR="${PROJECT_ROOT}/skills"
TOOLS_DIR="${PROJECT_ROOT}/tools"

mkdir -p "$SKILLS_DIR"
mkdir -p "$TOOLS_DIR"

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm not found. Please install Node.js first."
  exit 1
fi

if [ ! -f "${PROJECT_ROOT}/package.json" ]; then
  echo "INFO: package.json not found, running npm init -y ..."
  npm init -y >/dev/null
fi

install_global() {
  local pkg="$1"
  npm install -g "$pkg" 2>/dev/null || {
    echo "WARN: global install failed for ${pkg}, skipped."
    return 0
  }
}

install_dev() {
  npm install --save-dev "$@"
}

install_prod() {
  npm install "$@"
}

# ============================================
# Skill 1: Codebase Mapping
# ============================================
echo "[1/8] Install Codebase Mapping..."
install_global reposense
echo "OK: Skill 1 done"
echo ""

# ============================================
# Skill 2: Schema Compatibility Analysis
# ============================================
echo "[2/8] Install Schema Compatibility Analysis..."
install_dev ajv
echo "OK: Skill 2 done"
echo ""

# ============================================
# Skill 3: Controlled Refactor Planning
# ============================================
echo "[3/8] Install Controlled Refactor Planning..."
install_global prettier
install_global eslint
install_global jscodeshift
install_dev prettier eslint
echo "OK: Skill 3 done"
echo ""

# ============================================
# Skill 4: Legacy/Duplicate Page Detection
# ============================================
echo "[4/8] Install Duplicate Page Detection..."
install_prod cheerio axios
echo "INFO: crypto is built into Node.js, no install needed."
echo "OK: Skill 4 done"
echo ""

# ============================================
# Skill 5: Encoding/Mojibake Repair
# ============================================
echo "[5/8] Install Encoding Repair..."
install_prod iconv-lite chardet
echo "OK: Skill 5 done"
echo ""

# ============================================
# Skill 6: Frontend Security Triage
# ============================================
echo "[6/8] Install Frontend Security Triage..."
install_dev eslint-plugin-security
install_prod dompurify
echo "OK: Skill 6 done"
echo ""

# ============================================
# Skill 7: UI Consistency Audit
# ============================================
echo "[7/8] Install UI Consistency Audit..."
install_dev stylelint stylelint-config-standard
echo "OK: Skill 7 done"
echo ""

# ============================================
# Skill 8: Implementation Boundary Guard
# ============================================
echo "[8/8] Install Implementation Boundary Guard..."
install_global dependency-cruiser
install_dev dependency-cruiser
echo "OK: Skill 8 done"
echo ""

echo "=========================================="
echo "All skill dependencies installed"
echo "=========================================="
echo ""
echo "Next:"
echo "  - Run checks: npm run skills:check"
echo "  - Generate report: npm run skills:report"
echo ""
