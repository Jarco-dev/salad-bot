import BaseFeature from "../../utils/structures/BaseFeature";
import { ActivityType } from "discord.js";

class PresenceFeature extends BaseFeature {
    constructor() {
        super("presence");
    }

    start(): void {
        this.client.user!.setPresence({
            status: "online",
            activities: [
                {
                    type: ActivityType.Watching,
                    name: `${this.client.users.cache.size} users`
                }
            ]
        });
    }
}

export default PresenceFeature;
