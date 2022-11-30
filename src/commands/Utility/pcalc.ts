import type { ChatInputCommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "discord.js";
import BaseCommand from "../../utils/structures/BaseCommand";

class PCalcCommand extends BaseCommand {
    private base = 1829625000n;
    private increase = 1463700000n;

    constructor() {
        super({
            cmdData: new SlashCommandBuilder()
                .setName("pcalc")
                .setDescription("Calculate the cost to prestige on vortex")
                .addNumberOption(option =>
                    option
                        .setName("from")
                        .setDescription("The starting prestige level")
                        .setRequired(true)
                )
                .addNumberOption(option =>
                    option
                        .setName("to")
                        .setDescription("The final prestige level")
                        .setRequired(true)
                ),
            status: "ENABLED"
        });
    }

    async run(i: ChatInputCommandInteraction) {
        // Defer interaction
        await i.deferReply();

        // Validate options
        const from = BigInt(i.options.getNumber("from", true));
        const to = BigInt(i.options.getNumber("to", true));

        if (from <= 0n || to <= 0n) {
            this.sender.reply(
                i,
                { content: "The prestige count can't be lower than 0" },
                { msgType: "INVALID", method: "EDIT_REPLY" }
            );
            return;
        }

        if (from > to) {
            this.sender.reply(
                i,
                {
                    content:
                        "The FROM prestige can't be lower than the TO prestige"
                },
                { msgType: "INVALID", method: "EDIT_REPLY" }
            );
            return;
        }

        if (to - from > 10000000n) {
            this.sender.reply(
                i,
                {
                    content:
                        "The difference between the two prestiges can't be higher than 10 million"
                },
                { msgType: "INVALID", method: "EDIT_REPLY" }
            );
            return;
        }

        // Calculate price
        console.time("test");
        let total = 0n;
        for (let i = from + 1n; i < to + 1n; i++) {
            total += this.base + this.increase * i;
        }
        console.timeEnd("test");

        // Send result
        const embed = this.global
            .defaultEmbed()
            .setDescription(
                `The total price to go from \`p${from}\` to \`p${to}\` is \`$${this.formatNumber(
                    total
                )}\``
            );
        this.sender.reply(i, { embeds: [embed] }, { method: "EDIT_REPLY" });
    }

    formatNumber(number: bigint): string {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
}

export default PCalcCommand;
