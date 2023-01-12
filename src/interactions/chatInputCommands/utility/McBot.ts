import type { HandlerResult, McUsernames } from "@/types";
import { ChatInputCommand } from "@/structures";
import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} from "discord.js";
import { AfkBot } from "@/classes";

export default class McBotChatInputCommand extends ChatInputCommand {
    private readonly usernames = [
        "jarcokers2",
        "spankmypickle",
        "notreadyforlife",
        "chokeonmypickle",
        "*jarcokers2",
        "*jarcoalt1",
        "*jarcoalt2",
        "*jarcoalt3",
        "jorengamer4",
        "n0rmie",
        "demonsht",
        "stanloonaowo",
        "tayswiftlover420",
        "*jorengamer4",
        "*joren4537",
        "*joren4133",
        "*joren5801",
        "*joren2999"
    ] as const;

    private readonly usernamePresets = {
        all: this.usernames as unknown as McUsernames<"java" | "bedrock">[],
        mains: ["jarcokers2", "jorengamer4"] as McUsernames<
            "java" | "bedrock"
        >[],
        alts: [
            "spankmypickle",
            "notreadyforlife",
            "chokeonmypickle",
            "*jarcokers2",
            "*jarcoalt1",
            "*jarcoalt2",
            "*jarcoalt3",
            "n0rmie",
            "demonsht",
            "stanloonaowo",
            "tayswiftlover420",
            "*jorengamer4",
            "*joren4537",
            "*joren4133",
            "*joren5801",
            "*joren2999"
        ] as McUsernames<"java" | "bedrock">[],
        jarcoAlts: [
            "spankmypickle",
            "notreadyforlife",
            "chokeonmypickle",
            "*jarcokers2",
            "*jarcoalt1",
            "*jarcoalt2",
            "*jarcoalt3"
        ] as McUsernames<"java" | "bedrock">[],
        jorenAlts: [
            "n0rmie",
            "demonsht",
            "stanloonaowo",
            "tayswiftlover420",
            "*jorengamer4",
            "*joren4537",
            "*joren4133",
            "*joren5801",
            "*joren2999"
        ] as McUsernames<"java" | "bedrock">[]
    };

    constructor() {
        super({
            builder: new SlashCommandBuilder()
                .setName("mc-bot")
                .setDescription("Manage the minecraft bots")
                .addSubcommand(builder =>
                    builder
                        .setName("start")
                        .setDescription("Start one or multiple minecraft bots")
                )
                .addSubcommand(builder =>
                    builder
                        .setName("stop")
                        .setDescription("Stop one or multiple minecraft bots")
                )
        });
    }

    public run(
        i: ChatInputCommandInteraction
    ): HandlerResult | Promise<HandlerResult> {
        // Check permissions
        if (!this.client.sConfig.MC_BOT_MANAGERS.includes(i.user.id)) {
            this.client.sender.reply(
                i,
                {
                    content:
                        "You don't have the permissions required to run this"
                },
                { msgType: "INVALID" }
            );
            return { result: "USER_MISSING_PERMISSIONS" };
        }

        // Run command handler
        switch (i.options.getSubcommand(true)) {
            case "start":
                return this.runStartCommand(i);
            case "stop":
                return this.runStopCommand(i);
            default:
                return {
                    result: "ERRORED",
                    note: "Unable to find correct sub command handler",
                    error: new Error("Subcommand not found")
                };
        }
    }

