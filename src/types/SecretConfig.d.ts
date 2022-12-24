import { Snowflake } from "discord.js";
import { CommandLoadLevel, LogLevel } from "@/types";

export interface SecretConfig {
    LOG_LEVEL: LogLevel;
    CMD_LOAD_LEVEL: CommandLoadLevel;
    CMD_DEV_GUILD: Snowflake;
}
