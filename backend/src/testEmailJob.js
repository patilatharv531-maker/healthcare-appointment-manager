require("dotenv").config();

const { createEmailJob } = require("./services/emailJobService");

const test = async () => {
    try {
        const job = await createEmailJob({
            to: "test@example.com",
            subject: "Retry System Test",
            text: "This is a retry test."
        });

        console.log("EMAIL JOB CREATED:");
        console.log(job);

        process.exit(0);

    } catch (error) {
        console.error("ERROR:");
        console.error(error);

        process.exit(1);
    }
};

test();