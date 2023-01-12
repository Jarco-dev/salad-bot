import { BedrockProtocol } from "./protocols/BedrockProtocol";
import { JavaProtocol } from "./protocols/JavaProtocol";
import { McUsernames, ProtocolOptions, TypedEmitter } from "@/types";
import { Client } from "@/classes";
import { EventEmitter } from "node:events";
import { MicrosoftDeviceAuthorizationResponse } from "minecraft-protocol";
import { ChatMessage } from "prismarine-chat";

type Status =
    | ""
    | "joining"
    | "inHub"
    | `in${"Plasma" | "Cosmic"}`
    | "ready"
    | "awaitingMsa"
    | "offline";

export type Events = {
    end: (reason?: string) => void;
    ready: () => void;
    statusUpdate: (oldStatus: Status, newStatus: Status) => void;
    msaCode: (data: MicrosoftDeviceAuthorizationResponse) => void;
    error: (error: Error) => void;
    loginFailure: (msg: ChatMessage) => void;
    kick: (msg: ChatMessage) => void;
};

export class AfkBot extends (EventEmitter as new () => TypedEmitter<Events>) {
    public client: Client;
    public bot?: JavaProtocol | BedrockProtocol;
    public status: Status = "";
    public options: {
        type: "voteParty" | "autoMiner";
        server: { network: "vortex"; subServer: "plasma" | "cosmic" };
        username: ProtocolOptions<"java" | "bedrock">["username"];
        protocol: ProtocolOptions<"java" | "bedrock">["protocol"];
    };
    public lastJoinTimestamp?: number;

    constructor(p: {
        client: Client;
        type: "voteParty" | "autoMiner";
        server: { network: "vortex"; subServer: "plasma" | "cosmic" };
        username: ProtocolOptions<"java">["username"];
        protocol: ProtocolOptions<"java">["protocol"];
    });
    constructor(p: {
        client: Client;
        type: "voteParty" | "autoMiner";
        server: { network: "vortex"; subServer: "plasma" | "cosmic" };
        username: ProtocolOptions<"bedrock">["username"];
        protocol: ProtocolOptions<"bedrock">["protocol"];
    });
    constructor(p: {
        client: Client;
        type: "voteParty" | "autoMiner";
        server: { network: "vortex"; subServer: "plasma" | "cosmic" };
        username: ProtocolOptions<"java" | "bedrock">["username"];
        protocol: ProtocolOptions<"java" | "bedrock">["protocol"];
    }) {
        super();
        this.client = p.client;
        this.options = p;

        this.initBotClient();
    }

    private initBotClient() {
        this.lastJoinTimestamp = Date.now();
        this.setStatus("joining");
        if (this.options.protocol === "java") {
            this.bot = new JavaProtocol({
                username: this.options.username as McUsernames<"java">,
                protocol: this.options.protocol,
                server: "vortex",
                version: "1.17.1"
            });
        } else {
            this.bot = new BedrockProtocol({
                username: this.options.username as McUsernames<"bedrock">,
                protocol: this.options.protocol,
                server: "vortex",
                version: "1.19.50"
            });
        }
        this.initListeners();
    }

    private initListeners() {
        if (!this.bot) {
            throw new Error("Can't add listeners to a un initialized bot");
        }

        this.on("statusUpdate", (_, newStatus) => {
            switch (newStatus) {
                case "inHub":
                    this.bot!.chat(`/${this.options.server.subServer}`);
                    break;
                case "inPlasma":
                case "inCosmic":
                    this.bot!.chat(
                        this.options.type === "autoMiner"
                            ? "/auto"
                            : "/home afk"
                    );
                    break;
            }
        });

        this.bot.on("kick", msg => {
            this.emit("kick", msg);
        });

        this.bot.on("chat", msg => {
            if (
                (this.options.type === "voteParty" &&
                    msg.toString() === "Teleporting to afk.") ||
                (this.options.type === "autoMiner" &&
                    msg.toString() === "Warping to auto.")
            ) {
                this.setStatus("ready");
                this.emit("ready");
            }
        });

        this.bot.on("end", reason => {
            this.setStatus("offline");
            this.emit("end", reason);
        });

        this.bot.on("msaCode", data => {
            this.setStatus("awaitingMsa");
            this.emit("msaCode", data);
        });

        this.bot.on("error", err => {
            this.emit("error", err);
        });

        this.bot.on("loginFailure", msg => {
            this.emit("loginFailure", msg);
        });

        this.bot.on("scoreboardScoreCreate", (sb, score) => {
            const name = score.name.toString().split(" - ")[0];
            switch (name) {
                case "Hub1":
                case "Hub2":
                    if (this.status === "inHub") break;
                    this.setStatus("inHub");
                    break;
                case "Cosmic":
                    if (
                        this.status === "inCosmic" ||
                        (this.status === "ready" &&
                            this.options.server.subServer === "cosmic")
                    )
                        break;
                    this.setStatus("inCosmic");
                    break;
                case "Plasma":
                    if (
                        this.status === "inPlasma" ||
                        (this.status === "ready" &&
                            this.options.server.subServer === "plasma")
                    )
                        break;
                    this.setStatus("inPlasma");
                    break;
            }
        });
    }

    private setStatus(status: Status) {
        const old = this.status;
        this.status = status;
        this.emit("statusUpdate", old, this.status);
    }

    public end(safeEnd?: boolean) {
        if (this.bot) this.bot.end(safeEnd);
    }
}
