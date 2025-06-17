#!/bin/bash

# 泰拉瑞亚服务器Web控制面板 - 系统控制启动脚本
# 此脚本用于启动系统控制功能

# 显示彩色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 显示标题
echo -e "${GREEN}=======================================${NC}"
echo -e "${GREEN}  泰拉瑞亚服务器Web控制面板 - 系统控制  ${NC}"
echo -e "${GREEN}=======================================${NC}"

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: Node.js未安装，请先安装Node.js${NC}"
    exit 1
fi

# 检查当前目录
if [ ! -f "app.js" ] || [ ! -f "system-controller.js" ]; then
    echo -e "${RED}错误: 请在泰拉瑞亚Web面板根目录运行此脚本${NC}"
    exit 1
fi

# 检查是否有root权限
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}警告: 未使用root权限运行，某些系统控制功能可能受限${NC}"
    echo -e "${YELLOW}建议使用 sudo ./start-system-control.sh 运行${NC}"
    read -p "是否继续? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 显示系统信息
echo -e "${GREEN}系统信息:${NC}"
echo -e "主机名: $(hostname)"
echo -e "内核版本: $(uname -r)"
echo -e "CPU: $(grep 'model name' /proc/cpuinfo | head -1 | cut -d':' -f2 | sed 's/^[ \t]*//')"
echo -e "内存: $(free -h | grep Mem | awk '{print $2}')"

# 检查端口是否被占用
PORT=3000
if netstat -tuln | grep -q ":$PORT "; then
    echo -e "${YELLOW}警告: 端口 $PORT 已被占用，可能会导致启动失败${NC}"
fi

# 启动服务器
echo -e "\n${GREEN}正在启动系统控制服务...${NC}"
node app.js --enable-system-control

# 脚本结束
echo -e "${GREEN}系统控制服务已启动${NC}"
echo -e "${GREEN}访问 http://localhost:3000 使用Web界面${NC}" 