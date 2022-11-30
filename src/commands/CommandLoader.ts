import type { Snowflake } from "discord.js";
import type { CommandLoadLevel } from "../types";
import type Client from "../index";
import { promises as fs } from "fs";
import path from "path";
import BaseCommand from "../utils/structures/BaseCommand";

class CommandLoader {
    public commands: { [key: string]: BaseCommand };
    public path: string;
    private client: typeof Client;
    private logger: typeof Client.logger;

    constructor(client: typeof Client) {
        this.client = client;
        this.logger = client.logger;
        this.commands = {};
        this.path = path.join(__dirname, "../commands/");
    }

    public async loadAll(): Promise<void> {
        // Get all the folders
        const folders = await fs.readdir(this.path);
        for (const folder of folders) {
            // Load the commands if it's a folder
            if ((await fs.lstat(this.path + folder)).isDirectory()) {
                const files = await fs.readdir(this.path + folder);
                // Go through all the command files in the folder and load them
                for (const file of files) {
                    // Load the command
                    try {
                        const Command = require(path.join(
                            this.path,
                            `./${folder}/${file}`
                        )).default;
                        if (Command.prototype instanceof BaseCommand) {
                            const command = new Command();
                            this.commands[command.cmdData.name] = command;
                        }
                    } catch (err) {
                        this.logger.error(
                            `Error while trying to load a command commandFile: ${file}`,
                            err
                        );
                    }
                }
            }
        }
    }

    async updateCommands(
        status: CommandLoadLevel,
        guildId?: Snowflake
    ): Promise<void> {
        if (!["ENABLED", "ALL", "DEV"].includes(status))
            throw new Error("status is a invalid value");
        await this.client.application!.fetch();
        const data = [];
        for (const commandName in this.commands) {
            const command = this.commands[commandName];
            if (command.status === status) data.push(command.cmdData);
        }

        (guildId
            ? this.client.application!.commands.set(data, guildId)
            : this.client.application!.commands.set(data)
        )
            .then(commands =>
                this.logger.info(
                    `Updated ${
                        commands.size
                    } application command(s) status: ${status} guild: ${
                        guildId ? guildId : "None"
                    }`
                )
            )
            .catch(err =>
                this.logger.error(
                    `Error while updating application command(s) status: ${status} guild: ${
                        guildId ? guildId : "None"
                    }`,
                    err
                )
            );
    }
}

export default CommandLoader;
