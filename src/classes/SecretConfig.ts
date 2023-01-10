import "dotenv/config";
import { LogLevel } from "@/types";
import { Logger } from "./Logger";
import { Snowflake } from "discord.js";
import * as process from "process";

export class SecretConfig {
    public DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN as string;
    // public DATABASE_URL = process.env.DATABASE_URL as string;
    // public SHADOW_DATABASE_URL = process.env.SHADOW_DATABASE_URL as
    //     | string
    //     | undefined;
    public LOG_LEVEL = process.env.LOG_LEVEL as LogLevel;
    public MC_BOT_MANAGERS = process.env.MC_BOT_MANAGERS?.split(
        ","
    ) as Snowflake[];
    public MC_BOT_ALERTS = process.env.MC_BOT_ALERTS as string;

    constructor() {}

    public validate(logger: Logger) {
        const errors: string[] = [];

        if (!this.DISCORD_BOT_TOKEN) {
            errors.push("DISCORD_BOT_TOKEN is required but not given");
        }

        // if (!this.DATABASE_URL) {
        //     errors.push("DATABASE_URL is required but not given");
        // }

        if (!this.LOG_LEVEL) {
            errors.push("LOG_LEVEL is required but not given");
        } else if (
            !["VERBOSE", "DEBUG", "INFO", "WARN", "ERROR"].includes(
                this.LOG_LEVEL
            )
        ) {
            errors.push("LOG_LEVEL is a invalid value");
        }

        if (!this.MC_BOT_MANAGERS) {
            errors.push("MC_BOT_MANAGERS is required but not given");
        }

        if (!this.MC_BOT_ALERTS) {
            errors.push("MC_BOT_ALERTS is required but not given");
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
