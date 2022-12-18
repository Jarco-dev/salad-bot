import Client from "../Client";
import mineflayer, { Bot } from "mineflayer";
import { Collection } from "discord.js";
import { SocksClient as socks } from "socks";
import { ProxyOptions } from "../types";

class McBotManager {
    private client: Client;
    public readonly cache = new Collection<
        string,
        ReturnType<typeof mineflayer.createBot>
    >();

    constructor(client: Client) {
        this.client = client;
    }

    public startBot({
        proxy,
        username,
        host,
        port,
        onMsaCode,
        onProxyError
    }: {
        proxy: ProxyOptions;
        username: string;
        host: string;
        port?: number;
        onMsaCode?: mineflayer.BotOptions["onMsaCode"];
        onProxyError?: (err: Error) => void;
    }): Bot {
        const bot = mineflayer.createBot({
            connect: async bot => {
                await socks.createConnection(
                    {
                        command: "connect",
                        proxy: {
                            ...proxy,
                            type: 5
                        },
                        destination: {
                            host: host,
                            port: port ?? 25565
                        }
                    },
                    (err, info) => {
                        if (err) {
                            this.client.logger.error(
                                "Error while connecting to proxy",
                                err
                            );
                            if (onProxyError) onProxyError(err);
                            return;
                        } else if (!info?.socket) {
                            this.client.logger.warn(
                                "Socket does not exist while it was expected"
                            );
                            return;
                        }

                        bot.setSocket(info?.socket);
                        bot.emit("connect");
                        bot.on("end", () => {
                            info.socket.end();
                        });
                    }
                );
            },
            onMsaCode: data => {
                if (onMsaCode) onMsaCode(data);
            },
            auth: "microsoft",
            version: "1.8.9",
            profilesFolder: this.client.config.botAccountCacheFolder,
            hideErrors: true,
            host,
            port,
            username
        });

        this.addRequiredListeners(username, bot);
        return bot;
    }

    public stopBot(
        username: string
    ): { success: true } | { success: false; reason: string } {
        const bot = this.cache.get(username);
        if (!bot) {
            return {
                success: false,
                reason: "Bot not found in cache"
            };
        }

        bot.quit("byCommand");
        return { success: true };
    }

    private addRequiredListeners(username: string, bot: Bot) {
        bot.on("login", () => {
            this.cache.set(username, bot);
            this.client.logger.verbose(`[${username}] Logged in`);
        });

        bot.on("end", reason => {
            this.client.logger.verbose(`[${username}] Ended`);
            bot.removeAllListeners();
            this.cache.delete(username);

            try {
                // Bot did not end intentionally
                if (reason === "botFailedChecks" || reason === "byCommand") {
                    return;
                }

                // Warn mc bot managers
                const embed = this.client.global
                    .defaultEmbed()
                    .setTitle(`Bot ${username} disconnected`)
                    .addFields({ name: "Reason", value: reason });
                this.client.sender.msgMcBotManagers({ embeds: [embed] });
            } catch (err) {
                this.client.logger.error("Error in required end listener", err);
            }
        });

        bot.on("kicked", reason => {
            this.client.logger.verbose(`[${username}] Kicked`);
            this.cache.delete(username);

            try {
                // Warn mc bot managers
                const embed = this.client.global
                    .defaultEmbed()
                    .setTitle(`Bot ${username} kicked`)
                    .addFields({ name: "Reason", value: reason });
                this.client.sender.msgMcBotManagers({ embeds: [embed] });
            } catch (err) {
                this.client.logger.error(
                    "Error in required kicked listener",
                    err
                );
            }
        });

        bot.on("error", err => {
            this.client.logger.verbose(`[${username}] Errored`);
            this.cache.delete(username);
            this.client.logger.error("Error in bot process", err);
        });
    }

    public async addOptionalListeners(
        username: string,
        bot: Bot,
        type: "AUTO_MINE" | "VOTE_PARTY",
        handleResponse?: (success: boolean, message: string) => void
    ) {
        switch (type) {
            case "AUTO_MINE": {
                let status: "waiting" | "inQueue" | "inPlasma" | "afkMining" =
                    "waiting";
                bot.on("login", async () => {
                    // Switch servers
                    if (status === "waiting") {
                        bot.chat("/plasma");
                        status = "inQueue";
                    }
                });

                bot.on("title", title => {
                    // Parse title
                    let data: string | ReturnType<JSON["parse"]>;
                    try {
                        data = JSON.parse(title);
                    } catch (err) {
                        data = title;
                    }

                    // Bot joined plasma
                    if (
                        status !== "inQueue" ||
                        typeof data !== "object" ||
                        !Array.isArray(data.extra) ||
                        data.extra.length === 0 ||
                        data.extra[0].text !== "Plasma Planet"
                    ) {
                        return;
                    }
                    status = "inPlasma";

                    // Check for pickaxe in hand
                    if (status === "inPlasma" && bot.heldItem?.type !== 278) {
                        bot.quit("botFailedChecks");
                        if (handleResponse)
                            handleResponse(
                                false,
                                "The bot isn't holding a pickaxe, please fix this"
                            );
                        return;
                    }

                    // Execute /auto
                    bot.chat("/auto");
                    status = "afkMining";
                    if (handleResponse)
                        handleResponse(
                            true,
                            "The bot has now started afk mining"
                        );
                });
                break;
            }

            case "VOTE_PARTY": {
                let status: "waiting" | "inQueue" | "inPlasma" | "afking" =
                    "waiting";
                bot.on("login", async () => {
                    // Switch servers
                    if (status === "waiting") {
                        bot.chat("/plasma");
                        status = "inQueue";
                    }
                });

                bot.on("title", title => {
                    // Parse title
                    let data: string | ReturnType<JSON["parse"]>;
                    try {
                        data = JSON.parse(title);
                    } catch (err) {
                        data = title;
                    }

                    // Bot joined plasma
                    if (
                        status !== "inQueue" ||
                        typeof data !== "object" ||
                        !Array.isArray(data.extra) ||
                        data.extra.length === 0 ||
                        data.extra[0].text !== "Plasma Planet"
                    )
                        return;
                    status = "inPlasma";

                    // Execute /home afk
                    bot.chat("/home afk");
                    status = "afking";
                    if (handleResponse)
                        handleResponse(
                            true,
                            "The bot has now started afking for vote parties"
                        );
                });
                break;
            }

            default: {
                throw new Error("Invalid listener group type");
            }
        }
    }
}

export default McBotManager;
