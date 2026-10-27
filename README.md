# rconbackup_bot

Telegram bot for scheduled game-server backups via RCON, with 7-Zip multi-volume
archiving and archive delivery.

## Features

- **Automated scheduling**: flexible schedules (`DAILY`, `WEEKLY`,
  `MONTHLY`) with explicit time and timezone offsets.
- **RCON command sequence**: runs pre-backup and post-backup
  commands.
- **7-Zip compression**: creates multi-volume 7z archives for reliable handling
  and transport of large backups.
- **Telegram delivery**: sends backup archive parts directly to specified
  Telegram users.
- **Local Bot API support**: works with a local Telegram Bot API server to
  bypass the standard 50 MB file upload limit.

## Installation and Setup

1. Create a Telegram bot and restrict access so that only authorized users can
   interact with it.

2. Clone the repository:

```sh
git clone https://github.com/KN13KOMETA/rconbackup_bot
```

3. Install dependencies:

```sh
pnpm i -P
```

4. Configure `.env` (see `.env.example`).
5. Run the bot:

```sh
pnpm run start
```

6. (Optional) Set up a local Bot API server.

## Setting up Local Bot API

1. Log in to https://my.telegram.org and create an
   application. You will need the `api_id` and `api_hash` from there.

2. Set up Telegram Bot API according to the official instructions:
   https://tdlib.github.io/telegram-bot-api/build.html

3. Run the local Bot API server with the `api_id` and `api_hash` you obtained.

4. Log your bot out of the main Telegram API:

```text
https://api.telegram.org/bot<token>/logOut
```

Replace `<token>` with your bot token.
