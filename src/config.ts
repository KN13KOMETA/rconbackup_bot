import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

export interface Config {
  cache: {
    telegramUsersPath: string;
  };
  telegram: {
    token: string;
    users: Set<number>;
  };
  rcon: {
    addr: string;
    port: number;
    pswd: string;
  };
  backup: {
    serverDir: string;
    cmds: {
      before: string[];
      after: string[];
    };
    paths: string[];
    chunkSize: number;
    time: Date;
    timezoneMs: number;
    mode: "DAILY" | "WEEKLY" | "MONTHLY";
  };
}

class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }

  static missingEnvVar(envName: string) {
    return new ConfigError(`Enviroment variable "${envName}" is missing.
Either add it in ".env" file or use any other method.`);
  }

  static invalidPort(port: number) {
    return new ConfigError(`Port "${port}" is invalid.
Expected range: 1024 - ${0xffff}.`);
  }

  static invalidPath(path: string) {
    return new ConfigError(`Path "${path}" does not exists.`);
  }
}

const getEnvVar = (envVarName: string): string | ConfigError => {
  const e = process.env[envVarName];
  if (e == null) return ConfigError.missingEnvVar(envVarName);
  return e;
};

export const parseConfig = (): Config | ConfigError => {
  const cacheDir = path.join(import.meta.dirname, "..", "cache");
  const cfg: Config = {
    cache: {
      telegramUsersPath: path.join(cacheDir, "telegram-users.cache.txt"),
    },
    telegram: { token: "", users: new Set() },
    rcon: {
      addr: "",
      port: 0,
      pswd: "",
    },
    backup: {
      time: new Date(),
      timezoneMs: 0,
      mode: "DAILY",
      cmds: {
        before: [],
        after: [],
      },
      serverDir: "",
      paths: [],
    },
  };

  if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });
  if (!existsSync(cfg.cache.telegramUsersPath))
    writeFileSync(cfg.cache.telegramUsersPath, "", "utf8");

  {
    const e = getEnvVar("TELEGRAM_TOKEN");
    if (e instanceof Error) return e;
    cfg.telegram.token = e;
  }

  /**
   * Long ahh explanation
   * Bot sends backup to every user he knows
   * So every admin sends /start to bot
   * It adds id to list and writes a file
   * So you don't need to write again after restart
   * That's the reason you should restrict access to bot
   */
  if (existsSync(cfg.cache.telegramUsersPath)) {
    const usersCacheContent = readFileSync(cfg.cache.telegramUsersPath, "utf8");
    cfg.telegram.users = new Set(
      usersCacheContent
        .trim()
        .split(/\n/g)
        .map((v) => parseInt(v))
        .filter(Number.isInteger),
    );
  }

  {
    const e = getEnvVar("RCON_HOST");
    if (e instanceof Error) return e;
    cfg.rcon.addr = e;
  }
  {
    const e = getEnvVar("RCON_PORT");
    if (e instanceof Error) return e;
    let n = Number(e);
    if (isNaN(n) || n < 1024 || n > 0xffff) return ConfigError.invalidPort(n);
    cfg.rcon.port = n;
  }
  {
    const e = getEnvVar("RCON_PSWD");
    if (e instanceof Error) return e;
    cfg.rcon.pswd = e;
  }

  {
    const e = getEnvVar("BACKUP_TIME");
    if (e instanceof Error) return e;
    const t = new Date(`1970-01-01T${e}`);
    cfg.backup.time = t;

    const [tzHours, tzMinutes] = e.split(/[-+]/)[1].split(":");
    cfg.backup.timezoneMs =
      (Number(tzHours) * 60 + Number(tzMinutes)) * 60 * 1000;
    cfg.backup.timezoneMs *= e.indexOf("+") == -1 ? -1 : 1;
  }
  {
    const e = getEnvVar("BACKUP_MODE");
    if (e instanceof Error) return e;
    switch (e) {
      case "DAILY":
      case "WEEKLY":
      case "MONTHLY": {
        cfg.backup.mode = e;
        break;
      }
      default:
        return new ConfigError(`BACKUP_MODE must be a value of DAILY or WEEKLY or MONTHLY.
Current value is "${e}".`);
    }
  }
  {
    const e = getEnvVar("CMDS_BEFORE_BACKUP");
    if (e instanceof Error) return e;
    const cmds = e.split(/\n/g);
    cfg.backup.cmds.before = cmds;
  }
  {
    const e = getEnvVar("CMDS_AFTER_BACKUP");
    if (e instanceof Error) return e;
    const cmds = e.split(/\n/g);
    cfg.backup.cmds.after = cmds;
  }
  {
    const e = getEnvVar("SERVER_DIR");
    if (e instanceof Error) return e;
    if (!existsSync(e)) return ConfigError.invalidPath(e);
    cfg.backup.serverDir = e;
  }
  {
    const e = getEnvVar("BACKUP_PATHS");
    if (e instanceof Error) return e;
    const ps = e.split(/\n/g);
    for (const p of ps) {
      if (!existsSync(path.join(cfg.backup.serverDir, p)))
        return ConfigError.invalidPath(p);
      cfg.backup.paths.push(p);
    }
  }
  {
    const e = getEnvVar("BACKUP_CHUNK_SIZE");
    if (e instanceof Error) return e;
    let n = Number(e);
    if (isNaN(n)) return new ConfigError(`${e} is not valid number`);
    cfg.backup.chunkSize = n;
  }

  return cfg;
};
