module.exports.config = {
    name: "nicknamelock",
    version: "1.0.0",
    credits: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
    hasPermssion: 1,
    description: "Lock or unlock nickname changes for all members",
    usages: "nicknamelock on/off",
    commandCategory: "system",
    cooldowns: 0
};

module.exports.run = async({ api, event, Threads }) => {
    let data = (await Threads.getData(event.threadID)).data || {};
    if (typeof data["nicknamelock"] == "undefined" || data["nicknamelock"] == false) {
        data["nicknamelock"] = true;
        
        // Get all participants and set their nicknames (if not already set)
        let threadInfo = await api.getThreadInfo(event.threadID);
        let participants = threadInfo.participantIDs;

        for (let userID of participants) {
            let userInfo = await api.getUserInfo(userID);
            let nickname = userInfo[userID].name;
            
            // Set nickname if it doesn't already exist
            await api.changeNickname(nickname, event.threadID, userID);
        }

        await Threads.setData(event.threadID, { data });
        global.data.threadData.set(parseInt(event.threadID), data);
        return api.sendMessage("✅ Nickname lock enabled. Only the bot can change nicknames now.", event.threadID);
    } else {
        data["nicknamelock"] = false;
        await Threads.setData(event.threadID, { data });
        global.data.threadData.set(parseInt(event.threadID), data);
        return api.sendMessage("✅ Nickname lock disabled. Members can now change their nicknames.", event.threadID);
    }
};
