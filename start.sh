#!/bin/bash

# ============================================
# Aspen 全栈项目启动脚本
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         🌲 Aspen 全栈项目启动工具 v2.0                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 检查命令
check_command() {
  if ! command -v $1 &> /dev/null; then
    echo -e "${RED}✗ 需要安装: $1${NC}"
    exit 1
  fi
}

# 检查依赖
check_dependencies() {
  echo -e "${YELLOW}📋 检查依赖...${NC}"

  check_command bun
  check_command node
  check_command npm

  echo -e "${GREEN}✓ 依赖检查通过${NC}"
}

# 启动后端
start_api() {
  echo -e "${YELLOW}🚀 启动后端 API...${NC}"

  cd "$PROJECT_DIR/aspen-api"

  if [ ! -d "node_modules" ]; then
    echo "  📦 安装后端依赖..."
    bun install
  fi

  echo "  🌐 后端将在 http://localhost:3000 启动"
  echo "  📖 API 文档: http://localhost:3000/swagger"
  echo ""

  bun run src/index.ts &
  API_PID=$!

  # 等待服务启动
  echo -n "  ⏳ 等待后端启动"
  for i in {1..10}; do
    if curl -s http://localhost:3000/health &> /dev/null; then
      echo -e "\r  ✅ 后端已启动${NC}"
      break
    fi
    echo -n "."
    sleep 1
  done
  echo ""
}

# 启动小程序
start_mp() {
  echo -e "${YELLOW}🚀 启动小程序开发服务器...${NC}"

  cd "$PROJECT_DIR/aspen-mp"

  if [ ! -d "node_modules" ]; then
    echo "  📦 安装小程序依赖..."
    npm install
  fi

  echo "  🌐 小程序 H5: http://localhost:5173"
  echo "  💡 微信小程序请使用微信开发者工具打开 aspen-mp 目录"
  echo ""

  npm run dev:h5 &
  MP_PID=$!
}

# 显示帮助
show_help() {
  echo "用法: ./start.sh [选项]"
  echo ""
  echo "选项:"
  echo "  all         启动所有服务 (默认)"
  echo "  api         仅启动后端 API"
  echo "  mp          仅启动小程序"
  echo "  stop        停止所有服务"
  echo "  status      查看服务状态"
  echo "  test        测试 API 连接"
  echo "  help        显示帮助"
}

# 停止服务
stop_services() {
  echo -e "${YELLOW}🛑 停止所有服务...${NC}"

  pkill -f "bun run src/index.ts" 2>/dev/null || true
  pkill -f "vite" 2>/dev/null || true

  echo -e "${GREEN}✓ 服务已停止${NC}"
}

# 测试 API
test_api() {
  echo -e "${YELLOW}🧪 测试 API...${NC}"

  echo -n "  健康检查: "
  if curl -s http://localhost:3000/health &> /dev/null; then
    echo -e "${GREEN}✓ 通过${NC}"
  else
    echo -e "${RED}✗ 失败${NC}"
  fi

  echo -n "  品牌 API (aspen): "
  if curl -s http://localhost:3000/api/v1/brand -H "x-tenant-id: aspen" | grep -q "brandName"; then
    echo -e "${GREEN}✓ 通过${NC}"
  else
    echo -e "${RED}✗ 失败${NC}"
  fi

  echo -n "  品牌 API (volcano): "
  if curl -s http://localhost:3000/api/v1/brand -H "x-tenant-id: volcano" | grep -q "brandName"; then
    echo -e "${GREEN}✓ 通过${NC}"
  else
    echo -e "${RED}✗ 失败${NC}"
  fi

  echo -n "  预约配置: "
  if curl -s http://localhost:3000/api/v1/bookings/config -H "x-tenant-id: volcano" | grep -q "mode"; then
    echo -e "${GREEN}✓ 通过${NC}"
  else
    echo -e "${RED}✗ 失败${NC}"
  fi

  echo ""
  echo -e "${GREEN}✅ API 测试完成${NC}"
}

# 查看状态
show_status() {
  echo -e "${YELLOW}📊 服务状态:${NC}"
  echo ""

  # 后端
  if curl -s http://localhost:3000/health &> /dev/null; then
    echo -e "  🌲 后端 API:    ${GREEN}运行中${NC} (http://localhost:3000)"
  else
    echo -e "  🌲 后端 API:    ${RED}未运行${NC}"
  fi

  # 小程序
  if curl -s http://localhost:5173 &> /dev/null; then
    echo -e "  📱 小程序 H5:  ${GREEN}运行中${NC} (http://localhost:5173)"
  else
    echo -e "  📱 小程序 H5:  ${RED}未运行${NC}"
  fi
}

# 主入口
case "${1}" in
  all|"")
    check_dependencies
    start_api
    start_mp

    echo ""
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                    🎉 启动完成!                            ║"
    echo "╠════════════════════════════════════════════════════════════╣"
    echo "║  🌲 后端 API:     http://localhost:3000                   ║"
    echo "║  📖 API 文档:     http://localhost:3000/swagger           ║"
    echo "║  📱 小程序 H5:    http://localhost:5173                   ║"
    echo "║                                                            ║"
    echo "║  测试租户切换:                                           ║"
    echo "║    curl -H \"x-tenant-id: volcano\" \\                     ║"
    echo "║           http://localhost:3000/api/v1/brand              ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    echo -e "${YELLOW}按 Ctrl+C 停止服务${NC}"

    # 等待
    wait
    ;;

  api)
    check_dependencies
    start_api

    echo ""
    echo -e "${GREEN}后端已启动，按 Ctrl+C 停止${NC}"
    wait
    ;;

  mp)
    check_dependencies
    start_mp

    echo ""
    echo -e "${GREEN}小程序已启动，按 Ctrl+C 停止${NC}"
    wait
    ;;

  stop)
    stop_services
    ;;

  status)
    show_status
    ;;

  test)
    test_api
    ;;

  help|--help|-h)
    show_help
    ;;

  *)
    echo -e "${RED}未知命令: $1${NC}"
    show_help
    exit 1
    ;;
esac
