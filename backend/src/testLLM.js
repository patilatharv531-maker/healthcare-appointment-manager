require("dotenv").config();

const {
    generatePreVisitSummary
} = require("./services/llmService");

const test = async () => {

    const symptoms =
        "I have had mild chest discomfort for two days and occasional dizziness.";

    const result =
        await generatePreVisitSummary(symptoms);

    console.log("\n========== AI RESULT ==========\n");

    console.log(result);

    console.log("\n===============================\n");
};

test();