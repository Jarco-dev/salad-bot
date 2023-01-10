import { HandlerResult } from "@/types";
import { ChatInputCommand } from "@/structures";
import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export default class PCalcChatInputCommand extends ChatInputCommand {
    private base = BigInt(1829625000);
    private increase = BigInt(1463700000);

    constructor() {
        super({
            builder: new SlashCommandBuilder()
                .setName("pcalc")
                .setDescription("Calculate the cost of prestige's on vortex")
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
                )
                .addBooleanOption(option =>
                    option
                        .setName("gang")
                        .setDescription("Calculate gang prestige's")
                ),
            enabled: true
        });
    }

    public async run(i: ChatInputCommandInteraction): Promise<HandlerResult> {
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
        const gang = i.options.getBoolean("gang", false);

        if (!to && !balance) {
            this.client.sender.reply(
                i,
                { content: "You must provide at least 1 of TO or BALANCE" },
                { method: "EDIT_REPLY", msgType: "INVALID" }
            );
            return { result: "INVALID_ARGUMENTS" };
        }

        if (to && balance) {
            this.client.sender.reply(
                i,
                { content: "You can't provide both TO and BALANCE at once" },
                { method: "EDIT_REPLY", msgType: "INVALID" }
            );
            return { result: "INVALID_ARGUMENTS" };
        }

        if (to) {
            if (from < BigInt(0) || to < BigInt(0)) {
                this.client.sender.reply(
                    i,
                    { content: "The prestige count can't be below 0" },
                    { msgType: "INVALID", method: "EDIT_REPLY" }
                );
                return { result: "INVALID_ARGUMENTS" };
            }

            if (from > to) {
                this.client.sender.reply(
                    i,
                    {
                        content:
                            "The FROM prestige can't be lower than the TO prestige"
                    },
                    { msgType: "INVALID", method: "EDIT_REPLY" }
                );
                return { result: "INVALID_ARGUMENTS" };
            }

            if (to - from > BigInt(10000000)) {
                this.client.sender.reply(
                    i,
                    {
                        content:
                            "The difference between the two prestige's can't be higher than 10 million"
                    },
                    { msgType: "INVALID", method: "EDIT_REPLY" }
                );
                return { result: "INVALID_ARGUMENTS" };
            }
        }

        // Calculate prestige based on from and to
        if (to) {
            // Calculate
            let total = BigInt(0);
            for (
                let i = from + (gang ? BigInt(1) : BigInt(0));
                i < to + (gang ? BigInt(1) : BigInt(0));
                i++
            ) {
                total += this.base + this.increase * i;
            }

            // Send result
            const embed = this.client.utils
                .defaultEmbed()
                .setDescription(
                    `The total price to go from \`p${from}\` to \`p${to}\` is \`$${this.formatNumber(
                        total
                    )}\``
                );
            this.client.sender.reply(
                i,
                { embeds: [embed] },
                { method: "EDIT_REPLY" }
            );
        }

        // Calculate max prestige with given balance
        if (balance) {
            // Calculate
            let total = BigInt(0);
            let maxPrestige;
            const maxTotal = balance * BigInt(1000000000);
            for (
                let i = from + (gang ? BigInt(1) : BigInt(0));
                i < BigInt(10000000) + (gang ? BigInt(1) : BigInt(0));
                i++
            ) {
                if (total + this.base + this.increase * i > maxTotal) {
                    maxPrestige = i - BigInt(1);
                    break;
                }
                total += this.base + this.increase * i;
            }

            if (!maxPrestige) {
                this.client.sender.reply(
                    i,
                    {
                        content:
                            "You're able to prestige 10.000.000 times or more, the balance is too high to process"
                    },
                    { msgType: "INVALID", method: "EDIT_REPLY" }
                );
                return { result: "OTHER", note: "calculation too big" };
            }

            // Send result
            const embed = this.client.utils
                .defaultEmbed()
                .setDescription(
                    `Your balance can get you upto \`p${maxPrestige}\``
                );
            this.client.sender.reply(
                i,
                { embeds: [embed] },
                { method: "EDIT_REPLY" }
            );
        }

        // Success
        return { result: "SUCCESS" };
    }

    public formatNumber(number: bigint): string {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
}
