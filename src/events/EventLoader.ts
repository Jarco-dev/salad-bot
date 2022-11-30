import type Client from "../index";
import { promises as fs } from "fs";
import path from "path";
import BaseEvent from "../utils/structures/BaseEvent";

class EventLoader {
    public events: { [key: string]: BaseEvent };
    public path: string;
    private client: typeof Client;
    private logger: typeof Client.logger;

    constructor(client: typeof Client) {
        this.client = client;
        this.logger = client.logger;
        this.events = {};
        this.path = path.join(__dirname, "../events/");
    }

    public async loadAll(): Promise<void> {
        // Get all the folders
        const folders = await fs.readdir(this.path);
        for (const folder of folders) {
            // Load the events if it's a folder
            if ((await fs.lstat(this.path + folder)).isDirectory()) {
                const files = await fs.readdir(this.path + folder);
                // Go through all the event files
                for (const file of files) {
                    // Load the event
                    try {
                        const Event = require(path.join(
                            this.path,
                            `./${folder}/${file}`
                        )).default;
                        if (Event.prototype instanceof BaseEvent) {
                            const event = new Event();
                            this.client.on(event.name, event.run.bind(event));
                            this.events[event.name] = event;
                        }
                    } catch (err) {
                        this.logger.error(
                            `Error while trying to load a event eventFile: ${file}`,
                            err
                        );
                    }
                }
            }
        }
    }
}

export default EventLoader;
