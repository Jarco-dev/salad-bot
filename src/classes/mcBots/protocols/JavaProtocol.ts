import minecraft from "minecraft-protocol";
import { SocksClient as socks } from "socks";
import { JavaPackets, ProtocolOptions } from "@/types";
import { Protocol } from "@/structures";
import { Scoreboard } from "../internalClasses/Scoreboard";
import net from "net";
import dns from "dns";

/**
 * Confirmed support for
 *  - 1.17.1
 */
export class JavaProtocol extends Protocol {
    private readonly bot: minecraft.Client;
    public server:
        | {
              host: string;
              port: number;
          }
        | undefined;

    constructor(p: ProtocolOptions<"java">) {
        super(p);

        // Info log
        if (!this.options.hideInfoLogs) {
            this.client.logger.verbose(`${this.logPrefix} initializing`);
        }

        // Get server host and port
        const server = this.getServer();
        const proxy = this.getProxy();

        // Connect to server
        this.bot = minecraft.createClient({
            host: server.host,
            port: server.port,
            version: this.options.version,
            auth: "microsoft",
            username: this.options.username,
            profilesFolder: this.client.config.BOT_CACHE_FOLDER_PATH,
            hideErrors: true,
            connect: async bot => {
                await socks.createConnection(
                    {
                        command: "connect",
                        proxy: {
                            host: proxy.host,
                            port: proxy.port,
                            type: 5
                        },
                        destination: {
                            host: server.host,
                            port: server.port
                        }
                    },
                    (err, info) => {
                        if (err) {
                            this.client.logger.error(
                                "Error while connecting to proxy",
                                err
                            );
                            return;
                        } else if (!info?.socket) {
                            this.client.logger.warn(
                                "Socket does not exist while it was expected"
                            );
                            return;
                        }

                        bot.setSocket(info?.socket);
                        bot.emit("connect");
                    }
                );
            }
        });

        this.initLogSystem();
        this.initEventPassOn();
        this.initSettings();
        this.initHealthSystem();
        this.initScoreboardSystem();
    }

    /** Handles passing on events */
    private initEventPassOn() {
        this.bot.on("login", async () => {
            this.emit("ready");
        });

        this.bot.on("end", reason => {
            this.emit("end", reason);
        });

        this.bot.on("error", err => {
            if (err.message.includes("connect ECONNREFUSED")) {
                this.emit(
                    "loginFailure",
                    this.chatMessage.fromNotch("server offline")
                );
                return;
            }
            this.emit("error", err);
        });

        this.bot.on("disconnect", (packet: JavaPackets["disconnect"]) => {
            const msg = this.chatMessage.fromNotch(packet.reason);
            this.emit("loginFailure", msg);
        });

        this.bot.on(
            "kick_disconnect",
            (packet: JavaPackets["kickDisconnect"]) => {
                const msg = this.chatMessage.fromNotch(packet.reason);
                this.emit("kick", msg);
            }
        );

        this.bot.on("chat", (packet: JavaPackets["chat"]) => {
            const msg = this.chatMessage.fromNotch(packet.message);
            this.emit("chat", msg);
        });
    }

    /** Handles sending settings */
    private initSettings() {
        this.once("ready", () => {
            setTimeout(() => {
                this.bot.write("settings", {
                    locale: "en_US",
                    viewDistance: this.options.viewDistance ?? 0,
                    chatFlags: 0,
                    chatColors: true,
                    skinParts:
                        (1 << 0) |
                        (1 << 1) |
                        (1 << 2) |
                        (1 << 3) |
                        (1 << 4) |
                        (1 << 5) |
                        (1 << 6),
                    mainHand: 1,
                    enableTextFiltering: false,
                    enableServerListing: true
                });
            }, 15000);
        });
    }

    /** Manages food, health, foodSaturation, isAlive and respawns the bot when dead */
    private initHealthSystem() {
        this.bot.on("update_health", (packet: JavaPackets["updateHealth"]) => {
            // Update values
            this.health = packet.health;
            this.food = packet.food;
            this.foodSaturation = packet.foodSaturation;

            if (this.health <= 0) this.isAlive = false;
            else if (!this.isAlive) this.isAlive = true;

            // Respawn after 1-2s if dead
            if (!this.isAlive && !this.timeouts.respawn) {
                this.timeouts.respawn = setTimeout(() => {
                    delete this.timeouts.respawn;
                    this.respawn();
                }, 1000);
            }
        });
    }

