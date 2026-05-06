#!/bin/bash

# =============================================================================
# Aspen 多租户初始化脚本 (init-tenant.sh)
#
# 用途: 初始化新租户的完整环境，包括数据库、存储和配置
#
# 使用方法:
#   ./scripts/init-tenant.sh <租户ID> <品牌名称> [模板租户ID]
#
# 示例:
#   ./scripts/init-tenant.sh mycafe "我的咖啡馆" aspen
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
API_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MP_DIR="$(dirname "$API_DIR")/aspen-mp"
ADMIN_DIR="$(dirname "$API_DIR")/aspen-admin"

# 解析参数
TENANT_ID="${1:-}"
BRAND_NAME="${2:-}"
TEMPLATE="${3:-aspen}"

# 打印标题
print_header() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║         🌲 Aspen 多租户初始化脚本 v1.0                    ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 打印步骤
print_step() {
    echo -e "${GREEN}📋 步骤 $1: $2${NC}"
}

# 打印成功
print_success() {
    echo -e "   ${GREEN}✅ $1${NC}"
}

# 打印错误
print_error() {
    echo -e "   ${RED}❌ $1${NC}"
}

# 打印警告
print_warning() {
    echo -e "   ${YELLOW}⚠️  $1${NC}"
}

# 检查依赖
check_dependencies() {
    print_step "1" "检查依赖..."

    # 检查 Bun
    if ! command -v bun &> /dev/null; then
        print_error "Bun 未安装。请先安装: https://bun.sh"
        exit 1
    fi
    print_success "Bun 已安装: $(bun --version)"

    # 检查 Node.js (for admin)
    if ! command -v node &> /dev/null; then
        print_warning "Node.js 未安装，管理后台将无法运行"
    else
        print_success "Node.js 已安装: $(node --version)"
    fi

    # 检查目录
    if [ ! -d "$API_DIR" ]; then
        print_error "API 目录不存在: $API_DIR"
        exit 1
    fi
    print_success "项目目录存在"
}

# 验证参数
validate_args() {
    print_step "2" "验证参数..."

    if [ -z "$TENANT_ID" ] || [ -z "$BRAND_NAME" ]; then
        echo -e "${RED}用法: $0 <租户ID> <品牌名称> [模板租户ID]${NC}"
        echo ""
        echo "示例:"
        echo "  $0 mycafe \"我的咖啡馆\" aspen"
        echo "  $0 myrestaurant \"我的餐厅\" volcano"
        exit 1
    fi

    # 验证租户 ID 格式 (小写字母、数字、下划线)
    if ! [[ "$TENANT_ID" =~ ^[a-z0-9_]+$ ]]; then
        print_error "租户 ID 只能包含小写字母、数字和下划线"
        exit 1
    fi

    print_success "参数验证通过"
    echo "   租户 ID: $TENANT_ID"
    echo "   品牌名称: $BRAND_NAME"
    echo "   模板租户: $TEMPLATE"
}

# 初始化 API 服务
init_api() {
    print_step "3" "初始化 API 服务..."

    cd "$API_DIR"

    # 安装依赖
    if [ ! -d "node_modules" ]; then
        echo "   📦 安装 API 依赖..."
        bun install
    fi

    # 运行租户复制脚本
    echo "   🔄 执行租户复制..."
    bun run scripts/copy-tenant.ts "$TENANT_ID" "$BRAND_NAME" "$TEMPLATE"

    print_success "API 服务初始化完成"
}

# 初始化小程序
init_mp() {
    print_step "4" "初始化小程序..."

    cd "$MP_DIR"

    # 安装依赖
    if [ ! -d "node_modules" ]; then
        echo "   📦 安装小程序依赖..."
        npm install
    fi

    # 检查主题配置
    THEME_FILE="src/themes/${TENANT_ID}.json"
    if [ -f "$THEME_FILE" ]; then
        print_success "主题配置已存在: $THEME_FILE"
    else
        print_warning "主题配置不存在: $THEME_FILE"
        echo "   将使用默认主题"
    fi

    # 检查预约配置
    CONFIG_FILE="src/configs/${TENANT_ID}.json"
    if [ -f "$CONFIG_FILE" ]; then
        print_success "预约配置已存在: $CONFIG_FILE"
    else
        print_warning "预约配置不存在: $CONFIG_FILE"
    fi

    print_success "小程序初始化完成"
}

# 初始化管理后台
init_admin() {
    print_step "5" "初始化管理后台..."

    cd "$ADMIN_DIR"

    # 安装依赖
    if [ ! -d "node_modules" ]; then
        echo "   📦 安装管理后台依赖..."
        npm install
    fi

    print_success "管理后台初始化完成"
}

# 创建数据库表
create_database() {
    print_step "6" "创建数据库表..."

    # 模拟数据库表创建
    TABLES=(
        "bookings_${TENANT_ID}"
        "menu_${TENANT_ID}"
        "members_${TENANT_ID}"
        "orders_${TENANT_ID}"
    )

    for table in "${TABLES[@]}"; do
        echo "   📝 创建表: $table"
    done

    # 如果有 Docker Compose，等待数据库就绪
    if [ -f "$(dirname "$API_DIR")/docker-compose.yml" ]; then
        echo "   📦 检测到 Docker Compose 配置"
        echo "   使用以下命令启动数据库:"
        echo "     cd $(dirname "$API_DIR") && docker-compose up -d"
    fi

    print_success "数据库表创建完成 (模拟)"
}

# 创建存储目录
create_storage() {
    print_step "7" "创建存储目录..."

    # 模拟创建 OSS 存储目录
    BUCKET="aspen-${TENANT_ID}"
    DIRS=(
        "assets/images"
        "assets/videos"
        "menu"
        "brand"
        "members"
    )

    for dir in "${DIRS[@]}"; do
        echo "   📁 创建存储路径: ${BUCKET}/${dir}"
    done

    print_success "存储目录创建完成 (模拟)"
}

# 打印完成信息
print_completion() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║         ✅ 租户初始化完成!                                  ║${NC}"
    echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║  租户信息:                                                 ║${NC}"
    printf "║    ID: %-50s║\n" "$TENANT_ID"
    printf "║    名称: %-48s║\n" "$BRAND_NAME"
    echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║  后续操作:                                                 ║${NC}"
    echo -e "${GREEN}║    1. 启动 API: cd aspen-api && bun run src/index.ts        ║${NC}"
    echo -e "${GREEN}║    2. 启动小程序: cd aspen-mp && npm run dev:mp             ║${NC}"
    echo -e "${GREEN}║    3. 启动管理后台: cd aspen-admin && npm run dev           ║${NC}"
    echo -e "${GREEN}║                                                            ║${NC}"
    echo -e "${GREEN}║  测试 API:                                                 ║${NC}"
    echo -e "${GREEN}║    curl -H \"x-tenant-id: ${TENANT_ID}\" \\                 ║${NC}"
    echo -e "${GREEN}║            http://localhost:3000/api/v1/brand              ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# 主函数
main() {
    print_header
    check_dependencies
    validate_args
    init_api
    init_mp
    init_admin
    create_database
    create_storage
    print_completion
}

# 执行主函数
main
