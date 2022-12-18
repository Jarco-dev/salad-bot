import { ChatInputCommandInteraction, ButtonStyle } from "discord.js";
import {
    ActionRowBuilder,
    ButtonBuilder,
    SlashCommandBuilder
} from "discord.js";
import BaseCommand from "../../utils/structures/BaseCommand";
import mineflayer from "mineflayer";

class McBotCommand extends BaseCommand {
    constructor() {
        super({
            cmdData: new SlashCommandBuilder()
                .setName("mc-bot")
                .setDescription("Manage your bot accounts")
                .addSubcommand(builder =>
                    builder
                        .setName("start")
                        .setDescription("Start a bot")
                        .addStringOption(builder =>
                            builder
                                .setName("username")
                                .setDescription(
                                    "The username of the bot you want to start"
                                )
                                .addChoices(
                                    { name: "jarcokers2", value: "jarcokers2" },
                                    {
                                        name: "SpankMyPickle",
                                        value: "SpankMyPickle"
                                    },
                                    {
                                        name: "NotReadyForLIfe",
                                        value: "NotReadyForLIfe"
                                    },
                                    {
                                        name: "ChokeOnMyPickle",
                                        value: "ChokeOnMyPickle"
                                    },
                                    {
                                        name: "Jorengamer4",
                                        value: "Jorengamer4"
                                    },
                                    { name: "NORMIE", value: "NORMIE" },
                                    { name: "DemonSht", value: "DemonSht" },
                                    {
                                        name: "StanLoonaOWO",
                                        value: "StanLoonaOWO"
                                    },
                                    {
                                        name: "tayswiftlover420",
                                        value: "tayswiftlover420"
                                    }
                                )
                                .setRequired(true)
                        )
                        .addStringOption(builder =>
                            builder
                                .setName("activity")
                                .setDescription(
                                    "What the bot will be running for"
                                )
                                .addChoices(
                                    { name: "Auto mine", value: "AUTO_MINE" },
                                    { name: "Vote party", value: "VOTE_PARTY" }
                                )
                                .setRequired(true)
                        )
                )
                .addSubcommand(builder =>
                    builder
                        .setName("stop")
                        .setDescription("Stop a bot")
                        .addStringOption(builder =>
                            builder
                                .setName("username")
                                .setDescription(
                                    "The username of the bot you want to stop"
                                )
                                .addChoices(
                                    { name: "jarcokers2", value: "jarcokers2" },
                                    {
                                        name: "SpankMyPickle",
                                        value: "SpankMyPickle"
                                    },
                                    {
                                        name: "NotReadyForLIfe",
                                        value: "NotReadyForLIfe"
                                    },
                                    {
                                        name: "ChokeOnMyPickle",
                                        value: "ChokeOnMyPickle"
                                    },
                                    {
                                        name: "Jorengamer4",
                                        value: "Jorengamer4"
                                    },
                                    { name: "NORMIE", value: "NORMIE" },
                                    { name: "DemonSht", value: "DemonSht" },
                                    {
                                        name: "StanLoonaOWO",
                                        value: "StanLoonaOWO"
                                    },
                                    {
                                        name: "tayswiftlover420",
                                        value: "tayswiftlover420"
                                    }
                                )
                                .setRequired(true)
                        )
                ),
            status: "ENABLED"
        });
    }

    async run(i: ChatInputCommandInteraction) {
        switch (i.options.getSubcommand()) {
            case "start":
                this.runStartCommand(i);
                break;
            case "stop":
                this.runStopCommand(i);
                break;
            default:
                this.client.logger.error(
                    "Error while getting subcommand",
                    new Error("Subcommand not found")
                );
                break;
        }
    }

    async runStartCommand(i: ChatInputCommandInteraction) {
        // Check permissions
        if (!this.client.sConfig.mcBotManagers.includes(i.user.id)) {
            this.sender.reply(
                i,
                {
                    content:
                        "You don't have the permissions required to run this"
                },
                { msgType: "INVALID" }
            );
            return;
        }

        // Validate options
        const username = i.options.getString("username", true);
        const activity = i.options.getString("activity", true) as
            | "AUTO_MINE"
            | "VOTE_PARTY";

        if (this.client.mcBots.cache.has(username)) {
            this.sender.reply(
                i,
                {
                    content: `The bot ${username} is already running`
                },
                { msgType: "INVALID" }
            );
            return;
        }

        const proxy =
            this.client.sConfig.proxies[
                username.toLowerCase() as keyof typeof this.sConfig.proxies
            ];
        if (!proxy) {
            this.sender.reply(
                i,
                { content: "There is no proxy setup for this account" },
                { msgType: "ERROR" }
            );
            return;
        }

        // Startup bot
        await i.deferReply({ ephemeral: true });

        const handleMsaCode: mineflayer.BotOptions["onMsaCode"] = data => {
            const embed = this.global
                .defaultEmbed()
                .setTitle("Authorization required")
                .setDescription(
                    `Please enter the code **${data.user_code}** on the website to authorize the minecraft account.\n\nMake sure to login with the correct email or you might link the wrong account to this username.`
                );

            const button = new ActionRowBuilder<ButtonBuilder>().setComponents(
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setURL(data.verification_uri)
                    .setLabel("Go to website")
            );

            i.followUp({
                embeds: [embed],
                components: [button],
                ephemeral: true
            });
        };

        const handleProxyError = () => {
            this.sender.reply(
                i,
                {
                    content:
                        "Something went wrong while connecting to the proxy"
                },
                { msgType: "ERROR", method: "EDIT_REPLY" }
            );
        };

        const bot = await this.client.mcBots.startBot({
            proxy,
            username,
            host: "mc.vortexnetwork.net",
            onMsaCode: handleMsaCode,
            onProxyError: handleProxyError
        });

        // Start listeners
        this.client.mcBots.addOptionalListeners(
            username,
            bot,
            activity,
            (success: boolean, message: string) => {
                this.sender.reply(
                    i,
                    { content: message },
                    {
                        msgType: success ? "SUCCESS" : "INVALID",
                        method: "EDIT_REPLY"
                    }
                );
            }
        );
    }

    async runStopCommand(i: ChatInputCommandInteraction) {
        // Check permissions
        if (!this.client.sConfig.mcBotManagers.includes(i.user.id)) {
            this.sender.reply(
                i,
                {
                    content:
                        "You don't have the permissions required to run this"
                },
                { msgType: "INVALID" }
            );
            return;
        }

        // Validate options
        const username = i.options.getString("username", true);

        if (!this.client.mcBots.cache.has(username)) {
            this.sender.reply(
                i,
                { content: `The bot ${username} is currently not running` },
                { msgType: "INVALID" }
            );
            return;
        }

        // Stop the bot
        const res = this.client.mcBots.stopBot(username);
        if (!res.success) {
            this.sender.reply(
                i,
                {
                    content: "Something went wrong while trying to stop the bot"
                },
                { msgType: "ERROR" }
            );
            return;
        }

        // Success
        this.sender.reply(
            i,
            { content: `The bot ${username} has been disconnected` },
            { msgType: "SUCCESS" }
        );
    }
}

export default McBotCommand;
