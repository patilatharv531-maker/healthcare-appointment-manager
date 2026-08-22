const express = require("express");
const jwt = require("jsonwebtoken");
const authenticate = require("../middleware/authMiddleware");
const prisma = require("../utils/prisma");

const {
    getGoogleAuthUrl,
    getTokensFromCode
} = require("../services/googleCalendarService");

const router = express.Router();


// ==================================================
// CONNECT GOOGLE CALENDAR
// ==================================================

router.get("/connect", authenticate, (req, res) => {

    try {

        const state = req.user.userId;

        const authUrl = getGoogleAuthUrl(state);

        return res.redirect(authUrl);

    } catch (error) {

        console.error(
            "Google OAuth start error:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to start Google Calendar connection"
        });
    }
});


// ==================================================
// CONNECT GOOGLE CALENDAR FROM BROWSER
// ==================================================

router.get("/connect-browser", (req, res) => {

    try {

        const { token } = req.query;

        if (!token) {
            return res.status(401).json({
                message:
                    "Authentication token is required"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const state = decoded.userId;

        const authUrl =
            getGoogleAuthUrl(state);

        return res.redirect(authUrl);

    } catch (error) {

        console.error(
            "Google browser OAuth error:",
            error
        );

        return res.status(401).json({
            message:
                "Invalid or expired authentication token"
        });
    }
});


// ==================================================
// GOOGLE OAUTH CALLBACK
// ==================================================

router.get("/oauth2callback", async (req, res) => {

    try {

        const {
            code,
            state
        } = req.query;

        if (!code) {
            return res.status(400).json({
                message:
                    "Authorization code is missing"
            });
        }

        if (!state) {
            return res.status(400).json({
                message:
                    "User information is missing"
            });
        }

        const userId = state;

        const tokens =
            await getTokensFromCode(code);

        if (!tokens.access_token) {
            return res.status(500).json({
                message:
                    "Google did not return an access token"
            });
        }

        // ------------------------------------------
        // Save / update Google Calendar account
        // ------------------------------------------

        await prisma.googleCalendarAccount.upsert({

            where: {
                userId
            },

            update: {
                accessToken:
                    tokens.access_token,

                refreshToken:
                    tokens.refresh_token || undefined,

                expiryDate:
                    tokens.expiry_date
                        ? BigInt(tokens.expiry_date)
                        : null
            },

            create: {
                userId,

                accessToken:
                    tokens.access_token,

                refreshToken:
                    tokens.refresh_token || null,

                expiryDate:
                    tokens.expiry_date
                        ? BigInt(tokens.expiry_date)
                        : null
            }
        });

        console.log(
            `Google Calendar connected for user ${userId}`
        );

        // ------------------------------------------
        // Return user to frontend
        // ------------------------------------------

        return res.redirect(
            "http://localhost:5173/?calendar=connected"
        );

    } catch (error) {

        console.error(
            "Google OAuth callback error:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to connect Google Calendar"
        });
    }
});


// ==================================================
// CHECK GOOGLE CALENDAR STATUS
// ==================================================

router.get(
    "/status",
    authenticate,
    async (req, res) => {

        try {

            const account =
                await prisma.googleCalendarAccount.findUnique({
                    where: {
                        userId: req.user.userId
                    },
                    select: {
                        id: true
                    }
                });

            return res.status(200).json({
                connected: !!account
            });

        } catch (error) {

            console.error(
                "Google Calendar status error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to check Google Calendar status"
            });
        }
    }
);


module.exports = router;