    public async runStartCommand(
        i: ChatInputCommandInteraction
    ): Promise<HandlerResult> {
        // Create embeds and components
        const embed = this.client.utils
            .defaultEmbed()
            .setTitle("Mc bot start menu");

        const typeMenu =
            new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("MC_BOTS_TYPE")
                    .setPlaceholder("Select a bot type")
                    .setOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Vote party")
                            .setDescription(
                                "Keeps the bot(s) online to collect keys from vote parties"
                            )
                            .setValue("voteParty"),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Auto mine")
                            .setDescription(
                                "Keeps the bot(s) online in the auto miner"
                            )
                            .setValue("autoMiner")
                    )
            );

        const serverMenu =
            new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("MC_BOTS_SERVER")
                    .setPlaceholder("Select a server")
                    .setOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Vortex -> Plasma")
                            .setValue("vortex:plasma"),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Vortex -> Cosmic")
                            .setValue("vortex:cosmic")
                    )
            );

        const usernamesMenu =
            new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("MC_BOTS_USERNAMES")
                    .setPlaceholder("Select usernames")
                    .setMinValues(1)
                    .setMaxValues(18)
                    .setOptions(
                        this.usernames.map(username =>
                            new StringSelectMenuOptionBuilder()
                                .setLabel(username)
                                .setValue(username)
                        )
                    )
            );

        const usernamesButtons =
            new ActionRowBuilder<ButtonBuilder>().setComponents(
                new ButtonBuilder()
                    .setCustomId("MC_BOTS_USERNAMES_ALL")
                    .setLabel("Select all")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("MC_BOTS_USERNAMES_MAINS")
                    .setLabel("Select mains")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("MC_BOTS_USERNAMES_ALTS")
                    .setLabel("Select alts")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("MC_BOTS_USERNAMES_ALTS_JARCO")
                    .setLabel("Select Jarco's alts")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("MC_BOTS_USERNAMES_ALTS_JOREN")
                    .setLabel("Select Joren's alts")
                    .setStyle(ButtonStyle.Secondary)
            );

        const actionButtons =
            new ActionRowBuilder<ButtonBuilder>().setComponents(
                new ButtonBuilder()
                    .setCustomId("MC_BOTS_CONFIRM")
                    .setLabel("Confirm")
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId("MC_BOTS_CANCEL")
                    .setLabel("Cancel")
                    .setStyle(ButtonStyle.Danger)
            );

        // Handle interactions
        const reply = await this.client.sender.reply(i, {
            embeds: [embed],
            components: [
                typeMenu,
                serverMenu,
                usernamesMenu,
                usernamesButtons,
                actionButtons
            ],
            fetchReply: true
        });
        if (!reply) {
            return { result: "OTHER", note: "Unable to sent reply message" };
        }

        const c = reply.createMessageComponentCollector({
            time: 120000,
            idle: 30000,
            filter: i2 => i.user.id === i2.user.id,
            dispose: true
        });

        let type: "voteParty" | "autoMiner";
        let server: { network: "vortex"; subServer: "cosmic" | "plasma" };
        let usernames: McUsernames<"java" | "bedrock">[] = [];
        c.on("collect", i2 => {
            // Type menu
            if (i2.isStringSelectMenu() && i2.customId === "MC_BOTS_TYPE") {
                switch (i2.values[0]) {
                    case "voteParty":
                        type = "voteParty";
                        typeMenu.components[0].options[0].setDefault(true);
                        typeMenu.components[0].options[1].setDefault(false);
                        break;
                    case "autoMiner":
                        type = "autoMiner";
                        typeMenu.components[0].options[0].setDefault(false);
                        typeMenu.components[0].options[1].setDefault(true);
                        break;
                }
            }

            // Server menu
            else if (
                i2.isStringSelectMenu() &&
                i2.customId === "MC_BOTS_SERVER"
            ) {
                switch (i2.values[0]) {
                    case "vortex:plasma":
                        server = { network: "vortex", subServer: "plasma" };
                        serverMenu.components[0].options[0].setDefault(true);
                        serverMenu.components[0].options[1].setDefault(false);
                        break;
                    case "vortex:cosmic":
                        server = { network: "vortex", subServer: "cosmic" };
                        serverMenu.components[0].options[0].setDefault(false);
                        serverMenu.components[0].options[1].setDefault(true);
                        break;
                }
            }

            // Usernames menu
            else if (
                i2.isStringSelectMenu() &&
                i2.customId === "MC_BOTS_USERNAMES"
            ) {
                usernames = i2.values as unknown as McUsernames<
                    "java" | "bedrock"
                >[];
                usernamesMenu.components[0].options.forEach(o => {
                    o.setDefault(
                        usernames.includes(
                            o.data.value as McUsernames<"java" | "bedrock">
                        )
                    );
                });
            }

            // Usernames buttons
            else if (
                i2.isButton() &&
                i2.customId.startsWith("MC_BOTS_USERNAMES_")
            ) {
                switch (i2.customId) {
                    case "MC_BOTS_USERNAMES_ALL":
                        usernames = this.usernamePresets.all;
                        break;
                    case "MC_BOTS_USERNAMES_MAINS":
                        usernames = this.usernamePresets.mains;
                        break;
                    case "MC_BOTS_USERNAMES_ALTS":
                        usernames = this.usernamePresets.alts;
                        break;
                    case "MC_BOTS_USERNAMES_ALTS_JARCO":
                        usernames = this.usernamePresets.jarcoAlts;
                        break;
                    case "MC_BOTS_USERNAMES_ALTS_JOREN":
                        usernames = this.usernamePresets.jorenAlts;
                        break;
                }
                usernamesMenu.components[0].options.forEach(o => {
                    o.setDefault(
                        usernames.includes(
                            o.data.value as McUsernames<"java" | "bedrock">
                        )
                    );
                });
            }

            // Confirm button
            else if (i2.isButton() && i2.customId === "MC_BOTS_CONFIRM") {
                // Check if none are already running
                const running = usernames.filter(
                    (username: McUsernames<"java" | "bedrock">) =>
                        this.client.mcBots.getStatus({
                            username,
                            server
                        }) !== undefined
                );
                if (running.length > 0) {
                    const embed = this.client.utils
                        .defaultEmbed()
                        .setColor(this.client.config.MSG_TYPES.INVALID.COLOR)
                        .setTitle(
                            running.length === 1
                                ? `${running.length} bot is already on this network`
                                : `${running.length} bots are already on this network`
                        )
                        .setDescription(
                            `**Please stop or remove the following bot(s)**\`\`\`${running.join(
                                "\n"
                            )}\`\`\``
                        );
                    this.client.sender.reply(
                        i2,
                        { embeds: [embed] },
                        { method: "UPDATE" }
                    );
                    return;
                }

                // Stop collector
                c.stop("Confirm clicked");

                // Update embed & create button
                let updateMsg = false;
                embed.setTitle(`Starting ${usernames.length} bot(s)`);
                embed.setDescription(
                    [
                        `**Type:** ${
                            typeMenu.components[0].options.find(
                                o => o.data.value === type
                            )?.data.label
                        }`,
                        `**Server:** ${
                            serverMenu.components[0].options.find(
                                o =>
                                    o.data.value ===
                                    `${server.network}:${server.subServer}`
                            )?.data.label
                        }`
                    ].join("\n")
                );
                embed.setFields(
                    ...usernames.map(u => ({
                        name: u,
                        value: "Adding to queue",
                        inline: true
                    }))
                );
                updateMsg = true;

                const linkButton =
                    new ActionRowBuilder<ButtonBuilder>().setComponents(
                        new ButtonBuilder()
                            .setURL("https://www.microsoft.com/link")
                            .setStyle(ButtonStyle.Link)
                            .setLabel("Login")
                    );

                // Automatically update message when needed
                const doneBots: McUsernames<"java" | "bedrock">[] = [];
                let showMsaButton = false;
                const update = () =>
                    this.client.sender.reply(
                        i,
                        {
                            embeds: [embed],
                            components: showMsaButton ? [linkButton] : []
                        },
                        { method: "EDIT_REPLY" }
                    );
                const interval = setInterval(() => {
                    if (doneBots.length === usernames.length) {
                        clearInterval(interval);
                        embed.setTitle(`Started ${usernames.length} bot(s)`);
                        updateMsg = true;
                    }
                    if (updateMsg) {
                        update().catch(() => {
                            clearInterval(interval);
                        });
                    }
                }, 2500);
                setTimeout(() => {
                    clearInterval(interval);
                    usernames
                        .filter(u => !doneBots.includes(u))
                        .forEach(u => {
                            embed.data.fields![usernames.indexOf(u)].value =
                                "Canceled due to command timeout";
                            this.client.mcBots.stopBot({
                                username: u,
                                server
                            });
                        });
                    update().catch(() => {});
                }, 600000);
                update();

                // Start bots
                usernames.forEach(async username => {
                    const fieldIndex = usernames.indexOf(username);
                    embed.data.fields![fieldIndex].value = "Queued";
                    updateMsg = true;

                    const bot = await this.client.mcBots.startBot({
                        username,
                        type,
                        server,
                        protocol: username.startsWith("*") ? "bedrock" : "java"
                    });

                    const onStatusUpdate: Parameters<
                        typeof AfkBot.prototype.on<"statusUpdate">
                    >[1] = (_, newStatus) => {
                        updateMsg = true;
                        switch (newStatus) {
                            case "ready":
                                embed.data.fields![fieldIndex].value = "Ready";
                                markAsDone();
                                break;
                            case "inHub":
                                embed.data.fields![fieldIndex].value =
                                    "In the hub";
                                break;
                            case "joining":
                                embed.data.fields![fieldIndex].value =
                                    "Joining the network";
                                break;
                            case "inCosmic":
                            case "inPlasma":
                                embed.data.fields![fieldIndex].value =
                                    "In sub server";
                                break;
                            case "offline":
                                embed.data.fields![fieldIndex].value =
                                    "Offline (Ended)";
                                break;
                        }
                    };

                    const onMsaCode: Parameters<
                        typeof AfkBot.prototype.on<"msaCode">
                    >[1] = data => {
                        showMsaButton = true;
                        embed.data.fields![fieldIndex].value = [
                            "Awaiting authentication",
                            `Please login using the code **${data.user_code}**`
                        ].join("\n");
                    };

                    const onError: Parameters<
                        typeof AfkBot.prototype.on<"error">
                    >[1] = () => {
                        embed.data.fields![fieldIndex].value = "Errored";
                        updateMsg = true;
                        markAsDone();
                    };

                    const onLoginFailure: Parameters<
                        typeof AfkBot.prototype.on<"loginFailure">
                    >[1] = msg => {
                        embed.data.fields![fieldIndex].value = msg.toString();
                        updateMsg = true;
                        markAsDone();
                    };

                    const markAsDone = () => {
                        if (!doneBots.includes(username)) {
                            doneBots.push(username);
                            bot.removeListener("statusUpdate", onStatusUpdate);
                            bot.removeListener("msaCode", onMsaCode);
                            bot.removeListener("end", () => markAsDone());
                            bot.removeListener("error", onError);
                            bot.removeListener("loginFailure", onLoginFailure);
                        }
                    };

                    bot.on("statusUpdate", onStatusUpdate);
                    bot.on("msaCode", onMsaCode);
                    bot.on("end", () => markAsDone());
                    bot.on("error", onError);
                    bot.on("loginFailure", onLoginFailure);
                });
                return;
            }

            // Cancel button
            else if (i2.isButton() && i2.customId === "MC_BOTS_CANCEL") {
                c.stop("Cancel clicked");
                typeMenu.components[0].setDisabled(true);
                serverMenu.components[0].setDisabled(true);
                usernamesMenu.components[0].setDisabled(true);
                usernamesButtons.components.forEach(c => c.setDisabled(true));
                actionButtons.components.forEach(c => c.setDisabled(true));
            }

            // Update components
            if (type && server && usernames.length > 0) {
                actionButtons.components[0].setDisabled(false);
            }
            this.client.sender.reply(
                i2,
                {
                    embeds: [embed],
                    components: [
                        typeMenu,
                        serverMenu,
                        usernamesMenu,
                        usernamesButtons,
                        actionButtons
                    ]
                },
                { method: "UPDATE" }
            );
        });

        c.on("end", (_, reason) => {
            if (["idle", "time"].includes(reason)) {
                typeMenu.components[0].setDisabled(true);
                serverMenu.components[0].setDisabled(true);
                usernamesMenu.components[0].setDisabled(true);
                usernamesButtons.components.forEach(c => c.setDisabled(true));
                actionButtons.components.forEach(c => c.setDisabled(true));
                this.client.sender.reply(
                    i,
                    {
                        components: [
                            typeMenu,
                            serverMenu,
                            usernamesMenu,
                            usernamesButtons,
                            actionButtons
                        ]
                    },
                    { method: "EDIT_REPLY" }
                );
            }
        });

        // Success
        return { result: "SUCCESS" };
    }

    public async runStopCommand(
        i: ChatInputCommandInteraction
    ): Promise<HandlerResult> {
        // Create embeds and components
        const embed = this.client.utils
            .defaultEmbed()
            .setTitle("Mc bot stop menu");

        const serverMenu =
            new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("MC_BOTS_SERVER")
                    .setPlaceholder("Select a network")
                    .setOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Vortex")
                            .setValue("vortex")
                    )
            );

        const usernamesMenu =
            new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("MC_BOTS_USERNAMES")
                    .setPlaceholder("Select usernames")
                    .setMinValues(1)
                    .setMaxValues(18)
                    .setOptions(
                        this.usernames.map(username =>
                            new StringSelectMenuOptionBuilder()
                                .setLabel(username)
                                .setValue(username)
                        )
                    )
            );

        const usernamesButtons =
            new ActionRowBuilder<ButtonBuilder>().setComponents(
                new ButtonBuilder()
                    .setCustomId("MC_BOTS_USERNAMES_ALL")
                    .setLabel("Select all")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("MC_BOTS_USERNAMES_MAINS")
                    .setLabel("Select mains")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("MC_BOTS_USERNAMES_ALTS")
                    .setLabel("Select alts")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("MC_BOTS_USERNAMES_ALTS_JARCO")
                    .setLabel("Select Jarco's alts")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("MC_BOTS_USERNAMES_ALTS_JOREN")
                    .setLabel("Select Joren's alts")
                    .setStyle(ButtonStyle.Secondary)
            );

        const actionButtons =
            new ActionRowBuilder<ButtonBuilder>().setComponents(
                new ButtonBuilder()
                    .setCustomId("MC_BOTS_CONFIRM")
                    .setLabel("Confirm")
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId("MC_BOTS_CANCEL")
                    .setLabel("Cancel")
                    .setStyle(ButtonStyle.Danger)
            );

        // Handle interactions
        const reply = await this.client.sender.reply(i, {
            embeds: [embed],
            components: [
                serverMenu,
                usernamesMenu,
                usernamesButtons,
                actionButtons
            ],
            fetchReply: true
        });
        if (!reply) {
            return { result: "OTHER", note: "Unable to sent reply message" };
        }

        const c = reply.createMessageComponentCollector({
            time: 120000,
            idle: 30000,
            filter: i2 => i.user.id === i2.user.id,
            dispose: true
        });

        let server: { network: "vortex" };
        let usernames: McUsernames<"java" | "bedrock">[] = [];
        c.on("collect", i2 => {
            // Server menu
            if (i2.isStringSelectMenu() && i2.customId === "MC_BOTS_SERVER") {
                switch (i2.values[0]) {
                    case "vortex":
                        server = { network: "vortex" };
                        serverMenu.components[0].options[0].setDefault(true);
                        break;
                }
            }

            // Usernames menu
            else if (
                i2.isStringSelectMenu() &&
                i2.customId === "MC_BOTS_USERNAMES"
            ) {
                usernames = i2.values as unknown as McUsernames<
                    "java" | "bedrock"
                >[];
                usernamesMenu.components[0].options.forEach(o => {
                    o.setDefault(
                        usernames.includes(
                            o.data.value as McUsernames<"java" | "bedrock">
                        )
                    );
                });
            }

            // Usernames buttons
            else if (
                i2.isButton() &&
                i2.customId.startsWith("MC_BOTS_USERNAMES_")
            ) {
                switch (i2.customId) {
                    case "MC_BOTS_USERNAMES_ALL":
                        usernames = this.usernamePresets.all;
                        break;
                    case "MC_BOTS_USERNAMES_MAINS":
                        usernames = this.usernamePresets.mains;
                        break;
                    case "MC_BOTS_USERNAMES_ALTS":
                        usernames = this.usernamePresets.alts;
                        break;
                    case "MC_BOTS_USERNAMES_ALTS_JARCO":
                        usernames = this.usernamePresets.jarcoAlts;
                        break;
                    case "MC_BOTS_USERNAMES_ALTS_JOREN":
                        usernames = this.usernamePresets.jorenAlts;
                        break;
                }
                usernamesMenu.components[0].options.forEach(o => {
                    o.setDefault(
                        usernames.includes(
                            o.data.value as McUsernames<"java" | "bedrock">
                        )
                    );
                });
            }

            // Confirm button
            else if (i2.isButton() && i2.customId === "MC_BOTS_CONFIRM") {
                // Stop collector
                c.stop("Confirm clicked");

                // Start bots
                const results = usernames.map(username => {
                    const res = this.client.mcBots.stopBot({
                        username,
                        server
                    });
                    return {
                        username: username,
                        result: !res
                            ? "Wasn't running or queued"
                            : res.charAt(0).toUpperCase() + res.slice(1)
                    };
                });

                // Update embed & create button
                embed.setTitle(
                    `Stopped ${results.filter(r => r.result).length} bot(s)`
                );
                embed.setDescription(
                    [
                        `**Server:** ${
                            serverMenu.components[0].options.find(
                                o => o.data.value === server.network
                            )?.data.label
                        }`
                    ].join("\n")
                );
                embed.setFields(
                    ...results.map(r => ({
                        name: r.username,
                        value: !r.result
                            ? "Wasn't running or queued"
                            : r.result.charAt(0).toUpperCase() +
                              r.result.slice(1),
                        inline: true
                    }))
                );

                this.client.sender.reply(
                    i2,
                    { embeds: [embed], components: [] },
                    { method: "UPDATE" }
                );
                return;
            }

            // Cancel button
            else if (i2.isButton() && i2.customId === "MC_BOTS_CANCEL") {
                c.stop("Cancel clicked");
                serverMenu.components[0].setDisabled(true);
                usernamesMenu.components[0].setDisabled(true);
                usernamesButtons.components.forEach(c => c.setDisabled(true));
                actionButtons.components.forEach(c => c.setDisabled(true));
            }

            // Update components
            if (server && usernames.length > 0) {
                actionButtons.components[0].setDisabled(false);
            }
            this.client.sender.reply(
                i2,
                {
                    embeds: [embed],
                    components: [
                        serverMenu,
                        usernamesMenu,
                        usernamesButtons,
                        actionButtons
                    ]
                },
                { method: "UPDATE" }
            );
        });

        c.on("end", (_, reason) => {
            if (["idle", "time"].includes(reason)) {
                serverMenu.components[0].setDisabled(true);
                usernamesMenu.components[0].setDisabled(true);
                usernamesButtons.components.forEach(c => c.setDisabled(true));
                actionButtons.components.forEach(c => c.setDisabled(true));
                this.client.sender.reply(
                    i,
                    {
                        components: [
                            serverMenu,
                            usernamesMenu,
                            usernamesButtons,
                            actionButtons
                        ]
                    },
                    { method: "EDIT_REPLY" }
                );
            }
        });

        // Success
        return { result: "SUCCESS" };
    }
}
