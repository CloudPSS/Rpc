# RPC 服务

[![npm](https://img.shields.io/npm/v/@cloudpss/rpc)](https://www.npmjs.com/package/@cloudpss/rpc)

用于 CloudPSS 内部微服务的 RPC 框架，简单封装了 Apache Thrift。

```bash
yarn add @cloudpss/rpc
```

## 使用

### 生成接口文件

- 创建 thrift IDL 文件（如：`rpc/my-service.thrift`）
- 运行 `thrift` 命令生成 JS/TS 接口
  ```bash
  yarn thrift -r --gen js:ts,es6,node -out ./src/thrift
  ```

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
yarn install
```

### 调试

```bash
yarn start
```

### 发布

```bash
yarn version
npm publish
```
