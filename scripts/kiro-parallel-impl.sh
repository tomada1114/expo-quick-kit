#!/bin/bash
################################################################################
# Kiro Spec 並列実装スクリプト
#
# 機能: .kiro/specs/<spec-name>/tasks.md を解析し、未完了タスクを実行
#   - (P) マーカー付きタスクは同じ親番号グループで並列実行
#   - (P) なしのタスクは順次実行
#   - 各グループ完了後にコミット
#
# 前提条件:
#   - .kiro/specs/<spec-name>/spec.json の ready_for_implementation が true
#   - tasks.md が存在し、X.Y 形式のサブタスクがある
#   - normalize-tasks.sh で事前に正規化推奨
#
# 使い方:
#   ./scripts/kiro-parallel-impl.sh <spec-name> [--no-confirm]
#   例: ./scripts/kiro-parallel-impl.sh remove-episode-prefix
#   例: ./scripts/kiro-parallel-impl.sh remove-episode-prefix --no-confirm
################################################################################

set -euo pipefail

# ============================================================================
# 設定
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SPECS_DIR="${PROJECT_DIR}/.kiro/specs"
MAX_ITERATIONS=100

# spec 関連のグローバル変数
SPEC_NAME=""
SPEC_DIR=""
TASKS_FILE=""
NO_CONFIRM=false

# ============================================================================
# 使い方表示
# ============================================================================

usage() {
    echo "Usage: $0 <spec-name> [--no-confirm]"
    echo ""
    echo "Arguments:"
    echo "  spec-name       Name of the specification (e.g., remove-episode-prefix)"
    echo "  --no-confirm    Skip confirmation prompt (for automated pipelines)"
    echo ""
    echo "Examples:"
    echo "  $0 remove-episode-prefix"
    echo "  $0 remove-episode-prefix --no-confirm"
    exit 1
}

# ============================================================================
# シグナルハンドラー（Ctrl+C 対応）
# ============================================================================

cleanup() {
    echo ""
    echo "Interrupted by user (Ctrl+C)"
    # 並列実行中のジョブがあれば終了
    jobs -p | xargs -r kill 2>/dev/null || true
    exit 130
}

trap cleanup SIGINT SIGTERM

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

# --no-confirm オプションのパース
if [ "${2:-}" = "--no-confirm" ]; then
    NO_CONFIRM=true
fi

SPEC_DIR="${SPECS_DIR}/${SPEC_NAME}"
TASKS_FILE="${SPEC_DIR}/tasks.md"

# ============================================================================
# 仕様バリデーション
# ============================================================================

validate_spec() {
    if [ ! -d "$SPEC_DIR" ]; then
        error_exit "Spec directory not found: $SPEC_DIR"
    fi

    local spec_file="${SPEC_DIR}/spec.json"

    if [ ! -f "$spec_file" ]; then
        error_exit "spec.json not found at $spec_file"
    fi

    # ready_for_implementation チェック
    local ready="false"
    if command -v jq &> /dev/null; then
        ready=$(jq -r '.ready_for_implementation // false' "$spec_file")
    else
        if grep -q '"ready_for_implementation"[[:space:]]*:[[:space:]]*true' "$spec_file"; then
            ready="true"
        fi
    fi

    if [ "$ready" != "true" ]; then
        error_exit "Spec '$SPEC_NAME' is not ready for implementation (ready_for_implementation != true)"
    fi

    echo "Spec validation passed: ready_for_implementation = true"
}

# ============================================================================
# タスクファイル存在チェック
# ============================================================================

validate_tasks_file() {
    if [ ! -f "$TASKS_FILE" ]; then
        error_exit "Tasks file not found: $TASKS_FILE"
    fi

    echo "Tasks file found: $TASKS_FILE"
}

# ============================================================================
# 未完了タスクチェック（X.Y 形式のみ）
# ============================================================================

has_pending_tasks() {
    # "- [ ]" の後に "X.Y" 形式が続く行をカウント（未完了サブタスク）
    local count=$(grep -c '^- \[ \] [0-9]\+\.[0-9]' "$TASKS_FILE" 2>/dev/null || echo "0")

    if [ "$count" -gt 0 ]; then
        return 0  # 未完了タスクあり
    else
        return 1  # 未完了タスクなし
    fi
}

