import OSS from "ali-oss";
import fs from "fs-extra";
import merge from "lodash/merge";
import path from "path";

export interface Config {
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  region: string;
  prefix?: string;
  headers?: Record<string, string>;
  sourceDir?: string;
}

// 从项目根目录加载 CJS 配置文件
function loadConfigFile(cwd: string): Partial<Config> {
  const cjsPath = path.join(cwd, "oss-uploader.config.cjs");
  if (fs.existsSync(cjsPath)) {
    return require(cjsPath);
  }
  throw new Error(
    "找不到配置文件 oss-uploader.config.cjs，请确保在项目根目录创建该文件，并使用 .cjs 扩展名"
  );
}

// 递归上传目录或文件
async function uploadDir(
  client: OSS,
  currentPath: string,
  baseDir: string,
  prefix: string,
  headers: Record<string, string>
) {
  const stat = await fs.stat(currentPath);
  if (stat.isDirectory()) {
    for (const name of await fs.readdir(currentPath)) {
      await uploadDir(
        client,
        path.join(currentPath, name),
        baseDir,
        prefix,
        headers
      );
    }
  } else {
    const relativePath = path
      .relative(baseDir, currentPath)
      .replace(/\\/g, "/");
    const objectName = prefix + relativePath;
    const result = await client.put(objectName, currentPath, { headers });
    if (result.res.status === 200) {
      console.log(`✔ 上传 ${currentPath} → ${objectName} 成功`);
    }
  }
}

// 对外暴露的 API
export async function uploadStatic(
  cwd: string,
  opts: Partial<Config> = {}
): Promise<void> {
  const fileConfig = loadConfigFile(cwd);

  const defaultConfig: Config = {
    accessKeyId: "",
    accessKeySecret: "",
    bucket: "",
    region: "",
    prefix: "",
    headers: {
      "x-oss-storage-class": "Standard",
      "x-oss-object-acl": "public-read",
    },
    sourceDir: "dist",
  };

  const config = merge({}, defaultConfig, fileConfig, opts) as Config;
  if (
    !config.accessKeyId ||
    !config.accessKeySecret ||
    !config.bucket ||
    !config.region
  ) {
    throw new Error(
      "请在 oss-uploader.config.cjs 或命令行参数中指定 accessKeyId、accessKeySecret、bucket 和 region"
    );
  }

  const client = new OSS(config as any);
  const baseDir = path.join(cwd, config.sourceDir!);
  await uploadDir(client, baseDir, baseDir, config.prefix!, config.headers!);
}
