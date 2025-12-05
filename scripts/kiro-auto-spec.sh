#!/bin/bash
################################################################################
# Kiro Spec 全自動パイプラインスクリプト
#
# 機能: requirements.md から実装開始まで全工程を自動実行
#   1. /kiro:spec-requirements - 要件定義の詳細化
#   2. /kiro:spec-design -y - 設計の詳細化（自動承認）
#   3. /kiro:spec-tasks -y - タスク分解（自動承認）
#   4. spec.json 承認フラグ更新
#   5. コミット（normalize前に成果物を保存）
#   6. normalize-tasks.sh - タスク形式の正規化
#   7. kiro-parallel-impl.sh - 実装の開始
#
# 前提条件:
#   - jq がインストールされていること
#   - .kiro/specs/<spec-name>/ が存在すること
#   - requirements.md にメモが記載されていること
#
# 使い方:
#   ./scripts/kiro-auto-spec.sh <spec-name>
#   例: ./scripts/kiro-auto-spec.sh single-channel-support
################################################################################

set -euo pipefail

# ============================================================================
# 設定
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SPECS_DIR="${PROJECT_DIR}/.kiro/specs"

# spec 関連のグローバル変数
SPEC_NAME=""
SPEC_DIR=""

# ============================================================================
# 使い方表示
# ============================================================================

usage() {
    echo "Usage: $0 <spec-name>"
    echo ""
    echo "Arguments:"
    echo "  spec-name    Name of the specification (e.g., single-channel-support)"
    echo ""
    echo "Description:"
    echo "  Runs the full Kiro spec pipeline automatically:"
    echo "    1. Generate requirements"
    echo "    2. Generate design (auto-approve)"
    echo "    3. Generate tasks (auto-approve)"
    echo "    4. Update spec.json approvals"
    echo "    5. Commit spec artifacts"
    echo "    6. Normalize tasks"
    echo "    7. Start parallel implementation"
    echo ""
    echo "Examples:"
    echo "  $0 single-channel-support"
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
# フェーズログ出力
# ============================================================================

log_phase() {
    local phase_num=$1
    local phase_name=$2
    echo ""
    echo "========================================"
    echo "Phase $phase_num: $phase_name"
    echo "========================================"
}

# ============================================================================
# spec.json を jq で更新（全承認フラグを true に）
# ============================================================================

update_spec_json() {
    local spec_file="$1"

    echo "Updating: $spec_file"

    jq '.approvals.requirements.generated = true |
        .approvals.requirements.approved = true |
        .approvals.design.generated = true |
        .approvals.design.approved = true |
        .approvals.tasks.generated = true |
        .approvals.tasks.approved = true |
        .ready_for_implementation = true |
        .phase = "ready"' "$spec_file" > "${spec_file}.tmp" && mv "${spec_file}.tmp" "$spec_file"

    echo "All approval flags set to true"
    echo "ready_for_implementation = true"
}

# ============================================================================
# バリデーション
# ============================================================================

validate_prerequisites() {
    # jq 存在確認
    if ! command -v jq &> /dev/null; then
        error_exit "jq is required. Install with: brew install jq"
    fi

    # claude コマンド存在確認
    if ! command -v claude &> /dev/null; then
        error_exit "claude CLI is required. Install Claude Code first."
    fi

    # spec ディレクトリ確認
    if [ ! -d "$SPEC_DIR" ]; then
        error_exit "Spec directory not found: $SPEC_DIR"
    fi

    # spec.json 確認
    if [ ! -f "${SPEC_DIR}/spec.json" ]; then
        error_exit "spec.json not found. Run '/kiro:spec-init' first."
    fi

    # requirements.md 確認
    if [ ! -f "${SPEC_DIR}/requirements.md" ]; then
        error_exit "requirements.md not found at ${SPEC_DIR}/requirements.md"
    fi

    echo "Prerequisites validated:"
    echo "  - jq: OK"
    echo "  - claude CLI: OK"
    echo "  - Spec directory: OK"
    echo "  - spec.json: OK"
    echo "  - requirements.md: OK"
}

# ============================================================================
# シグナルハンドラー（Ctrl+C 対応）
# ============================================================================

cleanup() {
    echo ""
    echo "Interrupted by user (Ctrl+C)"
    echo "Current progress can be checked in:"
    echo "  - ${SPEC_DIR}/spec.json"
    exit 130
}

trap cleanup SIGINT SIGTERM

# ============================================================================
# メイン処理
# ============================================================================

main() {
    # 引数チェック
    if [ $# -lt 1 ]; then
        usage
    fi

    SPEC_NAME="$1"
    SPEC_DIR="${SPECS_DIR}/${SPEC_NAME}"

    echo "========================================"
    echo "Kiro Auto-Spec Pipeline"
    echo "========================================"
    echo "Spec: $SPEC_NAME"
    echo "Directory: $SPEC_DIR"
    echo ""

    # 前提条件チェック
    validate_prerequisites

    # Phase 1: Requirements
    log_phase 1 "Generating requirements"
    claude -p "/kiro:spec-requirements $SPEC_NAME" --dangerously-skip-permissions

    # Phase 2: Design
    log_phase 2 "Generating design"
    claude -p "/kiro:spec-design $SPEC_NAME -y" --dangerously-skip-permissions

    # Phase 3: Tasks
    log_phase 3 "Generating tasks"
    claude -p "/kiro:spec-tasks $SPEC_NAME -y" --dangerously-skip-permissions

    # Phase 4: Update spec.json
    log_phase 4 "Updating spec.json approvals"
    update_spec_json "${SPEC_DIR}/spec.json"

    # Phase 5: Commit before normalize
    log_phase 5 "Committing spec artifacts"
    claude -p '未コミットの内容をコミットする' --model haiku --dangerously-skip-permissions

    # Phase 6: Normalize tasks
    log_phase 6 "Normalizing tasks"
    "${SCRIPT_DIR}/normalize-tasks.sh" "$SPEC_NAME"

    # Phase 7: Start implementation
    log_phase 7 "Starting implementation"
    "${SCRIPT_DIR}/kiro-parallel-impl.sh" "$SPEC_NAME" --no-confirm

    echo ""
    echo "========================================"
    echo "Pipeline completed successfully!"
    echo "========================================"
}

main "$@"