# ============================================================================
# 未完了タスク数を取得
# ============================================================================

get_pending_task_count() {
    grep -c '^- \[ \] [0-9]\+\.[0-9]' "$TASKS_FILE" 2>/dev/null || echo "0"
}

# ============================================================================
# 次に実行すべきタスクグループを取得
# 返り値: タスク番号のスペース区切りリスト
# 例: "8.1 8.2 8.3" (並列) または "9.1" (単独)
# ============================================================================

get_next_task_group() {
    # 最初の未完了サブタスク行を取得
    local first_pending=$(grep -m1 '^- \[ \] [0-9]\+\.[0-9]' "$TASKS_FILE")

    if [ -z "$first_pending" ]; then
        return
    fi

    # タスク番号を抽出（例: "8.1"）- macOS互換のため -E を使用
    local task_num=$(echo "$first_pending" | sed -E 's/^- \[ \] ([0-9]+\.[0-9]+).*/\1/')

    # 親番号を抽出（例: "8"）
    local parent_num=$(echo "$task_num" | cut -d. -f1)

    # (P) マーカーの有無を確認
    if echo "$first_pending" | grep -q '(P)'; then
        # 同じ親番号の (P) 付き未完了タスクをすべて取得
        grep "^- \[ \] ${parent_num}\.[0-9]\+.*(P)" "$TASKS_FILE" | \
            sed -E 's/^- \[ \] ([0-9]+\.[0-9]+).*/\1/' | \
            tr '\n' ' ' | \
            sed 's/ $//'
    else
        # 単独タスク
        echo "$task_num"
    fi
}

# ============================================================================
# 単独タスク実行
# ============================================================================

run_single_impl() {
    local task_num=$1
    local iteration=$2

    echo ""
    echo "=== Iteration $iteration: Running /kiro:spec-impl $SPEC_NAME $task_num ==="

    if ! claude -p "/kiro:spec-impl $SPEC_NAME $task_num" --dangerously-skip-permissions; then
        echo "ERROR: Task $task_num failed"
        return 1
    fi

    echo "Task $task_num completed successfully"
    return 0
}

# ============================================================================
# 並列タスク実行
# ============================================================================

run_parallel_impl() {
    local tasks=("$@")
    local pids=()
    local failed=0

    echo ""
    echo "=== Starting ${#tasks[@]} parallel tasks: ${tasks[*]} ==="

    # 各タスクをバックグラウンドで実行
    for task in "${tasks[@]}"; do
        echo "  Starting task $task in background..."
        claude -p "/kiro:spec-impl $SPEC_NAME $task" --dangerously-skip-permissions &
        pids+=($!)
    done

    echo ""
    echo "Waiting for all tasks to complete..."

    # 全プロセスの完了を待機
    for i in "${!pids[@]}"; do
        if ! wait ${pids[$i]}; then
            echo "ERROR: Task ${tasks[$i]} (PID: ${pids[$i]}) failed"
            failed=1
        else
            echo "  Task ${tasks[$i]} completed"
        fi
    done

    if [ $failed -eq 1 ]; then
        echo "ERROR: One or more parallel tasks failed"
        return 1
    fi

    echo "All parallel tasks completed successfully"
    return 0
}

# ============================================================================
# コミット実行
# ============================================================================

run_commit() {
    local iteration=$1

    echo ""
    echo "=== Iteration $iteration: Running commit ==="

    if ! claude -p '未コミットの内容をコミットする' --model haiku --dangerously-skip-permissions; then
        echo "ERROR: Commit failed at iteration $iteration"
        return 1
    fi

    echo "Commit completed successfully"
    return 0
}

# ============================================================================
# 実行計画を表示
# ============================================================================

