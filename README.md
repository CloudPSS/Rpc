# RPC 服务

[![npm](https://img.shields.io/npm/v/@cloudpss/rpc)](https://www.npmjs.com/package/@cloudpss/rpc)

用于 CloudPSS 内部微服务的 RPC 框架，简单封装了 Apache Thrift。

```bash
pnpm add @cloudpss/rpc
```

## 使用

### 生成接口文件

- 创建 thrift IDL 文件（如：`rpc/my-service.thrift`）
- 运行 `cloudpss-rpc` 递归生成 Node.js 的 JS 和 TypeScript 声明，IDL 中的 `i64` 映射为 `bigint`。
  ```bash
  pnpm exec cloudpss-rpc -out ./src/thrift ./rpc/my-service.thrift
  ```
- `cloudpss-rpc` 默认加上 `-r --gen js:ts,es6,node,bigint`，其余参数原样传给 `thrift`。

### 服务端

```ts
import * as MyService from './thrift/MyService';
import { createServer } from '@cloudpss/rpc';

const service = createServer();
service.route('my-service', MyService, {
  // implementation
  add(a, b) {
    return a + b;
  },
});
service.listen(Number(process.env.PORT || 4000));
```

### 客户端

```ts
import * as MyService from './thrift/MyService';
import { createClient } from '@cloudpss/rpc';

const client = createClient({
  host: 'localhost',
  port: Number(process.env.PORT || 4000),
});
const service = client.get('my-service', MyService);
// ...
// use service here
// ...
const result = await service.add(1, 2);

client.destroy();
```

## 开发

### 初始化本地环境

```bash
pnpm install
```

### 更新 thrift binary

```pwsh
./build/upgrade-bin.ps1
```

### 调试

```bash
pnpm start
```

### 发布

```bash
pnpm version <patch|minor|major>
pnpm publish --registry https://registry.npmjs.org
```
