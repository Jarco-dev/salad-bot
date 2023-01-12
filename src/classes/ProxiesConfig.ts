import { Logger } from "./Logger";
import { McServerNames, McUsernames } from "@/types";
import path from "path";
const proxies = require(path.join(process.cwd(), "proxies.json"));

export class ProxiesConfig {
    public java = proxies.java as {
        [key in typeof ProxiesConfig["javaUsernames"][number]]: {
            host: string;
            port: number;
        };
    };
    public bedrock = proxies.bedrock as {
        [key in typeof ProxiesConfig["bedrockServers"][number]]: {
            [key in typeof ProxiesConfig["bedrockUsernames"][number]]: {
                host: string;
                port: number;
            };
        };
    };

    private static javaUsernames = [
        "jarcokers2",
        "spankmypickle",
        "notreadyforlife",
        "chokeonmypickle",
        "jorengamer4",
        "n0rmie",
        "demonsht",
        "stanloonaowo",
        "tayswiftlover420"
    ] as const;

    private static bedrockServers = ["vortex"] as const;

    private static bedrockUsernames = [
        "*jarcokers2",
        "*jarcoalt1",
        "*jarcoalt2",
        "*jarcoalt3",
        "*jorengamer4",
        "*joren4537",
        "*joren4133",
        "*joren5801",
        "*joren2999"
    ] as const;

    constructor() {}

    public validate(logger: Logger) {
        const errors: string[] = [];

        if (!this.java) {
            errors.push("java is required but not given");
        } else {
            for (const key of ProxiesConfig.javaUsernames) {
                if (!this.java[key]) {
                    errors.push(`java.${key} is required but not given`);
                } else if (!this.java[key].host) {
                    errors.push(`java.${key}.host is required but not given`);
                } else if (!this.java[key].port) {
                    errors.push(`java.${key}.port is required but not given`);
                } else if (isNaN(this.java[key].port)) {
                    errors.push(`java.${key}.port is a invalid number`);
                }
            }
        }

        if (!this.bedrock) {
            errors.push("bedrock is required but not given");
        } else {
            const servers: McServerNames<"bedrock">[] = ["vortex"];
            const usernames: McUsernames<"bedrock">[] = [
                "*jarcokers2",
                "*jarcoalt1",
                "*jarcoalt2",
                "*jarcoalt3",
                "*jorengamer4",
                "*joren4537",
                "*joren4133",
                "*joren5801",
                "*joren2999"
            ];

            for (const sKey of servers) {
                if (!this.bedrock[sKey]) {
                    errors.push(`bedrock.${sKey} is required but not given`);
                }

                for (const uKey of usernames) {
                    if (!this.bedrock[sKey][uKey]) {
                        errors.push(
                            `bedrock.${sKey}.${uKey} is required but not given`
                        );
                    } else if (!this.bedrock[sKey][uKey].host) {
                        errors.push(
                            `bedrock.${sKey}.${uKey}.host is required but not given`
                        );
                    } else if (!this.bedrock[sKey][uKey].port) {
                        errors.push(
                            `bedrock.${sKey}.${uKey}.port is required but not given`
                        );
                    } else if (isNaN(this.bedrock[sKey][uKey].port)) {
                        errors.push(
                            `bedrock.${sKey}.${uKey}.port is a invalid port number`
                        );
                    }
                }
            }
        }

        if (errors.length > 0) {
            logger.warn(
                ...errors.reduce((a: string[], e) => {
                    a.push(`The proxies config value ${e}`);
                    return a;
                }, [])
            );
            process.exit(0); // eslint-disable-line
        }
    }
}
