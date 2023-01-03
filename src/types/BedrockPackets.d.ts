import bedrock from "bedrock-protocol";

export interface BedrockPackets {
    disconnect: {
        hide_disconnect_reason: boolean;
        message?: string;
    };
    playStatus: {
        /**
         * login_success: player logged in
         * login_success: Outdated client
         * failed_client: Outdated Server
         * player_spawn: sent to spawn the player
         * failed_invalid_tenant: school doesn't have access to server
         * failed_vanilla_edu: Server not edu version
         * failed_edu_vanilla: Server is an incompatible version
         * failed_server_full: server full
         * failed_editor_vanilla_mismatch: Can't join vanilla game on editor
         * failed_vanilla_editor_mismatch: Can't join editor game on vanilla
         */
        status: bedrock.PlayStatus;
    };
    updateAttributes: {
        runtime_entity_id: BigInt;
        tick: BigInt;
        attributes: {
            min: number;
            max: number;
            current: number;
            default: number;
            name: string;
            modifiers: {
                id: string;
                name: string;
                amount: number;
                operation: number;
                operand: number;
                serializable: number;
            }[];
        }[];
    };
    text: {
        needs_translation: boolean;
        xuid: string;
        platform_chat_id: string;
    } & (
        | {
              type: "chat" | "whisper" | "announcement";
              source_name: string;
              message: string;
          }
        | {
              type:
                  | "raw"
                  | "tip"
                  | "system"
                  | "json_whisper"
                  | "json"
                  | "json_announcement";
              message: string;
          }
        | {
              type: "translation" | "popup" | "jukebox_popup";
              message: string;
              parameters_length: number;
              parameters: string[];
          }
    );
    setDisplayObjective: {
        display_slot: "list" | "sidebar" | "belowname";
        objective_name: string;
        display_name: string;
        criteria: string;
        sort_order: number;
    };
    removeDisplayObjective: {
        objective_name: string;
    };
    setScore:
        | {
              action: "change";
              entries: ({
                  scoreboard_id: bigint;
                  objective_name: string;
                  score: number;
              } & (
                  | {
                        entry_type: "player" | "entity";
                        entity_unique_id: bigint;
                    }
                  | { entry_type: "fake_player"; custom_name: string }
              ))[];
          }
        | {
              action: "remove";
              entries: {
                  scoreboard_id: bigint;
                  objective_name: string;
                  score: number;
              }[];
          };
    setScoreBoardIdentity;
}
