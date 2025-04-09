# Secure-RDP-Manager

安全的暴露和管理你的RDP服务

Secure-RDP-Manager 是一个基于 Node.js 的工具，用于管理和控制 Windows 系统上的远程桌面协议 (RDP) 服务和frpc代理服务。它提供了一个简单的 Web 界面，允许用户启用/禁用 RDP 服务、管理frpc代理。该工具旨在通过窗口机制和基本认证增强安全性, 避免RDP服务被扫描和爆破。

![SecureRDP-Manager Web 界面截图](https://github.com/zyyc5/Secure-RDP-Manager/raw/main/sc.png)

## 功能

- **极简依赖**：仅依赖 `express` 和 `node-windows`，安装轻量，运行高效，避免复杂的依赖管理。
  
- **RDP 服务管理**：
  - 查看 RDP 服务状态（启用/禁用）。
  - 启用或禁用 RDP 服务。
  - 窗口机制：启用 RDP 服务后,会开放访问窗口5分钟, 超过 5 分钟，将自动关闭（不会踢出已登录用户）。
  
- **代理管理**：
  - 使用 `frpc`（FRP 客户端）暴露 RDP 服务到公网。
  - 开启/关闭代理功能。

- **安全性**：
  - 使用基本认证（Basic Auth）保护 Web 界面。
  - 支持动态修改认证凭据。
  - 不影响 RDP 服务的其他功能。

- **Windows 服务**：
  - 可作为 Windows 服务运行，确保开机自启和管理便利。

## 安装

### 前提条件

- 系统：Windows
- Node.js：版本 14 或以上。
- `frpc`（可选）：若需公网代理功能，需安装并配置 FRP 客户端。

### 步骤

1. **克隆项目**

   ```bash
   git clone https://github.com/zyyc5/Secure-RDP-Manager.git
   cd secure-rdp-manager
   ```

2. **安装依赖**

   ```bash
   npm install
   ```

3. **配置**
   - 编辑 `config.json` 文件，设置端口、用户名和密码：

    ```json
    {
      "PORT": 9107,
      "USERNAME": "admin",
      "PASSWORD": "password123"
    }
    ```

   - （可选）若使用代理功能，需在 `frpc` 目录下放置 `frpc.exe` 和 `frpc.toml` 文件，并配置代理规则。
   - 可自行下载frpc,下载后替换frpc目录下的frpc.exe; 项目地址：[https://github.com/fatedier/frp](https://github.com/fatedier/frp)

4. **运行项目**

   ```bash
   npm start
   ```

   Web 服务将运行在 `http://localhost:9107`，通过浏览器访问。

5. **（可选）安装为 Windows 服务**

   ```bash
   npm run install-service
   ```

   - 服务名称：`SecureRDP-ManagerService`
   - 安装后将自动启动，并打开浏览器访问管理页面。

6. **（可选）卸载服务**

   ```bash
   npm run uninstall-service
   ```

## 使用说明

1. **访问 Web 界面**
   - 打开浏览器，输入 `http://localhost:9107`（或配置文件中的端口）。
   - 输入用户名和密码（默认 `admin`/`password123`）进行登录。

2. **管理 RDP 服务**
   - 点击“开启服务”或“关闭服务”按钮控制 RDP。
   - 状态将实时更新为“已启用”或“已关闭”。

3. **管理代理**
   - 若 `frpc` 已安装，可点击“开启代理”或“关闭代理”切换状态。
   - 代理状态显示为“开启”、“关闭”或“未安装”。

4. **修改密码**
   - 点击“修改密码”按钮，弹出窗口。
   - 输入用户名、新密码和确认密码，提交后需重新登录。

## 注意事项

- **权限**：部分操作（如修改注册表、启动服务）需要管理员权限，请以管理员身份运行命令。
- **代理配置**：若未安装 `frpc`，代理功能不可用，需手动下载并配置。
- **安全性**：默认密码较弱，建议首次登录后立即修改。
- **窗口机制**：RDP 服务启用 5 分钟后，将自动关闭以提高安全性。
