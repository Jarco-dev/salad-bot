import config from "../config";
import {
    SecretConfig,
    Logger,
    Sender,
    Utilities,
    InteractionLoader,
    EventLoader,
    TaskLoader,
    ProxiesConfig,
    McBotsManager
} from "@/classes";
// import { PrismaClient } from "@prisma/client";
import { Client as DiscordClient } from "discord.js";

export class Client extends DiscordClient {
    public sConfig = new SecretConfig();
    public config = config;
    public proxiesConfig = new ProxiesConfig();
    public logger = new Logger(this.sConfig.LOG_LEVEL);
    // public prisma = new PrismaClient();
    public sender = new Sender(this);
    public utils = new Utilities(this);
    public interactionLoader = new InteractionLoader(this);
    public eventLoader = new EventLoader(this);
    public taskLoader = new TaskLoader(this);
    public mcBots = new McBotsManager(this);

    constructor() {
        super(config.CLIENT_OPTIONS);

        // Configs
        this.sConfig.validate(this.logger);
        this.proxiesConfig.validate(this.logger);

        // Database
        // this.prisma
        //     .$connect()
        //     .catch((err: unknown) =>
        //         this.logger.error("Error while connecting to database", err)
        //     );

        // Loaders
        this.interactionLoader.loadAllHandlers();
        this.eventLoader.loadAllHandlers();
        this.taskLoader.loadAllTasks();
    }
}
