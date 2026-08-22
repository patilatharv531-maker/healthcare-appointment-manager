const OpenAI = require("openai");

const client = process.env.OPENAI_API_KEY
    ? new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    })
    : null;


// ======================================================
// PRE-VISIT SYMPTOM SUMMARY
// ======================================================

const generatePreVisitSummary = async (symptoms) => {

    // No API key
    if (!client) {
        return {
            success: false,
            status: "FAILED",
            error: "LLM API key is not configured"
        };
    }

    const prompt = `
You are assisting a doctor before a patient appointment.

Analyze the patient's symptoms and create a concise
pre-visit summary.

IMPORTANT:
- Do NOT diagnose the patient.
- Do NOT prescribe medication.
- Do NOT provide treatment instructions.
- This is only decision support for a qualified doctor.

Return exactly:

Urgency: Low, Medium, or High

Chief Complaint:
A short description of the main concern.

Suggested Questions:
1. Question the doctor should ask the patient.
2. Question the doctor should ask the patient.
3. Question the doctor should ask the patient.

Patient Symptoms:
${symptoms}
`;

    try {

        const response = await client.responses.create({
            model: "gpt-5-mini",
            input: prompt
        });

        const summary =
            response.output_text?.trim();

        if (!summary) {
            return {
                success: false,
                status: "FAILED",
                error: "LLM returned an empty response"
            };
        }

        return {
            success: true,
            status: "COMPLETED",
            summary
        };

    } catch (error) {

        console.error(
            "Pre-visit LLM failed:",
            error.message
        );

        return {
            success: false,
            status: "FAILED",
            error: error.message
        };
    }
};


// ======================================================
// POST-VISIT PATIENT SUMMARY
// ======================================================

const generatePostVisitSummary = async (notes) => {

    if (!client) {
        return {
            success: false,
            status: "FAILED",
            error: "LLM API key is not configured"
        };
    }

    const prompt = `
Convert the following clinical notes into a simple,
patient-friendly summary.

IMPORTANT:
- Do not invent information.
- Preserve the doctor's instructions accurately.
- Do not change medication names or dosages.
- Do not add information that is not present.

Return:

Visit Summary:
A simple explanation of what was discussed.

Medication Schedule:
List each medication and its prescribed frequency.

Follow-up Steps:
List the next steps given by the doctor.

Clinical Notes:
${notes}
`;

    try {

        const response = await client.responses.create({
            model: "gpt-5-mini",
            input: prompt
        });

        const summary =
            response.output_text?.trim();

        if (!summary) {
            return {
                success: false,
                status: "FAILED",
                error: "LLM returned an empty response"
            };
        }

        return {
            success: true,
            status: "COMPLETED",
            summary
        };

    } catch (error) {

        console.error(
            "Post-visit LLM failed:",
            error.message
        );

        return {
            success: false,
            status: "FAILED",
            error: error.message
        };
    }
};


// ======================================================
// SAFE FALLBACK
// ======================================================

const createFallbackPreVisitSummary = (symptoms) => {

    return `
AI summary is currently unavailable.

Patient symptoms submitted:
${symptoms}

The doctor should review the patient's symptoms
directly and perform the appropriate clinical assessment.

Urgency:
Requires doctor assessment.

Suggested Questions:
1. When did the symptoms begin?
2. How severe are the symptoms?
3. Have the symptoms changed or become worse?
`;
};


module.exports = {
    generatePreVisitSummary,
    generatePostVisitSummary,
    createFallbackPreVisitSummary
};