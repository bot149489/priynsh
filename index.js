const { spawn } = require("child_process");
const { readFileSync } = require("fs-extra");
const axios = require("axios");
const semver = require("semver");
const logger = require("./utils/log");

const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port);
logger("Opened server site...", "[ Starting ]");

/////////////////////////////////////////////////////////
//========= Create start bot and make it loop =========//
/////////////////////////////////////////////////////////

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function startBot(message) {
    (message) ? logger(message, "[ Starting ]") : "";

    const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "Priyansh.js"], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });

    child.on("close", async (codeExit) => {
        if (codeExit !== 0) {
            logger("Bot crashed with exit code " + codeExit, "[ ERROR ]");
            logger("Waiting for 15 seconds before restart...", "[ Restarting ]");
            await delay(15000);  // Wait 15 seconds before restarting
            global.countRestart = (global.countRestart || 0) + 1;
            
            if (global.countRestart < 5) {
                startBot("Restarting bot...");
            } else {
                logger("Bot failed to restart multiple times. Please check the error.", "[ ERROR ]");
            }
        }
    });

    child.on("error", function (error) {
        logger("An error occurred: " + JSON.stringify(error), "[ ERROR ]");
    });
}

////////////////////////////////////////////////
//========= Check update from GitHub =========//
////////////////////////////////////////////////

axios.get("https://raw.githubusercontent.com/priyanshu192/bot/main/package.json").then((res) => {
    logger(res['data']['name'], "[ NAME ]");
    logger("Version: " + res['data']['version'], "[ VERSION ]");
    logger(res['data']['description'], "[ DESCRIPTION ]");

    const local = JSON.parse(readFileSync('./package.json'));
    if (semver.lt(local.version, res['data']['version'])) {
        logger("A new update is available! Please update your bot using 'node update.js'.", "[ UPDATE ]");
    } else {
        logger("You are using the latest version!", "[ UPDATE ]");
    }

    startBot();
}).catch(err => {
    logger("Unable to check for updates. Starting bot without checking for updates.", "[ CHECK UPDATE ]");
    startBot();
});

/////////////////////////////////////////////////////////////
//========= Enhanced Rate-Limiting and Error Handling ======//
/////////////////////////////////////////////////////////////

async function sendMessage(api, threadID, message) {
    try {
        // Add a random delay to mimic human-like behavior (between 1 to 5 seconds)
        const randomDelay = Math.floor(Math.random() * 5000) + 1000;
        await delay(randomDelay); 
        await api.sendMessage(message, threadID);
    } catch (error) {
        logger("Error while sending message: " + error, "[ ERROR ]");
    }
}

// You should apply similar rate limiting and randomization for other Facebook API interactions.
