const { google } = require("googleapis");


// ==================================================
// CREATE OAUTH CLIENT
// ==================================================

const getOAuth2Client = () => {

    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
};


// ==================================================
// GOOGLE AUTH URL
// ==================================================

const getGoogleAuthUrl = (state) => {

    const oauth2Client =
        getOAuth2Client();

    return oauth2Client.generateAuthUrl({

        access_type: "offline",

        prompt: "consent",

        state,

        scope: [
            "https://www.googleapis.com/auth/calendar"
        ]
    });
};


// ==================================================
// GET TOKENS FROM GOOGLE
// ==================================================

const getTokensFromCode = async (code) => {

    const oauth2Client =
        getOAuth2Client();

    const { tokens } =
        await oauth2Client.getToken(code);

    return tokens;
};


// ==================================================
// CREATE AUTHENTICATED GOOGLE CLIENT
// ==================================================

const getAuthenticatedClient = async ({
    accessToken,
    refreshToken,
    expiryDate
}) => {

    const oauth2Client =
        getOAuth2Client();

    oauth2Client.setCredentials({

        access_token:
            accessToken,

        refresh_token:
            refreshToken,

        expiry_date:
            expiryDate
                ? Number(expiryDate)
                : undefined
    });


    // --------------------------------------------------
    // Check whether access token is expired
    // --------------------------------------------------

    if (
        expiryDate &&
        Date.now() >= Number(expiryDate)
    ) {

        console.log(
            "Google access token expired. Refreshing..."
        );

        const {
            credentials
        } =
            await oauth2Client.refreshAccessToken();

        oauth2Client.setCredentials(
            credentials
        );

        console.log(
            "Google access token refreshed successfully"
        );
    }

    return oauth2Client;
};


// ==================================================
// CREATE CALENDAR EVENT
// ==================================================

const createCalendarEvent = async ({
    tokens,
    summary,
    description,
    startTime,
    endTime,
    attendeeEmail
}) => {

    const oauth2Client =
        await getAuthenticatedClient({

            accessToken:
                tokens.access_token,

            refreshToken:
                tokens.refresh_token,

            expiryDate:
                tokens.expiry_date
        });


    const calendar =
        google.calendar({

            version: "v3",

            auth: oauth2Client
        });


    const event = {

        summary,

        description,

        start: {

            dateTime:
                new Date(
                    startTime
                ).toISOString(),

            timeZone:
                "Asia/Kolkata"
        },

        end: {

            dateTime:
                new Date(
                    endTime
                ).toISOString(),

            timeZone:
                "Asia/Kolkata"
        },

        attendees:
            attendeeEmail
                ? [
                    {
                        email:
                            attendeeEmail
                    }
                ]
                : []
    };


    const response =
        await calendar.events.insert({

            calendarId:
                "primary",

            resource:
                event,

            sendUpdates:
                "all"
        });


    return response.data;
};


// ==================================================
// DELETE CALENDAR EVENT
// ==================================================

const deleteCalendarEvent = async ({
    tokens,
    googleEventId
}) => {

    const oauth2Client =
        await getAuthenticatedClient({

            accessToken:
                tokens.access_token,

            refreshToken:
                tokens.refresh_token,

            expiryDate:
                tokens.expiry_date
        });


    const calendar =
        google.calendar({

            version: "v3",

            auth: oauth2Client
        });


    await calendar.events.delete({

        calendarId:
            "primary",

        eventId:
            googleEventId
    });


    return true;
};


// ==================================================
// UPDATE CALENDAR EVENT
// ==================================================

const updateCalendarEvent = async ({
    tokens,
    googleEventId,
    summary,
    description,
    startTime,
    endTime,
    attendeeEmail
}) => {

    const oauth2Client =
        await getAuthenticatedClient({

            accessToken:
                tokens.access_token,

            refreshToken:
                tokens.refresh_token,

            expiryDate:
                tokens.expiry_date
        });


    const calendar =
        google.calendar({

            version: "v3",

            auth: oauth2Client
        });


    const event = {

        summary,

        description,

        start: {

            dateTime:
                new Date(
                    startTime
                ).toISOString(),

            timeZone:
                "Asia/Kolkata"
        },

        end: {

            dateTime:
                new Date(
                    endTime
                ).toISOString(),

            timeZone:
                "Asia/Kolkata"
        },

        attendees:
            attendeeEmail
                ? [
                    {
                        email:
                            attendeeEmail
                    }
                ]
                : []
    };


    const response =
        await calendar.events.update({

            calendarId:
                "primary",

            eventId:
                googleEventId,

            resource:
                event,

            sendUpdates:
                "all"
        });


    return response.data;
};


// ==================================================
// EXPORTS
// ==================================================

module.exports = {

    getOAuth2Client,

    getGoogleAuthUrl,

    getTokensFromCode,

    getAuthenticatedClient,

    createCalendarEvent,

    deleteCalendarEvent,

    updateCalendarEvent
};