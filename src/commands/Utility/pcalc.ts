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
                )
                .addNumberOption(option =>
                    option
                        .setName("balance")
                        .setDescription("The balance you have in billions")
                ),
            status: "ENABLED"
        });
    }

    async run(i: ChatInputCommandInteraction) {
        // Defer interaction
        await i.deferReply();

        // Validate options
        const from = BigInt(i.options.getNumber("from", true));
        const to = i.options.getNumber("to", false)
            ? BigInt(i.options.getNumber("to", false) as number)
            : undefined;
        const balance = i.options.getNumber("balance", false)
            ? BigInt(i.options.getNumber("balance", false) as number)
            : undefined;

        if (!to && !balance) {
            this.sender.reply(
                i,
                { content: "You must provide at least 1 of TO or BALANCE" },
                { method: "EDIT_REPLY", msgType: "INVALID" }
            );
            return;
        }

        if (to && balance) {
            this.sender.reply(
                i,
                { content: "You can't provide both TO and BALANCE at once" },
                { method: "EDIT_REPLY", msgType: "INVALID" }
            );
            return;
        }

        if (to) {
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
        }

        // Calculate prestige based on from and to
        if (to) {
            // Calculate
            let total = 0n;
            for (let i = from + 1n; i < to + 1n; i++) {
                total += this.base + this.increase * i;
            }

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

        // Calculate max prestige with given balance
        if (balance) {
            // Calculate
            let total = 0n;
            let maxPrestige;
            const maxTotal = balance * 1000000000n;
            for (let i = from + 1n; i < 10000000n + 1n; i++) {
                if (total + this.base + this.increase * i > maxTotal) {
                    maxPrestige = i - 1n;
                    break;
                }
                total += this.base + this.increase * i;
            }

            if (!maxPrestige) {
                this.sender.reply(
                    i,
                    {
                        content:
                            "You're able to prestige 10.000.000 times or more, the balance is too high to process"
                    },
                    { msgType: "INVALID", method: "EDIT_REPLY" }
                );
                return;
            }

            // Send result
            const embed = this.global
                .defaultEmbed()
                .setDescription(
                    `Your balance can get you upto \`p${maxPrestige}\``
                );
            this.sender.reply(i, { embeds: [embed] }, { method: "EDIT_REPLY" });
        }
    }

    formatNumber(number: bigint): string {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
}

export default PCalcCommand;
