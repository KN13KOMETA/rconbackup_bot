import { backup } from "./backup.ts";
import { parseConfig } from "./config.ts";
import { Connection } from "./connection.ts";
import { Deferrer } from "./deferrer.ts";
import { Telegram } from "./telegram.ts";

const config = parseConfig();

if (config instanceof Error) {
  console.error(config);
  process.exit(1);
}

const telegram = new Telegram(config);
const deferrer = new Deferrer(config, async () => {
  const connection = new Connection(config);

  await connection.start();
  await connection.runBeforeBackupCmds();

  const backupPaths = await backup(config);

  await connection.runAfterBackupCmds();

  telegram.sendBackupFile(backupPaths);

  connection.stop();
});

console.log("NOTICE: Time written using timezone you specified in .env\n");

telegram.start();

while (true) {
  await deferrer.defer();
}
