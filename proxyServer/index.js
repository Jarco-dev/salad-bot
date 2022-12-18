require("dotenv").config();
const { socks5 } = require("@sansamour/node-socks");

// Validate config
const errors = [];
const PORT = parseInt(process.env.PROXY_SERVER_PORT);
const USER_ID = process.env.PROXY_SERVER_USER_ID;
const PASSWORD = process.env.PROXY_SERVER_PASSWORD;

if (!PORT || isNaN(PORT)) {
    errors.push(
        "PROXY_SERVER_PORT is required but not given or isn't a number"
    );
}

if (!USER_ID) {
    errors.push("PROXY_SERVER_USER_ID is required but not given");
}

if (!PASSWORD) {
    errors.push("PROXY_SERVER_PASSWORD is required but not given");
}

if (errors.length > 0) {
    console.log(
        ...errors.reduce((a, e) => {
            a.push(`The .env value ${e}`);
            return a;
        }, [])
    );
    process.exit(0); // eslint-disable-line
}

// Start proxy server
const server = socks5.createServer({
    authorization: function (userId, password) {
        return userId === USER_ID && password === PASSWORD;
    },
    port: PORT
});
console.log("Bot proxy started");

server.on("error", err => {
    console.error("\n", err);
});
