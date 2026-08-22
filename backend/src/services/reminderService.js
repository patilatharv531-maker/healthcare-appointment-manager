const prisma = require("../utils/prisma");

// ======================================================
// CREATE MEDICATION REMINDERS
// ======================================================

const createMedicationReminders = async ({
    prescriptionId,
    patientId,
    frequency,
    duration,
    startDate
}) => {

    // ----------------------------------------------
    // Convert frequency to number of reminders/day
    // ----------------------------------------------

    let remindersPerDay = 1;

    const frequencyText =
        frequency.toLowerCase();

    if (
        frequencyText.includes("twice") ||
        frequencyText.includes("2")
    ) {
        remindersPerDay = 2;
    }
    else if (
        frequencyText.includes("three") ||
        frequencyText.includes("3")
    ) {
        remindersPerDay = 3;
    }
    else if (
        frequencyText.includes("four") ||
        frequencyText.includes("4")
    ) {
        remindersPerDay = 4;
    }

    // ----------------------------------------------
    // Duration in days
    // ----------------------------------------------

    const durationMatch =
        duration.match(/\d+/);

    const durationDays =
        durationMatch
            ? parseInt(durationMatch[0])
            : 1;

    // ----------------------------------------------
    // Default reminder times
    // ----------------------------------------------

    const reminderHours = {
        1: [9],
        2: [9, 21],
        3: [9, 15, 21],
        4: [9, 13, 17, 21]
    };

    const hours =
        reminderHours[remindersPerDay];

    const reminders = [];

    // ----------------------------------------------
    // Generate reminders
    // ----------------------------------------------

    for (
        let day = 0;
        day < durationDays;
        day++
    ) {

        for (const hour of hours) {

            const reminderTime =
                new Date(startDate);

            reminderTime.setDate(
                reminderTime.getDate() + day
            );

            reminderTime.setHours(
                hour,
                0,
                0,
                0
            );

            reminders.push({
                prescriptionId,
                patientId,
                reminderTime,
                status: "PENDING"
            });
        }
    }

    // ----------------------------------------------
    // Avoid duplicate reminders
    // ----------------------------------------------

    if (reminders.length > 0) {

        await prisma.medicationReminder.createMany({
            data: reminders,
            skipDuplicates: true
        });
    }

    return reminders.length;
};


module.exports = {
    createMedicationReminders
};