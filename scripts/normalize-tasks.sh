#!/bin/bash
################################################################################
# Kiro Spec タスク正規化スクリプト
#
# 機能: tasks.md の親タスク形式を正規化
#   1. 子タスクがない親タスク（例: "10."）を "10.1" 形式に変換
#   2. 子タスクが存在する親タスク行を削除
#
# 使い方:
#   ./scripts/normalize-tasks.sh <spec-name>
#   例: ./scripts/normalize-tasks.sh remove-episode-prefix
################################################################################

set -euo pipefail

# ============================================================================
# 設定
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SPECS_DIR="${PROJECT_DIR}/.kiro/specs"

# ============================================================================
# 使い方表示
# ============================================================================

usage() {
    echo "Usage: $0 <spec-name>"
    echo ""
    echo "Arguments:"
    echo "  spec-name    Name of the specification (e.g., remove-episode-prefix)"
    echo ""
    echo "Examples:"
    echo "  $0 remove-episode-prefix"
    exit 1
}

# ============================================================================
# エラー終了
# ============================================================================

error_exit() {
    echo "ERROR: $1"
    exit 1
}

# ============================================================================
# 引数チェック
# ============================================================================

if [ $# -lt 1 ]; then
    usage
fi

SPEC_NAME="$1"
SPEC_DIR="${SPECS_DIR}/${SPEC_NAME}"
TASKS_FILE="${SPEC_DIR}/tasks.md"

# ============================================================================
# バリデーション
# ============================================================================

if [ ! -d "$SPEC_DIR" ]; then
    error_exit "Spec directory not found: $SPEC_DIR"
fi

if [ ! -f "$TASKS_FILE" ]; then
    error_exit "Tasks file not found: $TASKS_FILE"
fi

# ============================================================================
# 親タスク番号を収集
# ============================================================================

collect_parent_numbers() {
    # 親タスク行のパターン: "- [ ] X. " または "- [x] X. " (数字+ピリオド+スペース)
    # サブタスク行のパターン: "- [ ] X.Y " (数字+ピリオド+数字)
    grep -E '^- \[[ x]\] [0-9]+\.' "$TASKS_FILE" | \
        sed -E 's/^- \[[ x]\] ([0-9]+)\..*/\1/' | \
        sort -u
}

# ============================================================================
# 特定の親番号に子タスクが存在するか確認
# ============================================================================

has_subtasks() {
    local parent_num=$1
    # X.Y 形式の行が存在するかチェック（Y は数字）
    grep -qE "^- \[[ x]\] ${parent_num}\.[0-9]+" "$TASKS_FILE"
}

# ============================================================================
# 親タスク行かどうか判定（X. 形式で、X.Y 形式ではない）
# ============================================================================

is_parent_task_line() {
    local line="$1"
    # "- [ ] X. テキスト" または "- [x] X. テキスト" の形式
    # X.Y 形式（サブタスク）は除外するため、ピリオドの後が数字でないことを確認
    if echo "$line" | grep -qE '^- \[[ x]\] [0-9]+\.[0-9]'; then
        # X.Y 形式はサブタスクなので親タスクではない
        return 1
    fi
    # X. 形式（ピリオドの後が数字以外）であれば親タスク
    echo "$line" | grep -qE '^- \[[ x]\] [0-9]+\. '
}

# ============================================================================
# メイン処理
# ============================================================================

normalize_tasks() {
    echo "Normalizing tasks in: $TASKS_FILE"
    echo ""

    # 一時ファイルを作成
    local temp_file=$(mktemp)
    trap "rm -f $temp_file" EXIT

    local converted=0
    local deleted=0

    # 行ごとに処理
    while IFS= read -r line || [ -n "$line" ]; do
        # 親タスク行かどうか判定
        if is_parent_task_line "$line"; then
            # 親タスク番号を抽出（-Eで拡張正規表現を使用）
            local parent_num=$(echo "$line" | sed -E 's/^- \[[ x]\] ([0-9]+)\..*/\1/')

            if has_subtasks "$parent_num"; then
                # 子タスクが存在 → 親タスク行を削除
                echo "  Deleting: $line"
                deleted=$((deleted + 1))
                continue
            else
                # 子タスクが存在しない → X.1 形式に変換
                # "- [ ] X. タイトル" → "- [ ] X.1 タイトル"
                local new_line=$(echo "$line" | sed -E "s/^(- \[[ x]\] ${parent_num})\. /\1.1 /")
                echo "  Converting: $line"
                echo "          →: $new_line"
                echo "$new_line" >> "$temp_file"
                converted=$((converted + 1))
                continue
            fi
        fi

        # 親タスク行でない場合はそのまま出力
        echo "$line" >> "$temp_file"
    done < "$TASKS_FILE"

    # 変更があれば上書き
    if [ $converted -gt 0 ] || [ $deleted -gt 0 ]; then
        cp "$temp_file" "$TASKS_FILE"
        echo ""
        echo "Summary:"
        echo "  Converted: $converted parent task(s) to X.1 format"
        echo "  Deleted: $deleted parent task header(s)"
    else
        echo "No changes needed."
    fi
}

# ============================================================================
# 実行
# ============================================================================

normalize_tasks
