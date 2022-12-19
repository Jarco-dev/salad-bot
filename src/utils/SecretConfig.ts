import type { CommandLoadLevel, LogLevel } from "../types";
import type { Snowflake } from "discord.js";
import type Logger from "./Logger";
import "dotenv/config";

class SecretConfig {
    public DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN as string;
    // public DATABASE_URL = process.env.DATABASE_URL as string;
    // public SHADOW_DATABASE_URL = process.env.SHADOW_DATABASE_URL as
    //     | string
    //     | undefined;
    public LOG_LEVEL = process.env.LOG_LEVEL as LogLevel;
    public CMD_LOAD_LEVEL = process.env.CMD_LOAD_LEVEL as CommandLoadLevel;
    public CMD_DEV_GUILD = process.env.CMD_DEV_GUILD as Snowflake | undefined;
    public proxies = {
        jarcokers2: {
            host: process.env.PROXY_JARCOKERS2_HOST as string,
            port: parseInt(process.env.PROXY_JARCOKERS2_PORT ?? ""),
            userId: process.env.PROXY_JARCOKERS2_USER_ID as string | undefined,
            password: process.env.PROXY_JARCOKERS2_PASSWORD as
                | string
                | undefined
        },
        spankmypickle: {
            host: process.env.PROXY_SPANKMYPICKLE_HOST as string,
            port: parseInt(process.env.PROXY_SPANKMYPICKLE_PORT ?? ""),
            userId: process.env.PROXY_SPANKMYPICKLE_USER_ID as
                | string
                | undefined,
            password: process.env.PROXY_SPANKMYPICKLE_PASSWORD as
                | string
                | undefined
        },
        notreadyforlife: {
            host: process.env.PROXY_NOTREADYFORLIFE_HOST as string,
            port: parseInt(process.env.PROXY_NOTREADYFORLIFE_PORT ?? ""),
            userId: process.env.PROXY_NOTREADYFORLIFE_USER_ID as
                | string
                | undefined,
            password: process.env.PROXY_NOTREADYFORLIFE_PASSWORD as
                | string
                | undefined
        },
        chokeonmypickle: {
            host: process.env.PROXY_CHOKEONMYPICKLE_HOST as string,
            port: parseInt(process.env.PROXY_CHOKEONMYPICKLE_PORT ?? ""),
            userId: process.env.PROXY_CHOKEONMYPICKLE_USER_ID as
                | string
                | undefined,
            password: process.env.PROXY_CHOKEONMYPICKLE_PASSWORD as
                | string
                | undefined
        },
        jorengamer4: {
            host: process.env.PROXY_JORENGAMER4_HOST as string,
            port: process.env.PROXY_JORENGAMER4_PORT
                ? parseInt(process.env.PROXY_JORENGAMER4_PORT)
                : ("" as unknown as number),
            userId: process.env.PROXY_JORENGAMER4_USER_ID,
            password: process.env.PROXY_JORENGAMER4_PASSWORD
        },
        normie: {
            host: process.env.PROXY_NORMIE_HOST as string,
            port: parseInt(process.env.PROXY_NORMIE_PORT ?? ""),
            userId: process.env.PROXY_NORMIE_USER_ID as string | undefined,
            password: process.env.PROXY_NORMIE_PASSWORD as string | undefined
        },
        demonsht: {
            host: process.env.PROXY_DEMONSHT_HOST as string,
            port: parseInt(process.env.PROXY_DEMONSHT_PORT ?? ""),
            userId: process.env.PROXY_DEMONSHT_USER_ID as string | undefined,
            password: process.env.PROXY_DEMONSHT_PASSWORD as string | undefined
        },
        stanloonaowo: {
            host: process.env.PROXY_STANLOONAOWO_HOST as string,
            port: parseInt(process.env.PROXY_STANLOONAOWO_PORT ?? ""),
            userId: process.env.PROXY_STANLOONAOWO_USER_ID as
                | string
                | undefined,
            password: process.env.PROXY_STANLOONAOWO_PASSWORD as
                | string
                | undefined
        },
        tayswiftlover420: {
            host: process.env.PROXY_TAYSWIFTLOVER420_HOST as string,
            port: parseInt(process.env.PROXY_TAYSWIFTLOVER420_PORT ?? ""),
            userId: process.env.PROXY_TAYSWIFTLOVER420_USER_ID as
                | string
                | undefined,
            password: process.env.PROXY_TAYSWIFTLOVER420_PASSWORD as
                | string
                | undefined
        }
    };
    public mcBotManagers =
        process.env.MC_BOT_MANAGERS?.split(",") ?? ([] as string[]);

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

        for (const key in this.proxies) {
            const proxy = this.proxies[key as keyof typeof this.proxies];
            if (!proxy.host) {
                errors.push(
                    `PROXY_${key.toUpperCase()}_HOST is required but not given`
                );
            }

            if (!proxy.port || isNaN(proxy.port)) {
                errors.push(
                    `PROXY_${key.toUpperCase()}_PORT is required but not given or isn't a number`
                );
            }

            if (proxy.password && !proxy.userId) {
                errors.push(
                    `PROXY_${key.toUpperCase()}_PASSWORD is required when PROXY_${key.toUpperCase()}_USER_ID is set but not given`
                );
            }

            if (proxy.userId && !proxy.password) {
                errors.push(
                    `PROXY_${key.toUpperCase()}_USER_ID is required when PROXY_${key.toUpperCase()}_PASSWORD is set but not given`
                );
            }
        }

        if (this.mcBotManagers.length === 0) {
            errors.push(
                "MC_BOT_MANAGERS requires at least 1 user id but is not given"
            );
        }

        for (const userId of this.mcBotManagers) {
            if (userId.replace(/\d{17,19}/g, "").length > 0) {
                errors.push(
                    "MC_BOT_MANAGERS has one or more invalid user id's"
                );
                break;
            }
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
