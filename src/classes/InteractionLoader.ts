import fs from "fs";
import path from "path";
import {
    ButtonComponent,
    ChatInputCommand,
    UserContextMenuCommand,
    Modal,
    SelectMenuComponent,
    MessageContextMenuCommand
} from "@/structures";
import { Client } from "@/classes";
import { ApplicationCommandData, ButtonStyle, Interaction } from "discord.js";

interface GroupedHandlers {
    buttonComponents: { [key: string]: ButtonComponent };
    chatInputCommands: { [key: string]: ChatInputCommand };
    messageContextMenuCommands: { [key: string]: MessageContextMenuCommand };
    modals: { [key: string]: Modal };
    selectMenuComponents: { [key: string]: SelectMenuComponent };
    userContextMenuCommands: { [key: string]: UserContextMenuCommand };
}

type GroupKeys = keyof GroupedHandlers;
type HandlerTypes = GroupedHandlers[GroupKeys][string];

export class InteractionLoader {
    protected readonly client: Client;
    public readonly groupedHandlers: GroupedHandlers;
    public readonly handlersTypeConfig: {
        name: GroupKeys;
        folderDir: string;
        validateHandler: (handler: unknown) => boolean;
    }[];

    constructor(client: Client) {
        this.client = client;

        this.groupedHandlers = {
            buttonComponents: {},
            chatInputCommands: {},
            messageContextMenuCommands: {},
            modals: {},
            selectMenuComponents: {},
            userContextMenuCommands: {}
        };

        this.handlersTypeConfig = [
            {
                name: "buttonComponents",
                folderDir: path.join(
                    process.cwd(),
                    "src",
                    "interactions",
                    "buttonComponents"
                ),
                validateHandler: handler => {
                    return handler instanceof ButtonComponent;
                }
            },
            {
                name: "chatInputCommands",
                folderDir: path.join(
                    process.cwd(),
                    "src",
                    "interactions",
                    "chatInputCommands"
                ),
                validateHandler: handler => {
                    return handler instanceof ChatInputCommand;
                }
            },
            {
                name: "messageContextMenuCommands",
                folderDir: path.join(
                    process.cwd(),
                    "src",
                    "interactions",
                    "messageContextMenuCommands"
                ),
                validateHandler: handler => {
                    return handler instanceof MessageContextMenuCommand;
                }
            },
            {
                name: "modals",
                folderDir: path.join(
                    process.cwd(),
                    "src",
                    "interactions",
                    "modals"
                ),
                validateHandler: handler => {
                    return handler instanceof Modal;
                }
            },
            {
                name: "selectMenuComponents",
                folderDir: path.join(
                    process.cwd(),
                    "src",
                    "interactions",
                    "selectMenuComponents"
                ),
                validateHandler: handler => {
                    return handler instanceof SelectMenuComponent;
                }
            },
            {
                name: "userContextMenuCommands",
                folderDir: path.join(
                    process.cwd(),
                    "src",
                    "interactions",
                    "userContextMenuCommands"
                ),
                validateHandler: handler => {
                    return handler instanceof UserContextMenuCommand;
                }
            }
        ];
    }

    public async loadAllHandlers(): Promise<void> {
        for (const config of this.handlersTypeConfig) {
            this.loadInteractionHandler(config);
        }
    }

