import { HandlerResult } from "@/types";
import { ButtonComponent } from "@/structures";
import {
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    EmbedBuilder
} from "discord.js";

export default class AlertIgnoreButtonComponent extends ButtonComponent {
    constructor() {
        super({
            builder: new ButtonBuilder()
                .setCustomId("MC_BOTS_ALERT_IGNORE")
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Ignore")
        });
    }

    public run(i: ButtonInteraction): HandlerResult | Promise<HandlerResult> {
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

        // Update embed
        const embed = EmbedBuilder.from(i.message.embeds[0]);
        embed.setTitle(embed.data.title + " (Ignored)");
        embed.setColor(this.client.config.COLORS.DEFAULT);
        this.client.sender.reply(
            i,
            { embeds: [embed], components: [] },
            { method: "UPDATE" }
        );

        // Success
        return { result: "SUCCESS" };
    }
}
