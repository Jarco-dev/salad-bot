import { Client } from "./Client";
import { AfkBot } from "./mcBots";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Collection
} from "discord.js";
import { McUsernames, TypedEmitter } from "@/types";
import { EventEmitter } from "node:events";

type BotTypes = AfkBot;
type InternalEvents = {
    runQueued: (id: string) => void;
};

export class McBotsManager {
    public client: Client;
    public bots: Collection<string, AfkBot>;
    private queue: string[];
    private eventEmitter = new EventEmitter() as TypedEmitter<InternalEvents>;

    constructor(client: Client) {
        this.eventEmitter.setMaxListeners(25);
        this.client = client;
        this.bots = new Collection();
        this.queue = [];

        setInterval(() => {
            if (this.queue.length >= 1) {
                this.eventEmitter.emit(
                    "runQueued",
                    this.queue.shift() as string
                );
            }
        }, 5000);
    }

    public getStatus(p: {
        username: McUsernames<"java" | "bedrock">;
        server: { network: "vortex"; subServer?: "plasma" | "cosmic" };
    }): undefined | "inQueue" | "starting" | "online" {
        const inQueue = this.queue.includes(
            `${p.server.network}_${p.username}`
        );
        if (inQueue) return "inQueue";

        const bot = this.getBot(p);
        if (!bot) return undefined;
        else if (bot.status === "ready") return "online";
        else return "starting";
    }

    public getBot(p: {
        username: McUsernames<"java" | "bedrock">;
        server: { network: "vortex"; subServer?: "plasma" | "cosmic" };
    }): BotTypes | undefined {
        const botCacheId = `${p.server.network}_${p.username}`;
        return this.bots.get(botCacheId);
    }

    public async startBot(p: {
        type: "voteParty" | "autoMiner";
        server: { network: "vortex"; subServer: "plasma" | "cosmic" };
        protocol: "java" | "bedrock";
        username: McUsernames<"java" | "bedrock">;
    }): Promise<BotTypes> {
        // Validate username against protocol
        if (p.protocol === "java" && p.username.startsWith("*")) {
            throw new Error("Bedrock username provided for java protocol");
        } else if (p.protocol === "bedrock" && !p.username.startsWith("*")) {
            throw new Error("Java username provided for bedrock protocol");
        }

        // Bot isn't already being used
        if (
            this.getStatus({ username: p.username, server: p.server }) !==
            undefined
        ) {
            throw new Error(
                "Unable to start bot thats already in queue, starting or online"
            );
        }

        // Get starter function
        let startFunction: () => BotTypes;
        switch (p.type) {
            case "voteParty":
            case "autoMiner":
                startFunction = () =>
                    p.protocol === "java"
                        ? new AfkBot({
                              client: this.client,
                              type: p.type,
                              username: p.username as McUsernames<"java">,
                              protocol: "java",
                              server: p.server
                          })
                        : new AfkBot({
                              client: this.client,
                              type: p.type,
                              username: p.username as McUsernames<"bedrock">,
                              protocol: "bedrock",
                              server: p.server
                          });
                break;
        }

        // Add to queue and start when ready
        const botCacheId = `${p.server.network}_${p.username}`;
        this.queue.push(botCacheId);
        return await new Promise<BotTypes>(res => {
            const start: Parameters<
                typeof McBotsManager.prototype.eventEmitter.on<"runQueued">
            >[1] = id => {
                if (botCacheId !== id) return;
                this.eventEmitter.removeListener("runQueued", start);

                const bot = startFunction();
                this.bots.set(botCacheId, bot);
                let alerted = false;
                let wasReady = false;
                const alert = (
                    title: string,
                    field: { name: string; value: string }
                ) => {
                    if (!wasReady || alerted) {
                        return;
                    }
                    alerted = true;
                    const embed = this.client.utils
                        .defaultEmbed()
                        .setColor(this.client.config.MSG_TYPES.ERROR.COLOR)
                        .setTitle(`${p.username} ${title}`)
                        .setDescription(
                            [
                                `**Type:** ${
                                    p.type.charAt(0).toUpperCase() +
                                    p.type
                                        .split(/(?=[A-Z])/)
                                        .join(" ")
                                        .toLowerCase()
                                        .slice(1)
                                }`,
                                `**Server:** ${
                                    p.server.network.charAt(0).toUpperCase() +
                                    p.server.network.slice(1)
                                } -> ${
                                    p.server.subServer.charAt(0).toUpperCase() +
                                    p.server.subServer.slice(1)
                                }`
                            ].join("\n")
                        )
                        .setFields(field);
                    const buttons =
                        new ActionRowBuilder<ButtonBuilder>().setComponents(
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Success)
                                .setLabel("Resolve")
                                .setCustomId("MC_BOTS_ALERT_RESOLVE"),
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Secondary)
                                .setLabel("Ignore")
                                .setCustomId("MC_BOTS_ALERT_IGNORE")
                        );

                    this.client.sender.msgChannel(
                        this.client.sConfig.MC_BOT_ALERTS,
                        {
                            content: this.client.sConfig.MC_BOT_MANAGERS.map(
                                userId => `<@${userId}>`
                            ).join(" "),
                            embeds: [embed],
                            components: [buttons]
                        }
                    );
                };

                let timestamp: number;
                const reconnectDelay = 900000;
                const getTimestamp = () => {
                    const now = Date.now();
                    if (!timestamp || now - timestamp > 100) {
                        timestamp = now;
                    }
                    return timestamp;
                };

                bot.once("ready", () => {
                    wasReady = true;
                });

                bot.once("loginFailure", () => {
                    bot.end();
                    this.bots.delete(botCacheId);
                });

                bot.once("kick", msg => {
                    if (
                        !bot.lastJoinTimestamp ||
                        getTimestamp() - bot.lastJoinTimestamp >= reconnectDelay
                    ) {
                        return;
                    }

                    alert("kicked", { name: "Reason", value: msg.toString() });
                });

                bot.once("error", err => {
                    bot.end();
                    this.bots.delete(botCacheId);

                    alert("disconnected due to an error", {
                        name: "Error message",
                        value: err.message
                    });
                });

                bot.once("end", reason => {
                    this.bots.delete(botCacheId);

                    // Send alert
                    if (
                        !bot.lastJoinTimestamp ||
                        getTimestamp() - bot.lastJoinTimestamp < reconnectDelay
                    ) {
                        setTimeout(() => {
                            alert("disconnected", {
                                name: "Reason",
                                value: reason ?? "No reason given"
                            });
                        }, 100);
                        return;
                    }

                    // Restart bot
                    this.client.logger.verbose(
                        `[McBotsManager] ${p.username}: Restarting after end`
                    );
                    this.startBot(p);
                });
                res(bot);
            };
            this.eventEmitter.on("runQueued", start);
        });
    }

    public stopBot(p: {
        username: McUsernames<"java" | "bedrock">;
        server: { network: "vortex"; subServer?: "plasma" | "cosmic" };
    }): undefined | "stopped" | "dequeued" {
        switch (this.getStatus(p)) {
            case undefined:
                return;
            case "inQueue": {
                const id = `${p.server.network}_${p.username}`;
                const res = this.queue.splice(this.queue.indexOf(id), 1);
                return res.length > 0 ? "dequeued" : undefined;
            }
            case "starting":
            case "online": {
                const bot = this.bots.get(`${p.server.network}_${p.username}`);
                if (!bot) return;

                bot.end(true);
                return "stopped";
            }
        }
    }
}
