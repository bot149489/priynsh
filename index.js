const { spawn } = require("child_process");
const { readFileSync } = require("fs-extra");
const http = require("http");
const axios = require("axios");
const semver = require("semver");
const logger = require("./utils/log");
const express = require('express');
const path = require('path');

let globalRestartCount = 0;
const maxRestarts = 5;

// Rate limit and timeout settings
let lastRequestTime = 0;
const requestInterval = 2000; // 2 seconds between requests
const timeoutThreshold = 10000; // 10 seconds

/////////////////////////////////////////////
//========= Check node.js version =========//
/////////////////////////////////////////////
const nodeVersion = semver.parse(process.version);
if (nodeVersion.major < 13) {
    logger(`Your Node.js ${process.version} is not supported. Please upgrade to Node.js 13 or higher to run this bot!`, "error");
    process.exit(0);
}

///////////////////////////////////////////////////////////
//========= Create website for dashboard/uptime =========//
///////////////////////////////////////////////////////////
const app = express();
const port = process.env.PORT || 8080;

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    logger("Opened server site on port " + port, "[ Starting ]");
});

/////////////////////////////////////////////////////////
//========= Create start bot and make it loop =========//
/////////////////////////////////////////////////////////
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function startBot(message) {
    if (message) logger(message, "[ Starting ]");

    const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "Priyansh.js"], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });

    child.on("close", async (codeExit) => {
        if (codeExit !== 0 && globalRestartCount < maxRestarts) {
            globalRestartCount++;
            logger("Bot crashed. Restarting... Attempt " + globalRestartCount, "[ ERROR ]");
            await delay(5000); // Delay 5 seconds before restarting
            startBot("Restarting...");
        } else {
            logger("Max restart attempts reached. Stopping the bot.", "[ ERROR ]");
            return;
        }
    });

    child.on("error", function (error) {
        logger("An error occurred: " + JSON.stringify(error), "[ Starting ]");
    });
}

////////////////////////////////////////////////
//========= Check for updates from Github =========//
////////////////////////////////////////////////
async function checkForUpdates() {
    try {
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;

        if (timeSinceLastRequest < requestInterval) {
            await delay(requestInterval - timeSinceLastRequest);
        }

        const res = await axios.get("https://raw.githubusercontent.com/priyanshu192/bot/main/package.json", { timeout: timeoutThreshold });
        lastRequestTime = Date.now();
        
        logger(res.data.name, "[ NAME ]");
        logger("Version: " + res.data.version, "[ VERSION ]");
        logger(res.data.description, "[ DESCRIPTION ]");

        const local = JSON.parse(readFileSync('./package.json'));
        if (semver.lt(local.version, res.data.version)) {
            logger('A new update is available! Open terminal/cmd and type "node update" to update!', '[ UPDATE ]');
        } else {
            logger('You are using the latest version!', '[ CHECK UPDATE ]');
        }

        startBot();  // Start bot after checking updates
    } catch (error) {
        if (error.code === 'ETIMEDOUT') {
            logger('Request timed out while checking for updates. Retrying...', "[ ERROR ]");
            await delay(2000); // Retry after 2 seconds if timed out
            checkForUpdates(); // Retry the update check
        } else {
            logger("Unable to check for updates: " + error.message, "[ CHECK UPDATE ]");
            startBot();  // Even if update check fails, start the bot
        }
    }
}

// Start by checking for updates
checkForUpdates();

/* 
    If you want to automatically update and restart the bot, uncomment the following:
axios.get("https://raw.githubusercontent.com/d-jukie/miraiv2_fix/main/package.json").then((res) => {
    const local = JSON.parse(readFileSync('./package.json'));
    if (semver.lt(local.version, res.data.version)) {
        if (local.autoUpdate) {
            logger('A new update is available, starting the update process...', '[ UPDATE ]');
            const updateBot = { cwd: __dirname, stdio: 'inherit', shell: true };
            const child = spawn('node', ['update.js'], updateBot);
            child.on('exit', () => process.exit(0));
            child.on('error', (error) => logger('Unable to update: ' + JSON.stringify(error), '[ CHECK UPDATE ]'));
        } else {
            logger('A new update is available! Open terminal/cmd and type "node update" to update!', '[ UPDATE ]');
            startBot();
        }
    } else {
        logger('You are using the latest version!', '[ CHECK UPDATE ]');
        startBot();
    }
}).catch(err => logger("Unable to check update.", "[ CHECK UPDATE ]"));
*/

