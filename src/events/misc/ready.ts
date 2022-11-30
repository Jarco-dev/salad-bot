import BaseEvent from "../../utils/structures/BaseEvent";

class ReadyEvent extends BaseEvent {
    constructor() {
        super("ready");
    }

    async run(): Promise<void> {
        this.logger.info(`${this.client.user!.tag} logged in`);
        this.client.commandLoader.updateCommands(
            this.sConfig.CMD_LOAD_LEVEL,
            this.sConfig.CMD_LOAD_LEVEL === "DEV"
                ? this.sConfig.CMD_DEV_GUILD
                : undefined
        );
        this.client.featureLoader.startAll();
    }
}

export default ReadyEvent;
