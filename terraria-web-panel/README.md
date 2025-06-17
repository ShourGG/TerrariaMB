# 泰拉瑞亚服务器Web控制面板

这是一个用于管理泰拉瑞亚(Terraria)服务器的Web控制面板。

## 功能特性

- 服务器启动、停止、重启
- 自动下载并安装泰拉瑞亚服务器
- 自动识别服务器类型(tModLoader、原版)
- 配置文件编辑
- 实时日志查看
- 玩家管理
- 系统控制功能
  - 系统信息监控(CPU、内存、磁盘)
  - 终端命令执行(安全白名单)
  - 文件系统浏览器
  - 服务管理

## 安装

使用一键安装脚本:

```bash
curl -fsSL https://raw.githubusercontent.com/ShourGG/terraria-web-panel/main/terraria-panel-installer.sh | bash
```

或者手动安装:

```bash
# 克隆仓库
git clone https://github.com/ShourGG/terraria-web-panel.git
cd terraria-web-panel

# 安装依赖
npm install

# 启动服务
npm start
```

## 系统要求

- Node.js 14+
- Linux系统(推荐Ubuntu 20.04+)
- 2GB+ RAM
- 1GB+ 磁盘空间

## 配置

配置文件位于 `config.json`，可以修改以下设置:

- 端口: 面板运行的HTTP端口
- 服务器安装路径: 泰拉瑞亚服务器安装位置
- 自动备份: 启用/禁用自动备份
- 备份间隔: 自动备份的时间间隔(小时)

## 安全说明

系统控制功能使用安全命令白名单，只允许执行安全的命令，防止恶意操作。

## 许可证

MIT

## 作者

ShourGG 