# 织麦电竞 后端服务

基于 **Node.js + Express** 的后端服务，设计为**腾讯云 CloudBase 云函数**部署形式，同时可本地运行调试。

---

## 项目简介

本项目为"织麦电竞"H5 应用的后端 API 服务，提供：

- 用户认证（注册/登录/找回密码/短信验证码）
- 用户中心（个人资料/支付密码/实名认证）
- 商品管理（游戏列表/分类/商品列表/详情）
- 订单系统（创建/查询/支付/取消）
- 钱包系统（余额查询/充值预留）
- 管理后台（仪表盘/订单/商品/分类/打手/用户管理）

---

## 本地运行

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入配置（本地开发保持 `USE_LOCAL_DB=true`，无需配置 CloudBase）：

```env
JWT_SECRET=your-secret-key-at-least-32-characters
USE_LOCAL_DB=true
PORT=3000
```

### 3. 启动开发服务

```bash
npm run dev
```

服务启动后访问：
- 健康检查：http://localhost:3000/health
- API 入口：http://localhost:3000/api

---

## 腾讯云 CloudBase 部署

### 1. 安装 CloudBase CLI

```bash
npm install -g @cloudbase/cli
```

### 2. 登录

```bash
cloudbase login
```

### 3. 配置

编辑 `cloudbaserc.json`，将 `{{ENV_ID}}` 替换为你的 CloudBase 环境 ID。

在腾讯云 CloudBase 控制台的云函数"环境变量"中配置：

| 变量名 | 说明 |
|--------|------|
| JWT_SECRET | JWT 签名密钥（至少 32 位） |
| CLOUDBASE_ENV_ID | CloudBase 环境 ID |
| USE_LOCAL_DB | 生产环境设置为 `false` |
| NODE_ENV | 设置为 `production` |

### 4. 部署

```bash
cloudbase functions:deploy zhimai-api
```

---

## API 接口列表

所有接口返回格式：
```json
{ "code": 200, "data": {...}, "message": "ok" }
```

错误时：
```json
{ "code": 400, "data": null, "message": "错误信息" }
```

### 认证模块 `/api/auth`

| 方法 | 路径 | 描述 | 鉴权 |
|------|------|------|------|
| POST | `/api/auth/register` | 注册（phone, password, username） | 否 |
| POST | `/api/auth/login` | 登录（phone, password），返回 JWT token | 否 |
| POST | `/api/auth/logout` | 登出 | 是 |
| POST | `/api/auth/send-sms` | 发送短信验证码 | 否 |
| POST | `/api/auth/reset-password` | 重置密码（phone, code, newPassword） | 否 |

### 用户模块 `/api/user`

| 方法 | 路径 | 描述 | 鉴权 |
|------|------|------|------|
| GET | `/api/user/profile` | 获取当前用户信息 | 是 |
| PUT | `/api/user/profile` | 更新用户信息（nickname, avatar） | 是 |
| PUT | `/api/user/payment-password` | 设置/修改支付密码 | 是 |
| POST | `/api/user/real-name` | 实名认证（name, idCard） | 是 |

### 商品模块 `/api/product`

| 方法 | 路径 | 描述 | 鉴权 |
|------|------|------|------|
| GET | `/api/product/games` | 获取游戏列表 | 否 |
| GET | `/api/product/categories` | 获取分类列表（?game=delta） | 否 |
| GET | `/api/product/list` | 获取商品列表（?category&page&pageSize） | 否 |
| GET | `/api/product/:productId` | 获取商品详情 | 否 |

### 订单模块 `/api/order`

| 方法 | 路径 | 描述 | 鉴权 |
|------|------|------|------|
| POST | `/api/order/create` | 创建订单 | 是 |
| GET | `/api/order/list` | 获取订单列表（?status&page&pageSize） | 是 |
| GET | `/api/order/:orderId` | 获取订单详情 | 是 |
| POST | `/api/order/:orderId/pay` | 发起支付（paymentMethod） | 是 |
| POST | `/api/order/:orderId/cancel` | 取消订单 | 是 |

