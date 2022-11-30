import { PrismaClient } from "@prisma/client";
import { Client as DiscordClient } from "discord.js";
import CommandLoader from "./commands/CommandLoader";
import config from "./config";
import EventLoader from "./events/EventLoader";
import FeatureLoader from "./features/FeatureLoader";
import Global from "./utils/Global";
import Logger from "./utils/Logger";
import SecretConfig from "./utils/SecretConfig";
import Sender from "./utils/Sender";

class Client extends DiscordClient {
    public sConfig = new SecretConfig();
    public config = config;
    public logger = new Logger();
    public prisma = new PrismaClient();
    public sender = new Sender(this);
    public global = new Global(this);
    public commandLoader = new CommandLoader(this);
    public eventLoader = new EventLoader(this);
    public featureLoader = new FeatureLoader(this);

    constructor() {
        super(config.CLIENT_OPTIONS);

        // Logging
        this.logger.setLogLevel(this.sConfig.LOG_LEVEL);

        // SecretConfig
        this.sConfig.validate(this.logger);

        // Database
        this.prisma
            .$connect()
            .catch((err: unknown) =>
                this.logger.error("Error while connecting to database", err)
            );

        // Loaders
        this.commandLoader.loadAll();
        this.eventLoader.loadAll();
        this.featureLoader.loadAll();
    }
}

export default Client;
