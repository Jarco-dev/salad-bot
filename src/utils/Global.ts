import type Client from "../index";
import type {
    ActionRow,
    ButtonInteraction,
    Channel,
    ChannelMention,
    CommandInteraction,
    Guild,
    GuildChannel,
    GuildMember,
    MessageActionRowComponent,
    PermissionResolvable,
    Role,
    RoleMention,
    SelectMenuInteraction,
    Snowflake,
    TextBasedChannel,
    User,
    UserMention
} from "discord.js";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ChannelType,
    ComponentType,
    EmbedBuilder,
    PermissionsBitField,
    SelectMenuBuilder
} from "discord.js";

class Global {
    private client: typeof Client;
    private config: typeof Client.config;
    private sender: typeof Client.sender;

    constructor(client: typeof Client) {
        this.client = client;
        this.config = client.config;
        this.sender = client.sender;
    }

    public defaultEmbed(): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(this.config.COLORS.DEFAULT)
            .setTimestamp()
            .setFooter({
                text: `${this.client.user!.username} v${this.config.VERSION}`
            });
    }

    public async fetchUser(
        userId?: Snowflake | UserMention | null | undefined
    ): Promise<User | void> {
        if (userId) {
            const snowflake = userId.match(/[0-9]+/)?.[0];
            if (snowflake)
                return await this.client.users.fetch(userId).catch(() => {});
        }
    }

    public async fetchMember(
        guild: Guild,
        userId?: Snowflake | UserMention | null | undefined
    ): Promise<void | GuildMember> {
        if (guild && userId) {
            const snowflake = userId.match(/[0-9]+/)?.[0];
            if (snowflake)
                return await guild.members.fetch(userId).catch(() => {});
        }
    }

    public async fetchRole(
        guild: Guild,
        roleId?: Snowflake | RoleMention | null | undefined
    ): Promise<Role | null | void> {
        if (guild && roleId) {
            const snowflake = roleId.match(/[0-9]+/)?.[0];
            if (snowflake)
                return await guild.roles.fetch(snowflake).catch(() => {});
        }
    }

    public fetchChannel(
        channelId?: Snowflake | ChannelMention | null | undefined
    ): Channel | null | undefined {
        if (channelId) {
            const snowflake = channelId.match(/[0-9]+/)?.[0];
            if (snowflake) return this.client.channels.resolve(snowflake);
        }
        return;
    }

    public parseTime(duration: number | bigint): string {
        if (typeof duration === "bigint") duration = Number(duration);
        let result = "";

        duration = Math.floor(duration / 1000);
        const sec = duration % 60;
        if (duration > 0 && sec > 0) result = sec + "s";

        duration = Math.floor(duration / 60);
        const min = duration % 60;
        if (duration > 0 && min > 0) result = min + "m " + result;

        duration = Math.floor(duration / 60);
        const hour = duration % 24;
        if (duration > 0 && hour > 0) result = hour + "h " + result;

        duration = Math.floor(duration / 24);
        const day = duration % 365;
        if (duration > 0 && day > 0) result = day + "d " + result;

        duration = Math.floor(duration / 365);
        const year = duration;
        if (duration > 0 && year > 0) result = year + "y " + result;

        return result;
    }

    public limitString(string: string, limit: number): string {
        if (string.length > limit) {
            return string.substring(0, limit + 3) + "...";
        } else {
            return string;
        }
    }

    public addNewLines(lines: string[]): string {
        return lines.join("\n");
    }

    public hasPermissions(
        channel: GuildChannel,
        permissions: PermissionResolvable[],
        notifHere?:
            | TextBasedChannel
            | CommandInteraction
            | ButtonInteraction
            | SelectMenuInteraction
    ): boolean {
        // Client member exists
        if (!channel.guild.members.me)
            throw new Error(
                "Could not get channel.guild.member.me for permission checking"
            );
        const perms = channel.permissionsFor(channel.guild.members.me);
        permissions = permissions.filter(perm => !perms.has(perm));
        if (permissions.length === 0) return true;
        if (notifHere) {
            if ("isAutocomplete" in notifHere) {
                this.sender.reply(
                    notifHere,
                    {
                        content: `The bot is missing the \`${permissions.join(
                            "`, `"
                        )}\` permission(s) in ${channel}, Please contact a server admin!`
                    },
                    { msgType: "INVALID" }
                );
            } else {
                if (!notifHere.partial) {
                    if (notifHere.type !== ChannelType.DM) {
                        const notifChanPerms = notifHere.permissionsFor(
                            channel.guild.members.me
                        );
                        const { ViewChannel, SendMessages, EmbedLinks } =
                            PermissionsBitField.Flags;
                        if (
                            !notifChanPerms.has(
                                new PermissionsBitField([
                                    ViewChannel,
                                    SendMessages,
                                    EmbedLinks
                                ])
                            )
                        )
                            return false;
                    }
                    this.sender.msgChannel(
                        notifHere,
                        {
                            content: `The bot is missing the \`${permissions.join(
                                "`, `"
                            )}\` permission(s) in ${channel}, Please contact a server admin!`
                        },
                        { msgType: "INVALID" }
                    );
                } else
                    throw new Error(
                        "Can't send missing permissions message in partial channel"
                    );
            }
        }
        return false;
    }

    public isAboveRoles(
        roles: Role[],
        notifHere?:
            | TextBasedChannel
            | CommandInteraction
            | ButtonInteraction
            | SelectMenuInteraction
    ): boolean {
        roles = roles
            .filter(role => !role.editable)
            .sort((a, b) => b.position - a.position);
        if (roles.length === 0) return true;
        if (notifHere) {
            if ("isAutocomplete" in notifHere) {
                this.sender.reply(
                    notifHere,
                    {
                        content: `The bot is too low in the role hierarchy to manage the \`${roles.join(
                            "`, `"
                        )}\` role(s), Please contact a server admin!`
                    },
                    { msgType: "INVALID" }
                );
            } else {
                if (!notifHere.partial) {
                    if (notifHere.type !== ChannelType.DM) {
                        if (!notifHere.guild.members.me)
                            throw new Error(
                                "Could not get channel.guild.members.me for permission checking"
                            );
                        const notifChanPerms = notifHere.permissionsFor(
                            notifHere.guild.members.me
                        );
                        const { ViewChannel, SendMessages, EmbedLinks } =
                            PermissionsBitField.Flags;
                        if (
                            !notifChanPerms.has(
                                new PermissionsBitField([
                                    ViewChannel,
                                    SendMessages,
                                    EmbedLinks
                                ])
                            )
                        )
                            return false;
                    }
                    this.sender.msgChannel(
                        notifHere,
                        {
                            content: `The bot is too low in the role hierarchy to manage the \`${roles.join(
                                "`, `"
                            )}\` role(s), Please contact a server admin!`
                        },
                        { msgType: "INVALID" }
                    );
                } else
                    throw new Error(
                        "Can't send missing permissions message in dm channel"
                    );
            }
        }
        return false;
    }

    public getMessageActionRowBuilder(
        actionRow: ActionRow<MessageActionRowComponent>
    ): ActionRowBuilder<ButtonBuilder | SelectMenuBuilder> {
        const components = actionRow
            .toJSON()
            .components.reduce(
                (a: (ButtonBuilder | SelectMenuBuilder)[], component) => {
                    const builder: ButtonBuilder | SelectMenuBuilder =
                        component.type === ComponentType.Button
                            ? ButtonBuilder.from(component)
                            : SelectMenuBuilder.from(component);
                    a.push(builder);
                    return a;
                },
                []
            );

        return components[0].data.type === ComponentType.Button
            ? new ActionRowBuilder<ButtonBuilder>().addComponents(
                  components as ButtonBuilder[]
              )
            : new ActionRowBuilder<SelectMenuBuilder>().addComponents(
                  components as SelectMenuBuilder[]
              );
    }
}

export default Global;
