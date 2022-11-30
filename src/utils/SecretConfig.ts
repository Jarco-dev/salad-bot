import type { CommandLoadLevel, LogLevel } from "../types";
import type { Snowflake } from "discord.js";
import type Logger from "./Logger";
import "dotenv/config";

class SecretConfig {
    public DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN as string;
    public DATABASE_URL = process.env.DATABASE_URL as string;
    public SHADOW_DATABASE_URL = process.env.SHADOW_DATABASE_URL as
        | string
        | undefined;
    public LOG_LEVEL = process.env.LOG_LEVEL as LogLevel;
    public CMD_LOAD_LEVEL = process.env.CMD_LOAD_LEVEL as CommandLoadLevel;
    public CMD_DEV_GUILD = process.env.CMD_DEV_GUILD as Snowflake | undefined;

    constructor() {}

    public validate(logger: Logger) {
        const errors: string[] = [];

        if (!this.DISCORD_BOT_TOKEN) {
            errors.push("DISCORD_BOT_TOKEN is required but not given");
        }

        if (!this.DATABASE_URL) {
            errors.push("DATABASE_URL is required but not given");
        }

        if (!this.LOG_LEVEL) {
            errors.push("LOG_LEVEL is required but not given");
        } else if (
            !["VERBOSE", "DEBUG", "INFO", "WARN", "ERROR"].includes(
                this.LOG_LEVEL
            )
        ) {
            errors.push("LOG_LEVEL is a invalid value");
        }

        if (!this.CMD_LOAD_LEVEL) {
            errors.push("CMD_LOAD_LEVEL is required but not given");
        } else if (!["ENABLED", "DEV"].includes(this.CMD_LOAD_LEVEL)) {
            errors.push("CMD_LOAD_LEVEL is a invalid value");
        }

        if (this.CMD_LOAD_LEVEL === "DEV" && !this.CMD_DEV_GUILD) {
            errors.push(
                "CMD_DEV_GUILD is required when CMD_LOAD_LEVEL is set to DEV"
            );
        }

        if (errors.length > 0) {
            logger.warn(
                ...errors.reduce((a: string[], e) => {
                    a.push(`The .env value ${e}`);
                    return a;
                }, [])
            );
            process.exit(0); // eslint-disable-line
        }
    }
}

export default SecretConfig;
