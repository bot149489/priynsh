const { spawn } = require("child_process");
const { readFileSync } = require("fs-extra");
const http = require("http");
const axios = require("axios");
const semver = require("semver");
const logger = require("./utils/log");

/////////////////////////////////////////////
//========= Check node.js version =========//
/////////////////////////////////////////////

// const nodeVersion = semver.parse(process.version);
// if (nodeVersion.major < 13) {
//     logger(`Your Node.js ${process.version} is not supported, it required Node.js 13 to run bot!`, "error");
//     return process.exit(0);
// };

///////////////////////////////////////////////////////////
//========= Create website for dashboard/uptime =========//
///////////////////////////////////////////////////////////

const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// Serve index.html for dashboard
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    logger(`Opened server site on port ${port}`, "[ Starting ]");
});

/////////////////////////////////////////////////////////
//========= Create start bot and make it loop =========//
/////////////////////////////////////////////////////////

function startBot(message) {
    if (message) {
        logger(message, "[ Starting ]");
    }

    const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "Priyansh.js"], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });

    child.on("close", (codeExit) => {
        if (codeExit !== 0) {
            logger("Bot crashed. Restarting...", "[ ERROR ]");
            startBot();
        }
    });

    child.on("error", function (error) {
        logger("An error occurred while starting the bot: " + JSON.stringify(error), "[ ERROR ]");
    });
};

////////////////////////////////////////////////
//========= Check update from Github =========//
////////////////////////////////////////////////

axios.get("https://raw.githubusercontent.com/priyanshu192/bot/main/package.json").then((res) => {
    logger(res.data.name, "[ NAME ]");
    logger("Version: " + res.data.version, "[ VERSION ]");
    logger(res.data.description, "[ DESCRIPTION ]");

    // Optional: Check for updates
    const localVersion = JSON.parse(readFileSync('./package.json')).version;
    if (semver.lt(localVersion, res.data.version)) {
        logger("A new update is available! Please update your bot.", "[ UPDATE ]");
    } else {
        logger("You are using the latest version!", "[ CHECK UPDATE ]");
    }
}).catch(err => logger("Unable to check update: " + JSON.stringify(err), "[ CHECK UPDATE ]"));

startBot();
