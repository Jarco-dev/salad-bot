import { Protocol } from "@/structures";
import { ChatMessage } from "prismarine-chat";
export class Team {
    private bot: Protocol;
    public team: string;
    public membersObject: { [key: string]: "" };
    public name: ChatMessage;
    public friendlyFire: boolean;
    public nameTagVisibility:
        | "always"
        | "hideForOtherTeams"
        | "hideForOwnTeam"
        | "never";
    public collisionRule: "always" | "pushOtherTeams" | "pushOwnTeam" | "never";
    public color: typeof Team.byteToColor[keyof typeof Team.byteToColor];
    public prefix: ChatMessage;
    public suffix: ChatMessage;
    static readonly byteToColor = [
        "black",
        "dark_blue",
        "dark_green",
        "dark_red",
        "dark_purple",
        "gold",
        "gray",
        "dark_gray",
        "blue",
        "green",
        "aqua",
        "red",
        "light_purple",
        "yellow",
        "white",
        "obfuscated",
        "bold",
        "strikethrough",
        "underlined",
        "italic",
        "reset"
    ] as const;

    constructor(p: {
        bot: Protocol;
        team: string;
        name: string;
        friendlyFire: number;
        nameTagVisibility:
            | "always"
            | "hideForOtherTeams"
            | "hideForOwnTeam"
            | "never";
        collisionRule: "always" | "pushOtherTeams" | "pushOwnTeam" | "never";
        formatting: number;
        prefix: string;
        suffix: string;
    }) {
        this.bot = p.bot;
        this.team = p.team;
        this.membersObject = {};
        const data: Omit<typeof p, "team"> & { team?: string } = { ...p };
        delete data.team;

        this.name = this.bot.chatMessage.fromNotch(p.name);
        this.friendlyFire = p.friendlyFire !== 0;
        this.nameTagVisibility = p.nameTagVisibility;
        this.collisionRule = p.collisionRule;
        this.color = Team.byteToColor[p.formatting];
        this.prefix = this.bot.chatMessage.fromNotch(p.prefix);
        this.suffix = this.bot.chatMessage.fromNotch(p.suffix);
    }

    public update(p: {
        name: string;
        friendlyFire: 0 | 1;
        nameTagVisibility:
            | "always"
            | "hideForOtherTeams"
            | "hideForOwnTeam"
            | "never";
        collisionRule: "always" | "pushOtherTeams" | "pushOwnTeam" | "never";
        formatting: number;
        prefix: string;
        suffix: string;
    }) {
        this.name = this.bot.chatMessage.fromNotch(p.name);
        this.friendlyFire = p.friendlyFire !== 0;
        this.nameTagVisibility = p.nameTagVisibility;
        this.collisionRule = p.collisionRule;
        this.color = Team.byteToColor[p.formatting];
        this.prefix = this.bot.chatMessage.fromNotch(p.prefix);
        this.suffix = this.bot.chatMessage.fromNotch(p.suffix);
    }

    public addMember(name: string): string {
        this.membersObject[name] = "";
        return name;
    }

    public removeMember(name: string): string {
        const removed = this.membersObject[name];
        delete this.membersObject[name];
        return removed;
    }

    get members() {
        return Object.keys(this.membersObject);
    }

    displayName(member: string) {
        const name = this.prefix.clone();
        name.append(
            this.bot.chatMessage.fromNotch(
                JSON.stringify({ text: member, color: this.color })
            ),
            this.suffix
        );
        return name;
    }
}
