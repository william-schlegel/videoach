/*
  Warnings:

  - A unique constraint covering the columns `[id,clubId]` on the table `Activity` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Activity_id_clubId_key" ON "Activity"("id", "clubId");
