require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const bedrock = require("bedrock-protocol");

// Validate config
const errors = [];
const IP_WHITELIST =
    process.env.IP_WHITELIST && process.env.IP_WHITELIST.length > 0
        ? process.env.IP_WHITELIST.split(",")
        : undefined;

if (!IP_WHITELIST) {
    errors.push("IP_WHITELIST is required but not given");
}

if (errors.length > 0) {
    console.log(
        errors
            .reduce((a, e) => {
                a.push(`The .env value ${e}`);
                return a;
            }, [])
            .join("\n")
    );
    process.exit(0); // eslint-disable-line
}

// Start relay(s)
// eslint-disable-next-line node/no-unpublished-require
for (const relayOptions of require("./relays.json")) {
    const relay = new bedrock.Relay({
        ...relayOptions,
        host: "127.0.0.1"
    });
    relay.listen();
    console.log(
        `Relay started: 127.0.0.1:${relayOptions.port} -> ${relayOptions.destination.host}:${relayOptions.destination.port}`
    );

    relay.on("error", err => {
        console.log(err);
    });

    relay.on("connect", player => {
        if (!IP_WHITELIST.includes(player.connection.address.split("/")[0])) {
            console.log(
                `Denying connection: ${player.connection.address} -> ${relayOptions.destination.host}:${relayOptions.destination.port}`
            );
            player.close();
            return;
        }
        console.log(
            `New connection: ${player.connection.address} -> ${relayOptions.destination.host}:${relayOptions.destination.port}`
        );

        player.on("serverbound", packet => {
            if (packet.name === "disconnect")
                console.log(
                    `Closing connection: ${player.connection.address} -> ${relayOptions.destination.host}:${relayOptions.destination.port}`
                );
        });

        player.on("clientbound", packet => {
            if (packet.name === "disconnect")
                console.log(
                    `Closing connection: ${player.connection.address} -> ${relayOptions.destination.host}:${relayOptions.destination.port}`
                );
        });
    });
}
