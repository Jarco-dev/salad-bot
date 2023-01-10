import Client from "../../index";
import { HandlerResult } from "@/types";
import {
    MentionableSelectMenuBuilder,
    MentionableSelectMenuInteraction
} from "discord.js";

export abstract class MentionableSelectMenuComponent {
    protected readonly client = Client;
    public readonly data: ReturnType<MentionableSelectMenuBuilder["toJSON"]>;
    public readonly enabled: boolean;

    protected constructor(p: {
        builder: Pick<MentionableSelectMenuBuilder, "toJSON">;
        enabled?: boolean;
    }) {
        this.data = p.builder.toJSON();
        this.enabled = p.enabled ?? true;
    }

    public abstract run(
        i: MentionableSelectMenuInteraction
    ): HandlerResult | Promise<HandlerResult>;
}
