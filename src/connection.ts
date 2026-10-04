import rconModule from "rcon-srcds";
import { Config } from "./config.ts";

const Rcon = (rconModule as any).default as typeof rconModule;

export class Connection {
  config: Config;
  #rcon: rconModule;

  constructor(config: Config) {
    this.config = config;
  }

  async start() {
    this.#rcon = new Rcon({
      host: this.config.rcon.addr,
      port: this.config.rcon.port,
      maxPacketSize: 0,
      encoding: "utf8",
    });

    try {
      await this.#rcon.authenticate(this.config.rcon.pswd);
      console.log(
        `Connected to ${this.config.rcon.addr}:${this.config.rcon.port}`,
      );
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  }

  async stop() {
    try {
      this.#rcon.disconnect();
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  }

  checkConnected() {
    if (!this.#rcon?.connected) {
      console.error(new Error("Not connected to RCON"));
      process.exit(1);
    }
  }

  async runBeforeBackupCmds() {
    console.log(`Running commands before backup`);

    this.checkConnected();

    try {
      for (const cmd of this.config.backup.cmds.before) {
        try {
          await this.#rcon.execute(cmd);
          console.log(`  [x] ${cmd}`);
        } catch (e) {
          console.error(e);
          process.exit(1);
        }
      }

      console.log();
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  }

  async runAfterBackupCmds() {
    console.log(`Running commands after backup`);

    this.checkConnected();

    try {
      for (const cmd of this.config.backup.cmds.after) {
        try {
          await this.#rcon.execute(cmd);
          console.log(`  [x] ${cmd}`);
        } catch (e) {
          console.error(e);
          process.exit(1);
        }
      }

      console.log();
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  }
}
