import { setTimeout } from "timers/promises";
import { Config } from "./config.ts";

const maxDelay = 2 ** 31 - 1;

const waitTillDate = async (date: Date): Promise<void> => {
  while (true) {
    const delay = date.getTime() - Date.now();

    if (delay <= 0) return;
    if (delay > maxDelay) {
      await setTimeout(maxDelay);
      continue;
    }

    await setTimeout(delay);
    return;
  }
};

export class Deferrer {
  config: Config;
  func: Function;

  constructor(config: Config, func: Function) {
    this.config = config;
    this.func = func;
  }

  async defer() {
    const now = new Date();
    const target = new Date();
    const backup = this.config.backup.time;

    target.setHours(
      backup.getHours(),
      backup.getMinutes(),
      backup.getSeconds(),
      0,
    );

    switch (this.config.backup.mode) {
      case "MONTHLY": {
        if (target.getDate() != 1) {
          target.setDate(1);
          target.setMonth(target.getMonth() + 1);
        }

        if (target.getTime() <= now.getTime())
          target.setMonth(target.getMonth() + 1);
        break;
      }
      case "WEEKLY": {
        const week = (target.getDay() + 6) % 7;
        const skip = week == 0 ? 0 : 7 - week;

        target.setDate(target.getDate() + skip);

        if (target.getTime() <= now.getTime())
          target.setDate(target.getDate() + 7);
        break;
      }
      default: {
        if (target.getTime() <= now.getTime())
          target.setDate(target.getDate() + 1);
        break;
      }
    }

    console.log(
      `Next backup at ${new Date(target.getTime() + this.config.backup.timezoneMs).toISOString().slice(0, 19)}`,
    );

    await waitTillDate(target);
    await this.func();
  }
}
