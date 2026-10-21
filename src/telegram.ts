import { Bot, InputFile } from "grammy";
import { Config } from "./config.ts";
import { EOL } from "os";
import { appendFileSync, existsSync } from "fs";

export class Telegram {
  config: Config;
  #bot: Bot;

  constructor(config: Config) {
    this.config = config;
    const b = (this.#bot = new Bot(config.telegram.token));

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
    path?: string,
    fileId?: string,
  ): Promise<string> {
    if ((path == null || !existsSync(path)) && fileId == null) {
      console.log("Nothing to send, both path and fileId is invalid");
      return "";
    }

    if (fileId) {
      const msg = await this.#bot.api.sendDocument(id, fileId);
      console.log(
        `Sent file to user @${msg.chat.username} with fileId ${fileId}`,
      );
      return fileId;
    }

    const msg = await this.#bot.api.sendDocument(id, new InputFile(path!));
    console.log(`Sent file to user @${msg.chat.username}`);
    return msg.document.file_id;
  }

  async sendBackupFile(path: string) {
    const users = [...this.config.telegram.users];

    if (users.length == 0) {
      console.log("No one to send archive");
      return;
    }

    const fileId = await this.#sendBackupFileToUser(users[0], path);

    for (let i = 1; i < users.length; i++)
      await this.#sendBackupFileToUser(users[i], undefined, fileId);
  }
}
