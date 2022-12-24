import { HandlerResult } from "@/types";
import { SelectMenuBuilder, SelectMenuInteraction } from "discord.js";
import Client from "../../index";

export abstract class SelectMenuComponent {
    protected readonly client = Client;
    public readonly data: ReturnType<SelectMenuBuilder["toJSON"]>;
    public readonly enabled: boolean;

    protected constructor(p: {
        builder: Pick<SelectMenuBuilder, "toJSON">;
        enabled?: boolean;
    }) {
        this.data = p.builder.toJSON();
        this.enabled = p.enabled ?? true;
    }

    public abstract run(
        i: SelectMenuInteraction
    ): HandlerResult | Promise<HandlerResult>;
}
