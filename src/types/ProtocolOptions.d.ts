import { McUsernames, McServerNames } from "@/types";

export interface ProtocolOptions<T extends ProtocolOptions["protocol"]> {
    username: McUsernames[T];
    protocol: T;
    server: McServerNames[T];
    version: T extends "java" ? "1.17.1" : "1.19.50";
    viewDistance?: number;
    hideInfoLogs?: boolean;
    hideErrorLogs?: boolean;
}
