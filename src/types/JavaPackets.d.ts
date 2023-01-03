export interface JavaPackets {
    disconnect: {
        reason: string;
    };
    kickDisconnect: {
        reason: string;
    };
    respawn: {
        dimension: { [key: string]: any }; // TODO: Add nbt type / parser?
        worldName: string;
        hashedSeed: bigint;
        /**
         * -1: null
         * 0: survival
         * 1: creative
         * 2: adventure
         * 3: spectator
         */
        gamemode: -1 | 0 | 1 | 2 | 3;
        /**
         * -1: null
         * 0: survival
         * 1: creative
         * 2: adventure
         * 3: spectator
         */
        previousGamemode: -1 | 0 | 1 | 2 | 3;
        isDebug: boolean;
        isFlat: boolean;
        copyMetadata: boolean;
    };
    updateHealth: {
        health: number;
        food: number;
        foodSaturation: number;
    };
    chat: {
        message: string;
        position: number;
        sender: string;
    };
    scoreboardObjective: {
        name: string;
    } & (
        | {
              /**
               * 0: Create scoreboard
               * 2: title update
               */
              action: 0 | 2;
              displayText: string;
              /**
               * 0: integer
               * 1: hearts
               */
              type: 0 | 1;
          }
        | {
              /**
               * 1: Remove scoreboard
               */
              action: 1;
          }
    );
    scoreBoardDisplayObjective: {
        /**
         * 0: list
         * 1: sidebar
         * 2: belowName
         * 3: sidebarTeamBlack
         * 4: sidebarTeamDarkBlue
         * 5: sidebarTeamDarkGreen
         * 6: sidebarTeamDarkAqua
         * 7: sidebarTeamDarkRed
         * 8: sidebarTeamDarkPurple
         * 9: sidebarTeamGold
         * 10: sidebarTeamGray
         * 11: sidebarTeamDarkGray
         * 12: sidebarTeamBlue
         * 13: sidebarTeamGreen
         * 14: sidebarTeamAqua
         * 15: sidebarTeamRed
         * 16: sidebarTeamLightPurple
         * 17: sidebarTeamYellow
         * 18: sidebarTeamWhite
         */
        position:
            | 1
            | 2
            | 3
            | 4
            | 5
            | 6
            | 7
            | 8
            | 9
            | 10
            | 11
            | 12
            | 13
            | 14
            | 15
            | 16
            | 17
            | 18;
        name: string;
    };
    scoreboardScore: {
        itemName: string;
        scoreName: string;
    } & (
        | {
              /**
               * 0: create / update
               */
              action: 0;
              value: number;
          }
        | {
              /**
               * 1:
               */
              action: 1;
          }
    );
}
