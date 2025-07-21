#!/usr/bin/env node
import { Command } from "commander";
import fs from "fs-extra";
import path from "path";
import { Config, uploadStatic } from "./index";

const program = new Command();

program
  .name("oss-uploader")
  .description("将指定目录（默认 dist）上传到阿里云 OSS")
  .version("1.0.0");

program
  .command("init")
  .description("在项目根目录生成配置文件 oss-uploader.config.cjs 模板")
  .action(() => {
    const target = path.join(process.cwd(), "oss-uploader.config.cjs");
    if (fs.existsSync(target)) {
      console.error("⚠ oss-uploader.config.cjs 已存在");
      process.exit(1);
    }
    fs.writeFileSync(
      target,
      `/**
 * OSS Uploader CJS 配置文件
 */
module.exports = {
  accessKeyId: "<YOUR_ACCESS_KEY_ID>",
  accessKeySecret: "<YOUR_ACCESS_KEY_SECRET>",
  bucket: "<YOUR_BUCKET_NAME>",
  region: "<YOUR_OSS_REGION>",
  prefix: "static/",
  sourceDir: "dist",
  headers: {
    "x-oss-storage-class": "Standard",
    "x-oss-object-acl": "public-read"
  }
};\n`
    );
    console.log("✔ 已创建 oss-uploader.config.cjs，请根据实际情况填写");
  });

program
  .command("upload")
  .description("上传指定目录到 OSS，目录默认为 dist")
  .option("-a, --accessKeyId <id>")
  .option("-s, --accessKeySecret <secret>")
  .option("-b, --bucket <bucket>")
  .option("-r, --region <region>")
  .option("-p, --prefix <prefix>")
  .option("-d, --dir <directory>", "本地静态资源目录，默认 dist")
  .action(async (opts: Partial<Config> & { dir?: string }) => {
    try {
      const runOpts: Partial<Config> = { ...opts };
      if (opts.dir) runOpts.sourceDir = opts.dir;
      await uploadStatic(process.cwd(), runOpts);
    } catch (err: any) {
      console.error("✖ 上传失败：", err.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
