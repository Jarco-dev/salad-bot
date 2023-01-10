import Client from "../../index";
import { HandlerResult } from "@/types";
import {
    StringSelectMenuBuilder,
    StringSelectMenuInteraction
} from "discord.js";

export abstract class StringSelectMenuComponent {
    protected readonly client = Client;
    public readonly data: ReturnType<StringSelectMenuBuilder["toJSON"]>;
    public readonly enabled: boolean;

    protected constructor(p: {
        builder: Pick<StringSelectMenuBuilder, "toJSON">;
        enabled?: boolean;
    }) {
        this.data = p.builder.toJSON();
        this.enabled = p.enabled ?? true;
    }

    public abstract run(
        i: StringSelectMenuInteraction
    ): HandlerResult | Promise<HandlerResult>;
}
