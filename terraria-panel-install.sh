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

# 检查是否是root用户
is_root() {
    [ "$(id -u)" -eq 0 ]
}

# 安装命令函数（自动处理root/非root情况）
run_install() {
    if is_root; then
        $@
    else
        if command -v sudo &> /dev/null; then
            sudo $@
        else
            echo -e "${RED}错误: 需要root权限安装软件包，但没有找到sudo命令${NC}"
            echo -e "${YELLOW}请以root用户运行此脚本或先安装sudo${NC}"
            exit 1
        fi
    fi
}

# 检查依赖
echo -e "${YELLOW}检查依赖...${NC}"
for cmd in curl node npm unzip; do
    if ! command -v $cmd &> /dev/null; then
        echo -e "${RED}错误: $cmd 未安装${NC}"
        
        if [[ "$cmd" == "node" || "$cmd" == "npm" ]]; then
            echo -e "${YELLOW}是否安装Node.js? (y/n, 默认: y)${NC}"
            read -p "" install_node
            
            if [[ "$install_node" != "n" && "$install_node" != "N" ]]; then
                echo -e "${YELLOW}安装Node.js...${NC}"
                if is_root; then
                    curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
                    apt-get install -y nodejs
                else
                    if command -v sudo &> /dev/null; then
                        curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
                        sudo apt-get install -y nodejs
                    else
                        echo -e "${RED}错误: 需要root权限安装Node.js，但没有找到sudo命令${NC}"
                        echo -e "${YELLOW}请以root用户运行此脚本或先安装sudo${NC}"
                        exit 1
                    fi
                fi
                
                if [ $? -ne 0 ]; then
                    echo -e "${RED}安装Node.js失败，请手动安装${NC}"
                    exit 1
                fi
            else
                echo -e "${RED}Node.js是必需的，请手动安装${NC}"
                exit 1
            fi
        elif [[ "$cmd" == "unzip" ]]; then
            echo -e "${YELLOW}是否安装unzip? (y/n, 默认: y)${NC}"
            read -p "" install_dep
            
            if [[ "$install_dep" != "n" && "$install_dep" != "N" ]]; then
                echo -e "${YELLOW}安装unzip...${NC}"
                if is_root; then
                    apt-get update
                    apt-get install -y unzip
                else
                    if command -v sudo &> /dev/null; then
                        sudo apt-get update
                        sudo apt-get install -y unzip
                    else
                        echo -e "${RED}错误: 需要root权限安装unzip，但没有找到sudo命令${NC}"
                        echo -e "${YELLOW}请以root用户运行此脚本或先安装sudo${NC}"
                        exit 1
                    fi
                fi
                
                if [ $? -ne 0 ]; then
                    echo -e "${RED}安装unzip失败，请手动安装${NC}"
                    exit 1
                fi
            else
                echo -e "${RED}unzip是必需的，请手动安装${NC}"
                exit 1
            fi
        else
            echo -e "${YELLOW}是否安装$cmd? (y/n, 默认: y)${NC}"
            read -p "" install_dep
            
            if [[ "$install_dep" != "n" && "$install_dep" != "N" ]]; then
                echo -e "${YELLOW}安装$cmd...${NC}"
                if is_root; then
                    apt-get update && apt-get install -y $cmd
                else
                    if command -v sudo &> /dev/null; then
                        sudo apt-get update && sudo apt-get install -y $cmd
                    else
                        echo -e "${RED}错误: 需要root权限安装软件包，但没有找到sudo命令${NC}"
                        echo -e "${YELLOW}请以root用户运行此脚本或先安装sudo${NC}"
                        exit 1
                    fi
                fi
                
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
read -p "请输入安装目录 (默认: $(pwd)/terraria-panel): " install_dir
INSTALL_DIR=${install_dir:-"$(pwd)/terraria-panel"}

mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# 下载后端文件
echo -e "${YELLOW}下载后端文件...${NC}"
mkdir -p backend
cd backend

# 下载后端核心文件
echo -e "${YELLOW}正在下载后端核心文件...${NC}"
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
curl -L "https://codeload.github.com/$GITHUB_USER/$GITHUB_REPO/zip/refs/heads/main" -o frontend.zip
echo -e "${YELLOW}正在解压前端文件...${NC}"
unzip frontend.zip "*/$GITHUB_REPO-main/frontend/*" -d . || unzip frontend.zip "*/frontend/*" -d .

# 尝试不同的目录结构查找前端文件
if [ -d "$GITHUB_REPO-main/$GITHUB_REPO-main/frontend" ]; then
    mv "$GITHUB_REPO-main/$GITHUB_REPO-main/frontend/"* .
elif [ -d "$GITHUB_REPO-main/frontend" ]; then
    mv "$GITHUB_REPO-main/frontend/"* .
else
    echo -e "${YELLOW}尝试其他方式解压...${NC}"
    # 所有文件解压出来
    unzip -o frontend.zip
    
    # 查找前端目录
    frontendDir=$(find . -type d -name "frontend" -print -quit)
    
    if [ -n "$frontendDir" ]; then
        echo -e "${YELLOW}找到前端目录: $frontendDir${NC}"
        cp -r "$frontendDir/"* .
    else
        echo -e "${RED}无法找到前端文件，请手动下载${NC}"
        echo -e "${YELLOW}前端文件应该位于: https://github.com/$GITHUB_USER/$GITHUB_REPO/tree/main/frontend${NC}"
    fi
fi

# 清理临时文件
rm -rf frontend.zip "$GITHUB_REPO-main" 2>/dev/null

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
EOL

chmod +x start-panel.sh

echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}   安装完成!   ${NC}"
echo -e "${GREEN}=============================================${NC}"
echo -e "${BLUE}使用以下命令启动服务器:${NC}"
echo -e "${YELLOW}cd $INSTALL_DIR && ./start-panel.sh${NC}"
echo ""
echo -e "${BLUE}访问以下地址使用Web界面:${NC}"
echo -e "${YELLOW}http://localhost:3000${NC}"

exit 0 
