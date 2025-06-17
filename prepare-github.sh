#!/bin/bash
# GitHub上传准备脚本

echo "====================================="
echo "  GitHub上传准备脚本"
echo "====================================="

# 参数
GITHUB_USER="请输入你的GitHub用户名"
REPO_NAME="terraria-management-platform"
TARGET_DIR="dist-github"

# 确认信息
echo "GitHub用户名: $GITHUB_USER"
echo "仓库名称: $REPO_NAME"
echo "目标目录: $TARGET_DIR"
echo "====================================="
read -p "以上信息是否正确？(y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo "已取消操作"
    exit 1
fi

# 创建目录结构
mkdir -p $TARGET_DIR/terraria-web-panel
mkdir -p $TARGET_DIR/koishi面板

# 复制后端文件
echo "正在复制后端文件..."
cp -r terraria-web-panel/* $TARGET_DIR/terraria-web-panel/
rm -rf $TARGET_DIR/terraria-web-panel/node_modules

# 复制前端文件
echo "正在复制前端文件..."
cp -r koishi面板/src $TARGET_DIR/koishi面板/
cp -r koishi面板/public $TARGET_DIR/koishi面板/
cp koishi面板/package.json $TARGET_DIR/koishi面板/
cp koishi面板/vite.config.ts $TARGET_DIR/koishi面板/
cp koishi面板/tsconfig.json $TARGET_DIR/koishi面板/

# 复制安装脚本
echo "正在复制安装脚本..."
cp install.sh $TARGET_DIR/
cp tr.sh $TARGET_DIR/

# 创建.gitignore
echo "正在创建.gitignore..."
cat > $TARGET_DIR/.gitignore << EOF
node_modules/
.DS_Store
*.log
.vscode/
*.swp
*.swo
EOF

# 初始化Git仓库
echo "正在初始化Git仓库..."
cd $TARGET_DIR
git init
git add .
git commit -m "初始提交：泰拉瑞亚管理平台"

# 设置远程仓库
echo "正在设置远程仓库..."
git remote add origin https://github.com/$GITHUB_USER/$REPO_NAME.git

echo "====================================="
echo "准备完成！"
echo "现在你可以执行以下命令推送到GitHub:"
echo "cd $TARGET_DIR"
echo "git push -u origin master"
echo "=====================================" 