import { Protocol } from "@/structures";
import { ChatMessage } from "prismarine-chat";
import { BedrockPackets } from "@/types";

export class Scoreboard {
    private bot: Protocol;
    public name: string;
    public title: ChatMessage;
    public positions: typeof Scoreboard.byteToPosition[keyof typeof Scoreboard.byteToPosition][];
    public readonly scoresObject: {
        [key: string]: {
            name: ChatMessage;
            value: number;
        };
    };
    static readonly byteToPosition: {
        0: "list";
        1: "sidebar";
        2: "belowName";
        3: "sidebarTeamBlack";
        4: "sidebarTeamDarkBlue";
        5: "sidebarTeamDarkGreen";
        6: "sidebarTeamDarkAqua";
        7: "sidebarTeamDarkRed";
        8: "sidebarTeamDarkPurple";
        9: "sidebarTeamGold";
        10: "sidebarTeamGray";
        11: "sidebarTeamDarkGray";
        12: "sidebarTeamBlue";
        13: "sidebarTeamGreen";
        14: "sidebarTeamAqua";
        15: "sidebarTeamRed";
        16: "sidebarTeamLightPurple";
        17: "sidebarTeamYellow";
        18: "sidebarTeamWhite";
    } = {
        0: "list",
        1: "sidebar",
        2: "belowName",
        3: "sidebarTeamBlack",
        4: "sidebarTeamDarkBlue",
        5: "sidebarTeamDarkGreen",
        6: "sidebarTeamDarkAqua",
        7: "sidebarTeamDarkRed",
        8: "sidebarTeamDarkPurple",
        9: "sidebarTeamGold",
        10: "sidebarTeamGray",
        11: "sidebarTeamDarkGray",
        12: "sidebarTeamBlue",
        13: "sidebarTeamGreen",
        14: "sidebarTeamAqua",
        15: "sidebarTeamRed",
        16: "sidebarTeamLightPurple",
        17: "sidebarTeamYellow",
        18: "sidebarTeamWhite"
    };

    constructor(p: {
        bot: Protocol;
        name: string;
        title: string;
        position?: BedrockPackets["setDisplayObjective"]["display_slot"];
    }) {
        this.bot = p.bot;
        this.name = p.name;
        this.title = this.bot.chatMessage.fromNotch(p.title);
        this.scoresObject = {};
        this.positions = [];

        if (p.position) {
            switch (p.position) {
                case "list":
                case "sidebar":
                    this.positions.push(p.position);
                    break;
                case "belowname":
                    this.positions.push("belowName");
                    break;
                default:
                    this.bot.emit(
                        "error",
                        new Error(
                            `unexpected position while creating scoreboard: ${p.position}`
                        )
                    );
                    break;
            }
        }
    }

    public setTitle(title: string): {
        oldTitle: ChatMessage;
        newTitle: ChatMessage;
    } {
        const oldTitle = this.title;
        this.title = this.bot.chatMessage.fromNotch(title);
        return { oldTitle, newTitle: this.title };
    }

    public setScore(
        id: string,
        name: ChatMessage,
        value: number
    ): {
        oldScore?: { name: ChatMessage; value: number };
        newScore: { name: ChatMessage; value: number };
    } {
        const oldRow = this.scoresObject[id];
        this.scoresObject[id] = { name, value };
        return { oldScore: oldRow, newScore: this.scoresObject[id] };
    }

    public deleteScore(id: string): { name: ChatMessage; value: number } {
        const removed = this.scoresObject[id];
        delete this.scoresObject[id];
        return removed;
    }

    public addPosition(
        position: keyof typeof Scoreboard.byteToPosition
    ): Scoreboard["positions"][number] {
        const asString = Scoreboard.byteToPosition[position];
        this.positions.push(asString);
        return asString;
    }

    public removePosition(
        position: keyof typeof Scoreboard.byteToPosition
    ): Scoreboard["positions"][number] {
        const asString = Scoreboard.byteToPosition[position];
        this.positions.splice(this.positions.findIndex(p => p === asString));
        return asString;
    }

    get scores(): {
        name: ChatMessage;
        value: number;
    }[] {
        return Object.values(this.scoresObject).sort((a, b) => {
            return a.value < b.value ? 1 : -1;
        });
    }
}