show_execution_plan() {
    echo "=== Execution Plan ==="
    echo "Spec: $SPEC_NAME"
    echo ""

    local total=$(get_pending_task_count)
    echo "Pending tasks: $total"
    echo ""

    # tasks.md を一時コピーして処理
    local temp_tasks=$(mktemp)
    cp "$TASKS_FILE" "$temp_tasks"

    local iteration=0

    while grep -q '^- \[ \] [0-9]\+\.[0-9]' "$temp_tasks"; do
        iteration=$((iteration + 1))

        # 最初の未完了タスク
        local first=$(grep -m1 '^- \[ \] [0-9]\+\.[0-9]' "$temp_tasks")
        local task_num=$(echo "$first" | sed -E 's/^- \[ \] ([0-9]+\.[0-9]+).*/\1/')
        local parent_num=$(echo "$task_num" | cut -d. -f1)

        if echo "$first" | grep -q '(P)'; then
            # 並列タスク
            local tasks=$(grep "^- \[ \] ${parent_num}\.[0-9]\+.*(P)" "$temp_tasks" | \
                sed -E 's/^- \[ \] ([0-9]+\.[0-9]+).*/\1/' | tr '\n' ' ' | sed 's/ $//')
            echo "[$iteration] PARALLEL: $tasks"
            # 完了マーク
            for t in $tasks; do
                sed -i '' "s/^- \[ \] ${t}/- [x] ${t}/" "$temp_tasks"
            done
        else
            # 順次タスク
            echo "[$iteration] SINGLE:   $task_num"
            sed -i '' "s/^- \[ \] ${task_num}/- [x] ${task_num}/" "$temp_tasks"
        fi
        echo "    → commit"
    done

    rm -f "$temp_tasks"

    echo ""
    echo "Total iterations: $iteration"
}

# ============================================================================
# メインワークフロー
# ============================================================================

run_workflow() {
    echo "Starting kiro-parallel-impl workflow"
    echo "Spec: $SPEC_NAME"
    echo ""

    # 前提条件チェック
    validate_spec
    validate_tasks_file

    local iteration=0
    local initial_count=$(get_pending_task_count)

    echo ""
    echo "Initial pending tasks: $initial_count"

    # メインループ
    while has_pending_tasks; do
        iteration=$((iteration + 1))

        # 無限ループ防止
        if [ $iteration -gt $MAX_ITERATIONS ]; then
            error_exit "Maximum iterations ($MAX_ITERATIONS) reached. Stopping."
        fi

        local remaining=$(get_pending_task_count)
        echo ""
        echo "=========================================="
        echo "Iteration $iteration (remaining: $remaining tasks)"
        echo "=========================================="

        # 次に実行すべきタスクグループを取得
        local task_group=$(get_next_task_group)

        if [ -z "$task_group" ]; then
            error_exit "No tasks found but pending tasks exist"
        fi

        # タスク数を確認して実行方法を決定
        local task_array=($task_group)
        local task_count=${#task_array[@]}

        echo "Tasks to execute: $task_group"

        if [ $task_count -eq 1 ]; then
            # 単独タスク実行
            if ! run_single_impl "${task_array[0]}" "$iteration"; then
                error_exit "Task failed. Manual intervention required."
            fi
        else
            # 並列タスク実行
            if ! run_parallel_impl "${task_array[@]}"; then
                error_exit "Parallel tasks failed. Manual intervention required."
            fi
        fi

        # コミット実行
        if ! run_commit "$iteration"; then
            error_exit "Commit failed. Manual intervention required."
        fi

        # API制限対策で少し待機
        sleep 3
    done

    echo ""
    echo "=========================================="
    echo "All tasks completed!"
    echo "Total iterations: $iteration"
    echo "=========================================="
}

# ============================================================================
# メイン処理
# ============================================================================

main() {
    # 前提条件チェック
    validate_spec
    validate_tasks_file

    # 実行計画を表示
    show_execution_plan

    # 確認プロンプト（--no-confirm が指定されている場合はスキップ）
    if [ "$NO_CONFIRM" = false ]; then
        echo ""
        read -p "Proceed? [y/N]: " answer
        if [[ ! "$answer" =~ ^[Yy]$ ]]; then
            echo "Aborted."
            exit 0
        fi
    else
        echo ""
        echo "Auto-confirm mode: Proceeding without confirmation"
    fi

    echo ""
    run_workflow
}

main "$@"
