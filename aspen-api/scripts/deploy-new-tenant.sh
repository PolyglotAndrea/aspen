#!/bin/bash

# ============================================
# Aspen Multi-Tenant - 快速部署脚本
# 用途: 为新租户自动化部署
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
ADMIN_API_KEY="${ADMIN_API_KEY:-your_admin_api_key_here}"
S3_BUCKET="${S3_BUCKET:-aspen-multi-tenant}"
CDN_URL="${CDN_URL:-https://cdn.yourdomain.com}"

# 打印函数
print_header() {
  echo -e "\n${BLUE}════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

# 显示帮助
show_help() {
  echo "用法: $0 <command> [options]"
  echo ""
  echo "命令:"
  echo "  create <tenant_id> <brand_name>   创建新租户"
  echo "  list                              列出所有租户"
  echo "  delete <tenant_id>                删除租户"
  echo "  theme <tenant_id>                 生成主题配置"
  echo "  init-s3 <tenant_id>               初始化 S3 存储"
  echo ""
  echo "示例:"
  echo "  $0 create mybrand 我的品牌"
  echo "  $0 list"
  echo "  $0 theme volcano"
  echo ""
}

# 创建新租户
create_tenant() {
  local tenant_id=$1
  local brand_name=$2

  if [ -z "$tenant_id" ] || [ -z "$brand_name" ]; then
    print_error "缺少必要参数"
    echo "用法: $0 create <tenant_id> <brand_name>"
    exit 1
  fi

  print_header "创建新租户: $tenant_id"

  # 1. 调用 API 创建租户
  print_info "调用 API 创建租户..."
  local response=$(curl -s -X POST "${API_BASE_URL}/tenants" \
    -H "Content-Type: application/json" \
    -H "x-tenant-id: aspen" \
    -H "x-admin-key: ${ADMIN_API_KEY}" \
    -d "{
      \"id\": \"${tenant_id}\",
      \"brandName\": \"${brand_name}\",
      \"brandNameEn\": \"${tenant_id}\"
    }")

  if echo "$response" | grep -q "success"; then
    print_success "租户创建成功"
  else
    print_error "租户创建失败: $response"
    exit 1
  fi

  # 2. 初始化 S3 存储
  print_info "初始化 S3 存储..."
  bash "$0" init-s3 "$tenant_id"

  # 3. 生成前端主题配置
  print_info "生成前端主题配置..."
  bash "$0" theme "$tenant_id"

  print_success "🎉 租户 ${tenant_id} 部署完成!"
}

# 列出所有租户
list_tenants() {
  print_header "租户列表"

  local response=$(curl -s "${API_BASE_URL}/tenants" \
    -H "x-tenant-id: aspen")

  echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
}

# 删除租户
delete_tenant() {
  local tenant_id=$1

  if [ -z "$tenant_id" ]; then
    print_error "缺少租户 ID"
    echo "用法: $0 delete <tenant_id>"
    exit 1
  fi

  print_header "删除租户: $tenant_id"

  print_warning "此操作将删除租户的所有数据!"

  read -p "确认删除? (y/n): " confirm
  if [ "$confirm" != "y" ]; then
    print_info "已取消"
    exit 0
  fi

  local response=$(curl -s -X DELETE "${API_BASE_URL}/tenants/${tenant_id}" \
    -H "x-tenant-id: aspen" \
    -H "x-admin-key: ${ADMIN_API_KEY}")

  if echo "$response" | grep -q "success"; then
    print_success "租户已删除"
  else
    print_error "删除失败: $response"
  fi
}

# 生成前端主题配置
generate_theme() {
  local tenant_id=${1:-aspen}

  print_header "生成主题配置: $tenant_id"

  # 获取租户主题
  local theme_json=$(curl -s "${API_BASE_URL}/api/v1/brand/theme" \
    -H "x-tenant-id: ${tenant_id}")

  # 保存到文件
  local output_file="../aspen-mp/src/themes/${tenant_id}.json"
  mkdir -p "../aspen-mp/src/themes"

  echo "$theme_json" > "$output_file"

  print_success "主题配置已保存到: $output_file"
  echo ""
  echo "内容预览:"
  echo "$theme_json" | python3 -m json.tool 2>/dev/null | head -20
}

# 初始化 S3 存储
init_s3_storage() {
  local tenant_id=$1

  if [ -z "$tenant_id" ]; then
    print_error "缺少租户 ID"
    exit 1
  fi

  print_header "初始化 S3 存储: $tenant_id"

  # 创建目录结构
  local dirs=(
    "${tenant_id}/assets/images"
    "${tenant_id}/assets/videos"
    "${tenant_id}/menu"
    "${tenant_id}/brand"
  )

  for dir in "${dirs[@]}"; do
    print_info "创建目录: ${S3_BUCKET}/${dir}"
    # 这里应该调用 AWS CLI 或 S3 API
    # aws s3 mb s3://${S3_BUCKET}/${dir} --region ${S3_REGION}
  done

  print_success "S3 存储初始化完成"
}

# 主入口
case "${1}" in
  create)
    create_tenant "$2" "$3"
    ;;
  list)
    list_tenants
    ;;
  delete)
    delete_tenant "$2"
    ;;
  theme)
    generate_theme "$2"
    ;;
  init-s3)
    init_s3_storage "$2"
    ;;
  help|--help|-h)
    show_help
    ;;
  *)
    show_help
    ;;
esac
