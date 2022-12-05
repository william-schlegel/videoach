/*
  Warnings:

  - You are about to drop the column `clubId` on the `Activity` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_clubId_fkey";

-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "clubId";

-- CreateTable
CREATE TABLE "ActivityGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "default" BOOLEAN NOT NULL,

    CONSTRAINT "ActivityGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ActivityToActivityGroup" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ActivityToClub" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ActivityToActivityGroup_AB_unique" ON "_ActivityToActivityGroup"("A", "B");

-- CreateIndex
CREATE INDEX "_ActivityToActivityGroup_B_index" ON "_ActivityToActivityGroup"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ActivityToClub_AB_unique" ON "_ActivityToClub"("A", "B");

-- CreateIndex
CREATE INDEX "_ActivityToClub_B_index" ON "_ActivityToClub"("B");

-- AddForeignKey
ALTER TABLE "_ActivityToActivityGroup" ADD CONSTRAINT "_ActivityToActivityGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivityToActivityGroup" ADD CONSTRAINT "_ActivityToActivityGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "ActivityGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivityToClub" ADD CONSTRAINT "_ActivityToClub_A_fkey" FOREIGN KEY ("A") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivityToClub" ADD CONSTRAINT "_ActivityToClub_B_fkey" FOREIGN KEY ("B") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
