import { parseConfig } from "./config.ts";

const config = parseConfig();

if (config instanceof Error) {
  console.error(config);
  process.exit(1);
}
