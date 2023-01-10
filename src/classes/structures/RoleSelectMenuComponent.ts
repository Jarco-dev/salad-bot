import Client from "../../index";
import { HandlerResult } from "@/types";
import { RoleSelectMenuBuilder, RoleSelectMenuInteraction } from "discord.js";

export abstract class RoleSelectMenuComponent {
    protected readonly client = Client;
    public readonly data: ReturnType<RoleSelectMenuBuilder["toJSON"]>;
    public readonly enabled: boolean;

    protected constructor(p: {
        builder: Pick<RoleSelectMenuBuilder, "toJSON">;
        enabled?: boolean;
    }) {
        this.data = p.builder.toJSON();
        this.enabled = p.enabled ?? true;
    }

    public abstract run(
        i: RoleSelectMenuInteraction
    ): HandlerResult | Promise<HandlerResult>;
}
