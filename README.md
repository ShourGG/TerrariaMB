# 泰拉瑞亚管理面板

这是一个用于管理泰拉瑞亚(Terraria)服务器的Web控制面板，提供游戏服务器的下载、安装、启动、停止、配置管理等功能。

## 功能特点

- 一键下载并安装各版本泰拉瑞亚服务器
- 支持原版服务器、tModLoader和TShock服务器
- 服务器状态监控和管理
- 用户友好的Web界面
- 自动解压和安装游戏文件
- 支持手动解压功能
- 模组和插件管理
- 定时任务和备份功能

## 安装使用

### Linux安装（推荐）

```bash
# 下载脚本
wget https://github.com/你的用户名/terraria-management-platform/raw/main/install.sh

# 赋予执行权限
chmod +x install.sh

# 运行安装脚本
./install.sh
```

### 手动安装

1. 克隆仓库
```bash
git clone https://github.com/你的用户名/terraria-management-platform.git
```

2. 安装依赖
```bash
cd terraria-management-platform
npm install
```

3. 启动服务
```bash
npm start
```

## 使用方法

1. 打开浏览器访问 `http://你的服务器IP:3000`
2. 在下载页面选择服务器版本并下载
3. 系统会自动解压并安装服务器
4. 在控制面板启动服务器并管理

## 注意事项

- 本项目需要在Linux环境中运行
- 需要安装Node.js 12+和npm
- 需要安装unzip、tar等解压工具

## 问题排查

如果下载后文件未自动解压，可以尝试以下方法：

1. 检查服务器日志，查看错误信息
2. 使用页面上的"手动解压"功能
3. 确认系统上已安装所需的解压工具（unzip、7z等）
4. 检查文件权限，确保有读写执行权限

## 参考项目

本项目参考了 [DST Management Platform](https://github.com/miracleEverywhere/dst-management-platform-api) 的设计理念。

## 许可证

MIT 