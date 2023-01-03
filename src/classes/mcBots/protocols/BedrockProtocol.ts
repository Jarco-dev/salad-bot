import bedrock from "bedrock-protocol";
import { BedrockPackets, ProtocolOptions } from "@/types";
import { Protocol } from "@/structures";
import { Scoreboard } from "../internalClasses/Scoreboard";

/**
 * Confirmed support for
 *  - 1.19.50
 */
export class BedrockProtocol extends Protocol {
    private readonly bot: bedrock.Client;

    constructor(p: ProtocolOptions<"bedrock">) {
        super(p);

        // Info log
        if (!this.options.hideInfoLogs) {
            this.client.logger.verbose(`${this.logPrefix} initializing`);
        }

        // Connect to server
        const proxy = this.getProxy();
        this.bot = bedrock.createClient({
            host: proxy.host,
            port: proxy.port,
            version: this.options.version,
            username: this.options.username,
            profilesFolder: this.client.config.BOT_CACHE_FOLDER_PATH,
            conLog: null
        } as unknown as bedrock.ClientOptions); // TODO: Remove forced type

        this.initLogSystem();
        this.initEventPassOn();
        this.initSettings();
        this.initHealthSystem();
        this.initScoreboardSystem();
    }

    /** Handles passing on events */
    private initEventPassOn() {
        this.bot.on("spawn", () => {
            this.emit("ready");
        });

        this.bot.on("close", () => {
            this.emit("end", "Unknown reason");
        });

        this.bot.on("error", err => {
            if (err.message === "Ping timed out") {
                this.emit(
                    "loginFailure",
                    this.chatMessage.fromNotch("server offline")
                );
                return;
            }
            this.emit("error", err);
        });

        this.bot.on("play_status", (packet: BedrockPackets["playStatus"]) => {
            // Only emit if it's a failed status
            if (packet.status.includes("failed")) {
                const statusToMsg = {
                    failed_client: "Client outdated",
                    failed_spawn: "Server outdated",
                    failed_invalid_tenant:
                        "School doesn't have access to server",
                    failed_vanilla_edu:
                        "Vanilla client can't join educational server",
                    failed_edu_vanilla:
                        "Educational client can't join vanilla server",
                    failed_server_full: "Server is full",
                    failed_editor_vanilla_mismatch:
                        "Editor client can't join vanilla server",
                    failed_vanilla_editor_mismatch:
                        "Vanilla client can't join editor server"
                };
                const msg = this.chatMessage.fromNotch(
                    statusToMsg[packet.status as keyof typeof statusToMsg]
                );
                this.emit("loginFailure", msg);
            }
        });

        this.bot.on("disconnect", (packet: BedrockPackets["disconnect"]) => {
            const msg = this.chatMessage.fromNotch(
                packet.message ?? "Unknown reason"
            );
            this.emit("kick", msg);
        });

        this.bot.on("text", (packet: BedrockPackets["text"]) => {
            const msg = this.chatMessage.fromNotch(packet.message);
            this.emit("chat", msg);
        });
    }

    /** Handles setting viewDistance */
    private initSettings() {
        this.once("ready", () => {
            this.bot.queue("request_chunk_radius", {
                chunk_radius: this.options.viewDistance ?? 6
            });
        });
    }

    /** Manages food, health, foodSaturation, isAlive and respawns the bot when dead */
    private initHealthSystem() {
        this.bot.on(
            "update_attributes",
            (packet: BedrockPackets["updateAttributes"]) => {
                // Only process attribute updates for our bot
                if (packet.runtime_entity_id !== this.bot.entityId) return;

                // Process attributes
                for (const attribute of packet.attributes) {
                    // Only process needed attributes
                    if (
                        ![
                            "minecraft:health",
                            "minecraft:player.hunger",
                            "minecraft:player.saturation"
                        ].includes(attribute.name)
                    ) {
                        continue;
                    }

                    switch (attribute.name) {
                        case "minecraft:health":
                            // Update values
                            this.health = attribute.current;
                            if (this.health <= 0) this.isAlive = false;
                            else if (!this.isAlive) this.isAlive = true;

                            // Respawn after 1-2s if dead
                            if (!this.isAlive && !this.timeouts.respawn) {
                                this.timeouts.respawn = setTimeout(() => {
                                    delete this.timeouts.respawn;
                                    this.respawn();
                                }, 1000);
                            } else if (this.isAlive && this.timeouts.respawn) {
                                clearTimeout(this.timeouts.respawn);
                                delete this.timeouts.respawn;
                            }
                            break;
                        case "minecraft:player.hunger":
                            this.food = attribute.current;
                            break;
                        case "minecraft:player.saturation":
                            this.foodSaturation = attribute.current;
                            break;
                    }
                }
            }
        );
    }

