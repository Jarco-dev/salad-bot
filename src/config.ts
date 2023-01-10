import { Config } from "@/types";
import { IntentsBitField } from "discord.js";
import path from "path";

const config: Config = {
    // Bot colors
    COLORS: {
        DEFAULT: "#F88038"
    },

    // Message type emojis and colors
    MSG_TYPES: {
        SUCCESS: { EMOJI: "✅", COLOR: "#00FF00" },
        INVALID: { EMOJI: "❌", COLOR: "#F88038" },
        ERROR: { EMOJI: "⚠", COLOR: "#FF0000" },
        TIME: { EMOJI: "⏱", COLOR: "#F88038" }
    },

    // Discord client options
    CLIENT_OPTIONS: {
        intents: [
            // IntentsBitField.Flags.DirectMessageReactions,
            // IntentsBitField.Flags.DirectMessages,
            // IntentsBitField.Flags.GuildIntegrations,
            // IntentsBitField.Flags.DirectMessageTyping,
            // IntentsBitField.Flags.GuildBans,
            // IntentsBitField.Flags.GuildEmojisAndStickers,
            // IntentsBitField.Flags.GuildInvites,
            // IntentsBitField.Flags.GuildMembers,
            // IntentsBitField.Flags.GuildMessageReactions,
            // IntentsBitField.Flags.GuildMessages,
            // IntentsBitField.Flags.GuildMessageTyping,
            // IntentsBitField.Flags.GuildPresences,
            IntentsBitField.Flags.Guilds
            // IntentsBitField.Flags.GuildScheduledEvents,
            // IntentsBitField.Flags.GuildVoiceStates,
            // IntentsBitField.Flags.GuildWebhooks,
            // IntentsBitField.Flags.MessageContent
        ]
    },

    // Bot version (acquired from package.json)
    VERSION: require(path.join(process.cwd(), "package.json")).version,

    // Mc Bot related
    BOT_CACHE_FOLDER_PATH: path.join(process.cwd(), ".cache", "nmp")
};

export default config;
