import { Bot, InputFile } from "grammy";
import { Config } from "./config.ts";
import { EOL } from "os";
import { appendFileSync, existsSync } from "fs";
import path from "path";

export class Telegram {
  config: Config;
  #bot: Bot;

  constructor(config: Config) {
    this.config = config;

    if (config.telegram.localApi) {
      this.#bot = new Bot(config.telegram.token, {
        client: { apiRoot: config.telegram.localApi },
      });
    } else {
      this.#bot = new Bot(config.telegram.token);
    }

    const b = this.#bot;

    b.command("start", async (ctx) => {
      if (ctx.from == null) {
        console.log("Error: Message sender not found`");
        return;
      }

      console.log(`Received /start from ${ctx.from.username}`);

      if (config.telegram.users.has(ctx.from.id)) {
        ctx.reply("You are already in a list who will get backup.");
        return;
      }

      const msg = await ctx.reply("Wait a moment...");

      appendFileSync(
        config.cache.telegramUsersPath,
        `${EOL}${ctx.from.id}`,
        "utf8",
      );

      config.telegram.users.add(ctx.from.id);

      b.api.editMessageText(
        ctx.chatId,
        msg.message_id,
        "You are added in list. You will receive getting backups starting with next one.",
      );
    });
  }

  async start() {
    console.log("Telegram bot started");
    await this.#bot.start();
  }

  async #sendBackupFileToUser(
    id: number,
    paths?: string[],
    fileIds?: string[],
  ): Promise<string[]> {
    const fids = [];

    if (paths == null && fileIds == null) {
      console.log("Nothing to send, both paths and fileIds is invalid");
      return [];
    }

    if (fileIds) {
      for (const fileId of fileIds) {
        const msg = await this.#bot.api.sendDocument(id, fileId);
        console.log(`Sent file ${fileId} to user @${msg.chat.username}`);
      }
      return fileIds;
    }

    for (const p of paths!) {
      const msg = await this.#bot.api.sendDocument(id, new InputFile(p));
      console.log(
        `Sent file ${path.basename(p)} to user @${msg.chat.username}`,
      );
      fids.push(msg.document.file_id);
    }

    return fids;
  }

  async sendBackupFile(paths: string[]) {
    const users = [...this.config.telegram.users];

    if (users.length == 0) {
      console.log("No one to send archive");
      return;
    }

    const fileIds = await this.#sendBackupFileToUser(users[0], paths);

    for (let i = 1; i < users.length; i++)
      await this.#sendBackupFileToUser(users[i], undefined, fileIds);
  }
}
