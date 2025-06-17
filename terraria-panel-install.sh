#!/bin/bash

# 泰拉瑞亚服务器Web控制面板一键下载安装脚本

# 定义颜色
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # 无颜色

# 定义GitHub仓库
GITHUB_USER="ShourGG"
GITHUB_REPO="TerrariaMB"

# 显示欢迎信息
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}   泰拉瑞亚服务器Web控制面板一键下载安装脚本   ${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""

# 检查依赖
echo -e "${YELLOW}检查依赖...${NC}"
for cmd in curl node npm; do
    if ! command -v $cmd &> /dev/null; then
        echo -e "${RED}错误: $cmd 未安装${NC}"
        
        if [[ "$cmd" == "node" || "$cmd" == "npm" ]]; then
            echo -e "${YELLOW}是否安装Node.js? (y/n, 默认: y)${NC}"
            read -p "" install_node
            
            if [[ "$install_node" != "n" && "$install_node" != "N" ]]; then
                echo -e "${YELLOW}安装Node.js...${NC}"
                curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
                sudo apt-get install -y nodejs
                
                if [ $? -ne 0 ]; then
                    echo -e "${RED}安装Node.js失败，请手动安装${NC}"
                    exit 1
                fi
            else
                echo -e "${RED}Node.js是必需的，请手动安装${NC}"
                exit 1
            fi
        else
            echo -e "${YELLOW}是否安装$cmd? (y/n, 默认: y)${NC}"
            read -p "" install_dep
            
            if [[ "$install_dep" != "n" && "$install_dep" != "N" ]]; then
                echo -e "${YELLOW}安装$cmd...${NC}"
                sudo apt-get update && sudo apt-get install -y $cmd
                
                if [ $? -ne 0 ]; then
                    echo -e "${RED}安装$cmd失败，请手动安装${NC}"
                    exit 1
                fi
            else
                echo -e "${RED}$cmd是必需的，请手动安装${NC}"
                exit 1
            fi
        fi
    fi
done

# 创建安装目录
echo -e "${YELLOW}创建安装目录...${NC}"
read -p "请输入安装目录 (默认: $HOME/terraria-panel): " install_dir
INSTALL_DIR=${install_dir:-"$HOME/terraria-panel"}

mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# 下载后端文件
echo -e "${YELLOW}下载后端文件...${NC}"
mkdir -p backend
cd backend

# 下载后端核心文件
curl -L "https://raw.githubusercontent.com/$GITHUB_USER/$GITHUB_REPO/main/backend/app.js" -o app.js
curl -L "https://raw.githubusercontent.com/$GITHUB_USER/$GITHUB_REPO/main/backend/system-controller.js" -o system-controller.js
curl -L "https://raw.githubusercontent.com/$GITHUB_USER/$GITHUB_REPO/main/backend/extract-handler.js" -o extract-handler.js
curl -L "https://raw.githubusercontent.com/$GITHUB_USER/$GITHUB_REPO/main/backend/package.json" -o package.json
curl -L "https://raw.githubusercontent.com/$GITHUB_USER/$GITHUB_REPO/main/backend/start.sh" -o start.sh
curl -L "https://raw.githubusercontent.com/$GITHUB_USER/$GITHUB_REPO/main/backend/start-system-control.sh" -o start-system-control.sh

# 创建routes目录
mkdir -p routes
curl -L "https://raw.githubusercontent.com/$GITHUB_USER/$GITHUB_REPO/main/backend/routes/index.js" -o routes/index.js

# 添加执行权限
chmod +x start.sh start-system-control.sh

# 安装依赖
echo -e "${YELLOW}安装后端依赖...${NC}"
npm install

# 下载前端文件
echo -e "${YELLOW}下载前端文件...${NC}"
cd "$INSTALL_DIR"
mkdir -p frontend
cd frontend

# 下载前端静态文件
echo -e "${YELLOW}下载前端静态文件...${NC}"
curl -L "https://github.com/$GITHUB_USER/$GITHUB_REPO/archive/refs/heads/main.zip" -o frontend.zip
unzip frontend.zip "*/frontend/*" -d .
mv $GITHUB_REPO-main/frontend/* .
rm -rf $GITHUB_REPO-main frontend.zip

# 返回安装目录
cd "$INSTALL_DIR"

# 创建启动脚本
echo -e "${YELLOW}创建启动脚本...${NC}"
cat > start-panel.sh << 'EOL'
#!/bin/bash

# 泰拉瑞亚服务器Web控制面板启动脚本

# 定义颜色
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # 无颜色

# 显示欢迎信息
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}   泰拉瑞亚服务器Web控制面板启动脚本   ${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""

# 检查后端目录
if [ ! -d "backend" ]; then
    echo -e "${RED}错误: 后端目录不存在，请重新运行安装脚本${NC}"
    exit 1
fi

# 询问是否启用系统控制功能
echo -e "${YELLOW}是否启用系统控制功能? (y/n, 默认: n)${NC}"
echo -e "${YELLOW}注意: 启用系统控制功能需要管理员权限${NC}"
read -p "" enable_system_control

if [[ "$enable_system_control" == "y" || "$enable_system_control" == "Y" ]]; then
    echo -e "${YELLOW}启动带有系统控制功能的服务器...${NC}"
    cd backend
    ./start-system-control.sh
else
    echo -e "${YELLOW}启动普通服务器...${NC}"
    cd backend
    ./start.sh
fi
