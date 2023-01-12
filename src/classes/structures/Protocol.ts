import client from "../../index";
import chatMessageLoader, { ChatMessage } from "prismarine-chat";
import { EventEmitter } from "node:events";
import { ProtocolEvents, ProtocolOptions, TypedEmitter } from "@/types";
import { Scoreboard } from "../mcBots/internalClasses/Scoreboard";

export abstract class Protocol extends (EventEmitter as new () => TypedEmitter<ProtocolEvents>) {
    protected readonly client = client;
    protected readonly options: ProtocolOptions<"java" | "bedrock">;
    protected readonly logPrefix: string;
    protected timeouts: {
        respawn?: NodeJS.Timeout;
    };

    public readonly chatMessage: typeof ChatMessage;
    public isAlive: boolean;
    public health: number;
    public food: number;
    public foodSaturation: number;
    public scoreboards: { [key: string]: Scoreboard };
    public safeEnd: boolean;

    protected constructor(p: ProtocolOptions<"java" | "bedrock">) {
        super();

        this.options = p;
        this.logPrefix = this.getLogPrefix();
        this.scoreboards = {};
        this.timeouts = {};
        this.chatMessage = chatMessageLoader(this.options.version);

        this.isAlive = false;
        this.health = 0;
        this.food = 0;
        this.foodSaturation = 0;
        this.safeEnd = false;
    }

    private getLogPrefix() {
        return `[${
            this.options.protocol.charAt(0).toUpperCase() +
            this.options.protocol.substring(1).toLowerCase()
        }Protocol] ${this.options.username}:`;
    }

    /** Handles info logs & error logs */
    protected initLogSystem(): void {
        this.once("ready", () => {
            if (!this.options.hideInfoLogs) {
                this.client.logger.verbose(`${this.logPrefix} is ready`);
            }
        });

        this.on("loginFailure", msg => {
            if (!this.options.hideInfoLogs) {
                this.client.logger.verbose(
                    `${this.logPrefix} failed to join server`,
                    msg.toString()
                );
            }
        });

        this.on("kick", msg => {
            if (!this.options.hideInfoLogs) {
                this.client.logger.verbose(
                    `${this.logPrefix} kicked from server`,
                    msg.toString()
                );
            }
        });

        this.on("end", reason => {
            // Info log
            if (!this.options.hideInfoLogs) {
                this.client.logger.verbose(
                    `${this.logPrefix} ended - ${reason}`
                );
            }
        });

        this.on("error", err => {
            // Info log
            if (!this.options.hideErrorLogs) {
                this.client.logger.error(`${this.logPrefix} errored`, err);
            }
        });
    }

    protected getProxy(): { host: string; port: number } {
        switch (this.options.protocol) {
            case "java": {
                return this.client.proxiesConfig.java[
                    this.options
                        .username as keyof typeof this.client.proxiesConfig.java
                ];
            }

            case "bedrock": {
                return this.client.proxiesConfig.bedrock[
                    this.options.server.toLowerCase() as keyof typeof this.client.proxiesConfig.bedrock
                ][
                    this.options
                        .username as keyof typeof this.client.proxiesConfig.bedrock[keyof typeof this.client.proxiesConfig.bedrock]
                ];
            }
        }
    }
}
