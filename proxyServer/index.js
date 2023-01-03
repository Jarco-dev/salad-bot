require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const { socks5 } = require("@sansamour/node-socks");

// Validate config
const errors = [];
const PORT = parseInt(process.env.PORT);
const IP_WHITELIST =
    process.env.IP_WHITELIST && process.env.IP_WHITELIST.length > 0
        ? process.env.IP_WHITELIST.split(",")
        : undefined;

if (!PORT || isNaN(PORT)) {
    errors.push("PORT is required but not given or isn't a number");
}

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

// Start proxy server
const server = socks5.createServer({
    port: PORT,
    onAccept: (socket, info, accept) => {
        if (!IP_WHITELIST.includes(info.srcAddr)) {
            console.log(`Ignoring connection from: ${info.srcAddr}`);
            return;
        }
        accept();
    }
});
console.log("Bot proxy started");

server.on("error", err => {
    console.error("\n", err);
});
