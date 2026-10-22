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

const connection = new Connection(config);
const telegram = new Telegram(config);
const deferrer = new Deferrer(config, async () => {
  connection.runBeforeBackupCmds();

  const backupPaths = await backup(config);

  connection.runAfterBackupCmds();

  telegram.sendBackupFile(backupPaths);
});

console.log("NOTICE: Time written using timezone you specified in .env\n");

connection.start();
telegram.start();

while (true) {
  await deferrer.defer();
}
