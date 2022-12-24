import { HandlerResult } from "@/types";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import Client from "../../index";

export abstract class ChatInputCommand {
    protected readonly client = Client;
    public readonly data: ReturnType<SlashCommandBuilder["toJSON"]>;
    public readonly enabled: boolean;

    protected constructor(p: {
        builder: Pick<SlashCommandBuilder, "toJSON">;
        enabled?: boolean;
    }) {
        this.data = p.builder.toJSON();
        this.enabled = p.enabled ?? true;
    }

    public abstract run(
        i: ChatInputCommandInteraction
    ): HandlerResult | Promise<HandlerResult>;
}
