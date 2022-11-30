import type { BaseInteraction } from "discord.js";
import { ApplicationCommandType } from "discord.js";
import Client from "../../index";
import BaseEvent from "../../utils/structures/BaseEvent";

class InteractionCreateEvent extends BaseEvent {
    private readonly commands: typeof Client.commandLoader.commands;

    constructor() {
        super("interactionCreate");

        this.commands = this.client.commandLoader.commands;
    }

    public async run(i: BaseInteraction): Promise<void> {
        // Commands
        if (i.isCommand()) {
            try {
                // Get the corresponding command
                const command = this.commands[i.commandName];
                if (!command)
                    throw new Error(
                        `The ${i?.commandName} command could not be found`
                    );

                // Check for matching types
                if (
                    (command.cmdData.type ===
                        ApplicationCommandType.ChatInput &&
                        !i.isChatInputCommand()) ||
                    (command.cmdData.type === ApplicationCommandType.User &&
                        !i.isUserContextMenuCommand()) ||
                    (command.cmdData.type === ApplicationCommandType.Message &&
                        !i.isMessageContextMenuCommand())
                )
                    throw new Error(
                        `Command and interaction types don't match for ${i.commandName}`
                    );

                // Run the command
                try {
                    command.run(i);
                } catch (err) {
                    this.logger.error(
                        `Error while executing a command commandName: ${
                            command.cmdData.name
                        }${i.inGuild() ? ` guildId: ${i.guild!.id}` : ""}`,
                        err
                    );
                    this.sender.reply(
                        i,
                        {
                            content:
                                "Something went wrong while running the command, the command might have not worked fully!"
                        },
                        { msgType: "ERROR" }
                    );
                }
            } catch (err) {
                this.logger.error(
                    "Error while going through command handler",
                    err
                );
                this.sender.reply(
                    i,
                    { content: "Something went wrong, please try again" },
                    { msgType: "ERROR" }
                );
            }
        }
    }
}

export default InteractionCreateEvent;
