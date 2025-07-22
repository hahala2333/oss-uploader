# oss-uploader 使用手册

本手册旨在帮助希望**直接使用** `oss-uploader` 工具的前端开发者，快速完成静态资源上传到阿里云 OSS 的过程。

---

## 一、环境要求

- **Node.js**: 推荐使用 v14 及以上，本工具在 Node v20.11 环境下测试通过。
- **操作系统**: Windows / macOS / Linux 均可。
- **Vite**: 本工具可与 Vite 系列构建兼容，本工具在 "vite": "^6.2.4", 环境下测试通过，但**Vite 7 及以上版本暂不支持**通过插件钩子自动上传，请改用 CLI 或 npm 脚本方式。

---

## 二、安装

在项目根目录运行：

```bash
npm install --save-dev oss-uploader
```

---

## 三、初始化配置

执行初始化命令：

```bash
npx oss-uploader init
```

该命令会在项目根目录生成 `oss-uploader.config.cjs` 配置文件模板。请根据实际情况修改以下字段：

```js
module.exports = {
  accessKeyId: "<YOUR_ACCESS_KEY_ID>", // 阿里云 AccessKeyId
  accessKeySecret: "<YOUR_ACCESS_KEY_SECRET>", // 阿里云 AccessKeySecret
  bucket: "<YOUR_BUCKET_NAME>", // 要上传的 OSS Bucket 名称
  region: "oss-cn-hangzhou", // OSS 所在地域
  prefix: "static/", // 上传后在 Bucket 下的前缀目录
  sourceDir: "dist", // 本地待上传目录，默认 dist
  headers: {
    "x-oss-storage-class": "Standard",
    "x-oss-object-acl": "public-read",
  },
};
```

---

## 四、CLI 使用

### 1. 基本命令

```bash
npx oss-uploader upload
```

- 将读取 `oss-uploader.config.cjs(.js)` 配置，并将 `sourceDir` 目录中的所有文件递归上传到 OSS。

### 2. 参数覆盖

可以通过命令行参数动态覆盖配置文件中的任意字段：

```bash
npx oss-uploader upload \
  --dir=build            # 覆盖 sourceDir
  --prefix=assets/        # 覆盖 prefix
  --accessKeyId=AKID      # 覆盖 AccessKeyId
  --accessKeySecret=SK    # 覆盖 Secret
  --bucket=my-bucket      # 覆盖 Bucket
  --region=oss-cn-shanghai# 覆盖 Region
```

| 参数                     | 说明                   | 默认值 |
| ------------------------ | ---------------------- | ------ |
| `--dir`, `-d`            | 本地静态资源目录       | `dist` |
| `--prefix`, `-p`         | OSS 上的目录前缀       | `''`   |
| `--accessKeyId`, `-a`    | 阿里云 AccessKeyId     | —      |
| `--accessKeySecret`,`-s` | 阿里云 AccessKeySecret | —      |
| `--bucket`, `-b`         | OSS Bucket 名称        | —      |
| `--region`, `-r`         | OSS 地域               | —      |

---

## 五、npm 脚本集成

在 `package.json` 中添加：

```jsonc
{
  "scripts": {
    "build": "vite build",
    "deploy": "npm run build && npx oss-uploader upload"
  }
}
```

执行：

```bash
npm run deploy
```

即可完成 `vite build` 与静态资源上传两步操作。

---

## 六、插件模式（Vite 举例）

> **注意**：Vite 7 及以上版本插件自动上传功能暂不支持，请使用上述 CLI 或 npm 脚本方式。  
> 如果你在使用 Vite 6 或以下，可在 `vite.config.js` 中：

```js
// vite.config.js (Vite <=6)
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { uploadStatic } from "oss-uploader";

export default defineConfig({
  plugins: [
    vue(),
    {
      name: "oss-upload-plugin",
      closeBundle: async () => {
        console.log("📦 构建完成，开始上传 OSS...");
        try {
          await uploadStatic(process.cwd());
          console.log("✅ 上传成功");
        } catch (e) {
          console.error("❌ 上传失败", e);
        }
      },
    },
  ],
});
```

祝你使用愉快！