    private async loadInteractionHandler(p: {
        name: GroupKeys;
        folderDir: string;
        validateHandler: (handler: unknown) => boolean;
    }) {
        const loadHandlers = async (dir: string) => {
            // Get all items in the dir
            if (!fs.existsSync(dir)) return;
            const items = await fs.promises.readdir(dir);

            // Loop through all items
            for (const item of items) {
                const stat = fs.lstatSync(path.join(dir, item));

                // Load files inside of folder
                if (stat.isDirectory()) {
                    loadHandlers(path.join(dir, item));
                }

                // Load handler if it's a file ending with .ts
                if (stat.isFile() && item.endsWith(".ts")) {
                    let handler: HandlerTypes;
                    try {
                        // Validate that the handler is the correct class type
                        const Handler = require(path.join(dir, item)).default;
                        if (p.validateHandler(Handler.prototype)) {
                            handler = new Handler(this.client);

                            // Don't allow buttons of style "LINK"
                            if (
                                handler instanceof ButtonComponent &&
                                handler.data.style === ButtonStyle.Link
                            ) {
                                this.client.logger.warn(
                                    `Button of style "LINK" not allowed, skipping handler file: ${item}`
                                );
                                return;
                            }

                            // Handler is enabled
                            if (!handler.enabled) continue;

                            // Add handler to corresponding group
                            const name =
                                "name" in handler.data
                                    ? handler.data.name
                                    : "custom_id" in handler.data
                                    ? handler.data.custom_id
                                    : undefined;

                            if (!name) {
                                this.client.logger.warn(
                                    `Unable to obtain name or custom_id, skipping handler file: ${item}`
                                );
                                return;
                            }

                            this.groupedHandlers[p.name as GroupKeys][name] =
                                handler;

                            // Log loaded message
                            this.client.logger.debug(
                                `[InteractionLoader] ${
                                    p.name.charAt(0).toUpperCase() +
                                    p.name.substring(1)
                                }: ${item} handler loaded`
                            );
                        }
                    } catch (err) {
                        this.client.logger.error(
                            `Error while trying to load handler file ${item}`,
                            err
                        );
                    }
                }
            }
        };

        await loadHandlers(p.folderDir);
    }

    public getHandler(i: Interaction): HandlerTypes | undefined {
        if (i.isButton()) {
            return this.groupedHandlers.buttonComponents[i.customId];
        } else if (i.isChatInputCommand()) {
            return this.groupedHandlers.chatInputCommands[i.commandName];
        } else if (i.isMessageContextMenuCommand()) {
            return this.groupedHandlers.messageContextMenuCommands[
                i.commandName
            ];
        } else if (i.isModalSubmit()) {
            return this.groupedHandlers.modals[i.customId];
        } else if (i.isSelectMenu()) {
            return this.groupedHandlers.selectMenuComponents[i.customId];
        } else if (i.isUserContextMenuCommand()) {
            return this.groupedHandlers.userContextMenuCommands[i.commandName];
        } else {
            return;
        }
    }

    public async handleInteractionCreate(i: Interaction): Promise<void> {
        const handler = this.getHandler(i);
        if (!handler) return;

        /**
         * Really tried to prevent just ignoring the type issue below,
         * But I spent far too long on it and couldn't figure out a good clean way
         *
         * The only way I found was by placing the getHandler function inside here
         * and then calling the run function and checking options in each if statement,
         * and it looks really messy so decided to go with ignore comments as the types
         * are actually already checked by the getHandler function when getting the handler
         *
         * - Jarco
         */
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await handler.run(i);
    }

    public async updateApplicationCommands(): Promise<void> {
        // Client is ready
        await this.client.application?.fetch();
        if (!this.client.isReady() || !this.client.application) {
            this.client.logger.warn(
                "You can't call the InteractionLoader#createCommands method before the client is ready!"
            );
            return;
        }

        // Gather command data
        const globalCommands: ApplicationCommandData[] = [];

        const addCommand = (
            command:
                | ChatInputCommand
                | MessageContextMenuCommand
                | UserContextMenuCommand
        ) => {
            if (!command.enabled) return;
            globalCommands.push(command.data);
        };

        for (const key in this.groupedHandlers.chatInputCommands) {
            addCommand(this.groupedHandlers.chatInputCommands[key]);
        }
        for (const key in this.groupedHandlers.messageContextMenuCommands) {
            addCommand(this.groupedHandlers.messageContextMenuCommands[key]);
        }
        for (const key in this.groupedHandlers.userContextMenuCommands) {
            addCommand(this.groupedHandlers.userContextMenuCommands[key]);
        }

        // Create commands
        this.client.application.commands
            .set(globalCommands)
            .then(commands => {
                this.client.logger.info(
                    `Updated ${commands.size} global application command(s)`
                );
            })
            .catch(err => {
                this.client.logger.error(
                    "Error while updating global application command(s)",
                    err
                );
            });
    }
}
