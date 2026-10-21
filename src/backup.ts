import path from "path";
import { Config } from "./config.ts";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "fs";
import { execSync } from "child_process";

export const backup = async (config: Config): Promise<string[]> => {
  const rootDir = path.join(import.meta.dirname, "..");
  const tmpDir = path.join(rootDir, "tmp");
  const filelistPath = path.join(tmpDir, "filelist.txt");
  const serverDir = path.join(rootDir, config.backup.serverDir);
  const archivePath = path.join(
    tmpDir,
    `server-backup_${new Date(Date.now() + config.backup.timezoneMs).toISOString().slice(0, 19)}.7z`,
  );

  if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true });

  mkdirSync(tmpDir);

  writeFileSync(
    filelistPath,
    config.backup.paths.map((p) => path.join(serverDir, p)).join("\n"),
  );

  const args7z = [
    "-mx=7",
    "-m0=LZMA2",
    "-md=64m",
    "-mfb=64",
    "-ms=512m",
    "-mmt=on",
    "-mqs=on",
    "-mmf=HC4",
    "-mmc=1",
    `-v${config.backup.chunkSize}m`,
  ];

  execSync(`7z a -t7z ${args7z.join(" ")} "${archivePath}" @${filelistPath}`);

  const archiveParts = readdirSync(tmpDir).filter((v) =>
    v.includes(path.basename(archivePath)),
  );

  console.log(
    `Archive created "${archivePath} with ${archiveParts.length} volumes"`,
  );

  return archiveParts;
};
