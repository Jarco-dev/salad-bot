import type { HandlerResult } from "@/types";
import { ChatInputCommand } from "@/structures";
import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import * as process from "process";

export default class SuicideChatInputCommand extends ChatInputCommand {
    constructor() {
        super({
            builder: new SlashCommandBuilder()
                .setName("suicide")
                .setDescription("Shutdown the bot")
        });
    }

    public async run(i: ChatInputCommandInteraction): Promise<HandlerResult> {
        // Check permissions
        if (!this.client.sConfig.MC_BOT_MANAGERS.includes(i.user.id)) {
            this.client.sender.reply(
                i,
                {
                    content:
                        "You don't have the permissions required to run this"
                },
                { msgType: "INVALID" }
            );
            return { result: "USER_MISSING_PERMISSIONS" };
        }

        // Success
        await this.client.sender.reply(
            i,
            { content: "Shutting down..." },
            { msgType: "SUCCESS" }
        );
        // eslint-disable-next-line no-process-exit
        process.exit(0);
    }
}
