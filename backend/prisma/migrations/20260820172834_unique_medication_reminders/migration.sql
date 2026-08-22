/*
  Warnings:

  - A unique constraint covering the columns `[prescriptionId,reminderTime]` on the table `MedicationReminder` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MedicationReminder_prescriptionId_reminderTime_key" ON "MedicationReminder"("prescriptionId", "reminderTime");
