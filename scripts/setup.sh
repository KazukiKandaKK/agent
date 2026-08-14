#!/usr/bin/env bash
set -euo pipefail

echo "Agent Harness ワンタイムセットアップを開始します。"

# 前提チェック
if ! command -v node &>/dev/null; then
  echo "エラー: Node.js がインストールされていません。" >&2
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/^v//')
REQUIRED=20
MAJOR=${NODE_VERSION%%.*}
if [ "$MAJOR" -lt "$REQUIRED" ]; then
  echo "エラー: Node.js ${REQUIRED} 以上が必要です（現在: ${NODE_VERSION}）。" >&2
  exit 1
fi

if ! command -v npm &>/dev/null; then
  echo "エラー: npm が見つかりません。" >&2
  exit 1
fi

# 依存関係インストール
echo "npm install を実行します..."
npm install

# .env 準備
if [ ! -f .env ]; then
  echo ".env を .env.example から作成します。"
  cp .env.example .env
else
  echo ".env は既に存在します。"
  read -r -p "上書きしますか？ [y/N]: " overwrite
  if [[ "$overwrite" =~ ^[Yy]$ ]]; then
    cp .env.example .env
  fi
fi

# ユーザー入力
read -r -s -p "Anthropic API キーを入力してください（非表示）: " API_KEY
echo ""

read -r -p "作業ディレクトリを入力してください [./workspace]: " WORKING_DIR
WORKING_DIR=${WORKING_DIR:-./workspace}

read -r -p "使用するモデルを入力してください [claude-sonnet-4-6]: " ANTHROPIC_MODEL
ANTHROPIC_MODEL=${ANTHROPIC_MODEL:-claude-sonnet-4-6}

# .env 更新（Node.js で安全に書き換え）
export API_KEY WORKING_DIR ANTHROPIC_MODEL
node - <<'NODE'
const fs = require('fs');
const path = '.env';
let content = fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : '';

const set = (key, value) => {
  const line = `${key}=${value}`;
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('^' + escaped + '=.*$', 'gm');
  if (re.test(content)) {
    content = content.replace(re, line);
  } else {
    content += (content.endsWith('\n') ? '' : '\n') + line + '\n';
  }
};

set('ANTHROPIC_API_KEY', process.env.API_KEY || '');
set('WORKING_DIR', process.env.WORKING_DIR || './workspace');
set('ANTHROPIC_MODEL', process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6');

fs.writeFileSync(path, content.trim() + '\n');
NODE

# 作業ディレクトリ作成
mkdir -p "$WORKING_DIR"

# ビルド
echo "TypeScript をコンパイルします..."
npm run build

# テスト確認
read -r -p "テストを実行しますか？ [Y/n]: " run_tests
if [[ ! "$run_tests" =~ ^[Nn]$ ]]; then
  npm test
fi

echo ""
echo "セットアップが完了しました。"
echo "次は 'npm run start' で CLI を起動してください。"