    /** Handles scoreboards */
    private initScoreboardSystem() {
        this.bot.on(
            "scoreboard_objective",
            (packet: JavaPackets["scoreboardObjective"]) => {
                // Scoreboard create
                if (packet.action === 0) {
                    const scoreboard = new Scoreboard({
                        bot: this,
                        name: packet.name,
                        title: packet.displayText
                    });
                    this.scoreboards[packet.name] = scoreboard;
                    this.emit("scoreboardCreate", scoreboard);
                }

                // Scoreboard delete
                else if (packet.action === 1) {
                    this.emit(
                        "scoreboardDelete",
                        this.scoreboards[packet.name]
                    );
                    delete this.scoreboards[packet.name];
                }

                // Title update
                else if (packet.action === 2) {
                    const scoreboard = this.scoreboards[packet.name];
                    if (!scoreboard) return;

                    const result = scoreboard.setTitle(packet.displayText);
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
            "scoreboard_display_objective",
            (packet: JavaPackets["scoreBoardDisplayObjective"]) => {
                // Add position
                if (packet.name === "") {
                    for (const key in this.scoreboards) {
                        const scoreboard = this.scoreboards[key];
                        if (
                            scoreboard.positions.includes(
                                Scoreboard.byteToPosition[packet.position]
                            )
                        ) {
                            const removed = scoreboard.removePosition(
                                packet.position
                            );
                            this.emit(
                                "scoreboardPositionRemove",
                                scoreboard,
                                removed
                            );
                        }
                    }
                }

                // Remove position
                else {
                    const scoreboard = this.scoreboards[packet.name];
                    if (!scoreboard) return;

                    const added = scoreboard.addPosition(packet.position);
                    this.emit("scoreboardPositionAdd", scoreboard, added);
                }
            }
        );

        this.bot.on(
            "scoreboard_score",
            (packet: JavaPackets["scoreboardScore"]) => {
                // create / update
                if (packet.action === 0) {
                    const scoreboard = this.scoreboards[packet.scoreName];
                    if (!scoreboard) return;

                    const result = scoreboard.setScore(
                        packet.itemName,
                        this.chatMessage.fromNotch(packet.itemName),
                        packet.value
                    );

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

                // remove
                else if (packet.action === 1) {
                    const scoreboard = this.scoreboards[packet.scoreName];
                    if (!scoreboard) return;

                    for (const key in this.scoreboards) {
                        if (
                            packet.itemName in
                            this.scoreboards[key].scoresObject
                        ) {
                            const deleted = scoreboard.deleteScore(
                                packet.itemName
                            );
                            this.emit(
                                "scoreboardScoreDelete",
                                scoreboard,
                                deleted
                            );
                        }
                    }
                }
            }
        );
    }

    private getServer(): { host: string; port: number } {
        let host: string;
        let port: number | undefined;
        switch (this.options.server) {
            case "vortex":
                host = "mc.vortexnetwork.net";
                break;
            default:
                throw new Error(
                    `Server address info for ${this.options.server} not found`
                );
        }

        // Set default port
        if (!port) port = 25565;

        // Host is already an ip or localhost & and we're using the default port
        if (net.isIPv4(host) && port === 25565 && host !== "localhost") {
            return { host, port };
        }

        // Resolve dns records
        dns.resolveSrv(`_minecraft._tcp.${host}`, (err, addresses) => {
            if (!err && addresses && addresses.length > 0) {
                return {
                    host: addresses[0].name,
                    port: addresses[0].port
                };
            }
            return;
        });

        // Return option values as the dns record(s) couldn't be resolved or don't exist
        return { host, port };
    }

    public chat(message: string): void {
        this.bot.write("chat", {
            message
        });
    }

    public respawn() {
        if (this.isAlive) {
            this.bot.emit("error", new Error("Can't respawn while alive"));
            return;
        }

        this.bot.write("client_command", { payload: 0 });
    }
}
