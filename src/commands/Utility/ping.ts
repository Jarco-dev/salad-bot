import type { ChatInputCommandInteraction, Message } from "discord.js";
import { SlashCommandBuilder } from "discord.js";
import BaseCommand from "../../utils/structures/BaseCommand";

class PingCommand extends BaseCommand {
    public rttEmoji: string;
    public hbEmoji: string;

    constructor() {
        super({
            cmdData: new SlashCommandBuilder()
                .setName("ping")
                .setDescription("View the bots response time")
                .addStringOption(option =>
                    option
                        .setName("action")
                        .setDescription("Extra actions for the ping command")
                        .addChoices({ name: "Explain", value: "explain" })
                ),
            status: "ENABLED"
        });

        this.rttEmoji = "🔁";
        this.hbEmoji = "💟";
    }

    async run(i: ChatInputCommandInteraction) {
        // Ping action
        switch (i?.options?.getString("action", false)) {
            // Explain
            case "explain": {
                const explainEmbed = this.global
                    .defaultEmbed()
                    .setTitle("Ping explanation")
                    .setDescription(
                        this.global.addNewLines([
                            `${this.rttEmoji} **RTT**: The delay between you sending the message and the bot replying`,
                            `${this.hbEmoji} **Heartbeat**: The delay between the bot and the discord api servers`
                        ])
                    );
                this.sender.reply(i, {
                    embeds: [explainEmbed],
                    ephemeral: true
                });
                break;
            }

            // Ping (default)
            default: {
                // Send a pinging message
                const pingingEmbed = this.global
                    .defaultEmbed()
                    .setTitle("Pinging...");
                const reply = (await this.sender.reply(i, {
                    embeds: [pingingEmbed],
                    ephemeral: true,
                    fetchReply: true
                })) as Message;

                // Calculate the delay and edit the reply
                const timeDiff = reply.createdTimestamp - i.createdTimestamp;
                const resultEmbed = this.global
                    .defaultEmbed()
                    .setTitle("Ping result")
                    .setDescription(
                        this.global.addNewLines([
                            `${this.rttEmoji} **RTT**: ${timeDiff}ms`,
                            `{this.hbEmoji} **Heartbeat**: ${this.client.ws.ping}ms`
                        ])
                    );
                this.sender.reply(
                    i,
                    { embeds: [resultEmbed] },
                    { method: "EDIT_REPLY" }
                );
            }
        }
    }
}

export default PingCommand;
