import { ChatMessage } from "prismarine-chat";
import { Scoreboard } from "../classes/mcBots/internalClasses/Scoreboard";
import { MicrosoftDeviceAuthorizationResponse } from "minecraft-protocol";

export type ProtocolEvents = {
    ready: () => void;
    loginFailure: (msg: ChatMessage) => void;
    kick: (msg: ChatMessage) => void;
    end: (reason?: string) => void;
    error: (error: Error) => void;
    msaCode: (data: MicrosoftDeviceAuthorizationResponse) => void;
    chat: (msg: ChatMessage) => void;
    scoreboardCreate: (scoreboard: Scoreboard) => void;
    scoreboardDelete: (scoreboard: Scoreboard) => void;
    scoreboardTitleUpdate: (scoreboard: Scoreboard, oldTitle, newTitle) => void;
    scoreboardScoreCreate: (
        scoreboard: Scoreboard,
        created: { name: ChatMessage; value: number }
    ) => void;
    scoreboardScoreDelete: (
        scoreboard: Scoreboard,
        deleted: ReturnType<Scoreboard["deleteScore"]>
    ) => void;
    scoreboardScoreUpdate: (
        scoreboard: Scoreboard,
        oldScore: { name: ChatMessage; value: number },
        newScore: { name: ChatMessage; value: number }
    ) => void;
    scoreboardPositionAdd: (
        scoreboard: Scoreboard,
        position: Scoreboard["positions"][number]
    ) => void;
    scoreboardPositionRemove: (
        scoreboard: Scoreboard,
        position: Scoreboard["positions"][number]
    ) => void;
};
