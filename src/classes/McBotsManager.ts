import { Client } from "./Client";
import { AfkBot } from "./mcBots";
import { Collection } from "discord.js";
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
                this.client.logger.debug("Queue", this.queue);
                this.client.logger.debug("Cache", [...this.bots.keys()]);
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
            const start = (id: string) => {
                if (botCacheId !== id) return;
                this.eventEmitter.removeListener("runQueued", start);

                const bot = startFunction();
                this.bots.set(botCacheId, bot);

                bot.once("loginFailure", () => {
                    bot.end();
                    this.bots.delete(botCacheId);
                });

                bot.once("end", () => {
                    this.bots.delete(botCacheId);
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

                bot.end();
                return "stopped";
            }
        }
    }
}