    /** Handles scoreboards */
    private initScoreboardSystem() {
        this.bot.on(
            "set_display_objective",
            (packet: BedrockPackets["setDisplayObjective"]) => {
                // Scoreboard create
                let scoreboard = this.scoreboards[packet.objective_name];
                if (!scoreboard) {
                    scoreboard = new Scoreboard({
                        bot: this,
                        name: packet.objective_name,
                        title: packet.display_name,
                        position: packet.display_slot
                    });
                    this.scoreboards[packet.objective_name] = scoreboard;
                    this.emit("scoreboardCreate", scoreboard);
                }

                // Title update
                else {
                    const result = scoreboard.setTitle(packet.display_name);
                    this.emit(
                        "scoreboardTitleUpdate",
                        scoreboard,
                        result.oldTitle,
                        result.newTitle
                    );
                }
            }
        );

        this.bot.on(
            "remove_objective",
            (packet: BedrockPackets["removeDisplayObjective"]) => {
                this.emit(
                    "scoreboardDelete",
                    this.scoreboards[packet.objective_name]
                );
                delete this.scoreboards[packet.objective_name];
            }
        );

        this.bot.on("set_score", (packet: BedrockPackets["setScore"]) => {
            if (packet.action === "change") {
                for (const entry of packet.entries) {
                    const scoreboard = this.scoreboards[entry.objective_name];
                    if (!scoreboard) return;

                    let result;
                    if (entry!.entry_type === "fake_player") {
                        result = scoreboard.setScore(
                            entry.scoreboard_id.toString(),
                            this.chatMessage.fromNotch(entry.custom_name),
                            entry.score
                        );
                    } else {
                        result = scoreboard.setScore(
                            entry.scoreboard_id.toString(),
                            this.chatMessage.fromNotch(
                                entry.entity_unique_id.toString()
                            ),
                            entry.score
                        );
                    }

                    if (result.oldScore) {
                        this.emit(
                            "scoreboardScoreUpdate",
                            scoreboard,
                            result.oldScore,
                            result.newScore
                        );
                    } else {
                        this.emit(
                            "scoreboardScoreCreate",
                            scoreboard,
                            result.newScore
                        );
                    }
                }
            } else {
                for (const entry of packet.entries) {
                    const scoreboard = this.scoreboards[entry.objective_name];
                    if (!scoreboard) {
                        this.emit(
                            "error",
                            new Error("Scoreboard for score update not found")
                        );
                        return;
                    }

                    const deleted = scoreboard.deleteScore(
                        entry.scoreboard_id.toString()
                    );
                    this.emit("scoreboardScoreDelete", scoreboard, deleted);
                }
            }
        });

        this.bot.on("set_scoreboard_identity", () => {
            this.client.logger.warn(
                `${this.logPrefix} set_scoreboard_identity triggered, scoreboard might be out of sync`
            );
        });
    }

    public chat(message: string): void {
        this.bot.queue("text", {
            type: "chat",
            needs_translation: true,
            source_name: (this.bot as any).username,
            xuid: (this.bot as any).profile.xuid,
            platform_chat_id: "",
            message
        });
    }

    public respawn(): void {
        if (this.isAlive) {
            this.bot.emit("error", new Error("Can't respawn while alive"));
            return;
        }

        this.bot.queue("respawn", {
            position: { x: 0, y: 0, z: 0 },
            state: 2,
            runtime_entity_id: this.bot.entityId
        });
    }
}
