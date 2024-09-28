module.exports.config = {
    name: "grouplockdp",
    version: "1.0.0",
    credits: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
    hasPermssion: 1,
    description: "Lock or unlock the ability to change the group profile picture",
    usages: "grouplockdp on/off",
    commandCategory: "system",
    cooldowns: 0
};

module.exports.run = async({ api, event, Threads }) => {
    let data = (await Threads.getData(event.threadID)).data || {};
    if (typeof data["grouplockdp"] == "undefined" || data["grouplockdp"] == false) {
        data["grouplockdp"] = true;

        // Lock the group DP by storing the current DP URL
        let threadInfo = await api.getThreadInfo(event.threadID);
        data["currentDP"] = threadInfo.imageSrc;

        await Threads.setData(event.threadID, { data });
        global.data.threadData.set(parseInt(event.threadID), data);

        return api.sendMessage("✅ Group profile picture lock enabled. Only the bot can change the group DP now.", event.threadID);
    } else {
        data["grouplockdp"] = false;

        await Threads.setData(event.threadID, { data });
        global.data.threadData.set(parseInt(event.threadID), data);

        return api.sendMessage("✅ Group profile picture lock disabled. Members can now change the group DP.", event.threadID);
    }
};
