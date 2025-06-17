#!/bin/bash
# 泰拉瑞亚管理平台安装脚本

echo "===================================="
echo "  泰拉瑞亚管理平台安装脚本"
echo "===================================="

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # 恢复默认颜色

# 检查是否为root用户
if [ "$(id -u)" != "0" ]; then
   echo -e "${RED}错误: 请使用root权限运行此脚本${NC}"
   exit 1
fi

# 设置安装目录
INSTALL_DIR="/opt/terraria-panel"
DATA_DIR="/home/terraria"

# 创建目录
mkdir -p $INSTALL_DIR
mkdir -p $DATA_DIR
mkdir -p $DATA_DIR/Terraria
mkdir -p $DATA_DIR/Terraria/Downloads
mkdir -p $DATA_DIR/Terraria/server
mkdir -p $DATA_DIR/Terraria/TMLserver
mkdir -p $DATA_DIR/Terraria/TSserver

# 安装依赖
echo -e "${YELLOW}正在安装系统依赖...${NC}"
apt-get update
apt-get install -y curl wget unzip p7zip-full mono-complete nodejs npm tar gzip bzip2 git

# 检查Node.js版本
NODE_VERSION=$(node -v)
echo -e "${GREEN}Node.js版本: $NODE_VERSION${NC}"

# 下载项目
echo -e "${YELLOW}正在下载泰拉瑞亚管理平台...${NC}"
cd /tmp
git clone https://github.com/你的用户名/terraria-management-platform.git
cd terraria-management-platform

# 复制文件
echo -e "${YELLOW}正在安装泰拉瑞亚管理平台...${NC}"
cp -r * $INSTALL_DIR/

# 安装Node.js依赖
echo -e "${YELLOW}正在安装Node.js依赖...${NC}"
cd $INSTALL_DIR
npm install --legacy-peer-deps

# 创建服务
echo -e "${YELLOW}正在创建系统服务...${NC}"
cat > /etc/systemd/system/terraria-panel.service << EOF
[Unit]
Description=Terraria Management Panel
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node $INSTALL_DIR/terraria-web-panel/app.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=terraria-panel

[Install]
WantedBy=multi-user.target
EOF

# 设置权限
echo -e "${YELLOW}正在设置权限...${NC}"
chmod -R 755 $INSTALL_DIR
chmod -R 777 $DATA_DIR
chmod +x $INSTALL_DIR/tr.sh

# 启动服务
echo -e "${YELLOW}正在启动泰拉瑞亚管理平台服务...${NC}"
systemctl daemon-reload
systemctl enable terraria-panel
systemctl start terraria-panel

# 检查服务状态
sleep 3
SERVICE_STATUS=$(systemctl status terraria-panel | grep "Active:" | awk '{print $2}')
if [ "$SERVICE_STATUS" == "active" ]; then
    echo -e "${GREEN}泰拉瑞亚管理平台安装成功并已启动！${NC}"
    echo -e "${GREEN}请访问 http://您的服务器IP:3000 访问管理面板${NC}"
else
    echo -e "${RED}服务启动失败，请检查日志:${NC}"
    journalctl -u terraria-panel -n 20
fi

echo -e "${YELLOW}安装完成！${NC}"
echo -e "${YELLOW}数据目录: $DATA_DIR${NC}"
echo -e "${YELLOW}安装目录: $INSTALL_DIR${NC}"
echo -e "${YELLOW}如需查看日志，请使用命令: journalctl -u terraria-panel -f${NC}"
echo "====================================" 