### 钱包模块 `/api/wallet`

| 方法 | 路径 | 描述 | 鉴权 |
|------|------|------|------|
| GET | `/api/wallet` | 获取钱包信息 | 是 |
| POST | `/api/wallet/recharge` | 充值（amount, paymentMethod）— 预留 | 是 |

### 管理员模块 `/api/admin`

| 方法 | 路径 | 描述 | 鉴权 |
|------|------|------|------|
| POST | `/api/admin/login` | 管理员登录 | 否 |
| GET | `/api/admin/dashboard` | 仪表盘统计 | Admin |
| GET | `/api/admin/orders` | 订单列表 | Admin |
| PUT | `/api/admin/orders/:orderId/status` | 更新订单状态 | Admin |
| DELETE | `/api/admin/orders/:orderId` | 取消订单 | Admin |
| GET | `/api/admin/products` | 商品列表 | Admin |
| POST | `/api/admin/products` | 创建商品 | Admin |
| PUT | `/api/admin/products/:productId` | 更新商品 | Admin |
| DELETE | `/api/admin/products/:productId` | 删除商品 | Admin |
| GET | `/api/admin/categories` | 分类列表 | Admin |
| POST | `/api/admin/categories` | 创建分类 | Admin |
| PUT | `/api/admin/categories/:categoryId` | 更新分类 | Admin |
| DELETE | `/api/admin/categories/:categoryId` | 删除分类 | Admin |
| GET | `/api/admin/boosters` | 打手列表 | Admin |
| POST | `/api/admin/boosters` | 创建打手 | Admin |
| PUT | `/api/admin/boosters/:boosterId` | 更新打手 | Admin |
| DELETE | `/api/admin/boosters/:boosterId` | 删除打手 | Admin |
| GET | `/api/admin/users` | 用户列表 | Admin |

---

## 环境变量说明

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `PORT` | 否 | `3000` | 服务监听端口 |
| `NODE_ENV` | 否 | `development` | 运行环境 |
| `JWT_SECRET` | 是 | 内置默认值（仅开发用） | JWT 签名密钥，生产环境必须设置 |
| `USE_LOCAL_DB` | 否 | `false` | `true` 时使用内存 Map 模拟数据库 |
| `CLOUDBASE_ENV_ID` | 生产必填 | — | 腾讯云 CloudBase 环境 ID |
| `CLOUDBASE_SECRET_ID` | 生产必填 | — | 腾讯云 API 密钥 SecretId |
| `CLOUDBASE_SECRET_KEY` | 生产必填 | — | 腾讯云 API 密钥 SecretKey |
| `CORS_ORIGIN` | 否 | `*` | 允许的跨域来源，生产建议设置为具体域名 |

---

## 数据集合（CloudBase 数据库）

| 集合名 | 说明 |
|--------|------|
| `users` | 用户信息 |
| `orders` | 订单数据 |
| `products` | 商品数据 |
| `categories` | 商品分类 |
| `games` | 游戏列表 |
| `wallets` | 钱包/交易记录 |
| `boosters` | 打手/陪练 |
| `admins` | 管理员账户 |
| `sms_codes` | 短信验证码（临时） |

---

## 注意事项

1. **生产环境必须**：
   - 设置强密码 `JWT_SECRET`（至少 32 位随机字符串）
   - 将 `USE_LOCAL_DB` 设为 `false` 并配置 CloudBase 凭证
   - 将 `CORS_ORIGIN` 设为具体域名
2. **短信验证码**：`/api/auth/send-sms` 目前为预留接口，需接入腾讯云短信 SDK
3. **支付接口**：微信/支付宝支付目前返回占位参数，需接入真实支付 SDK
4. **默认管理员**：首次启动自动创建（`admin` / `admin123456`），生产环境请立即修改密码
