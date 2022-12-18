/*
  Warnings:

  - You are about to drop the column `calendarId` on the `Club` table. All the data in the column will be lost.
  - You are about to drop the column `calendarId` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `calendarId` on the `Site` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Club" DROP CONSTRAINT "Club_calendarId_fkey";

-- DropForeignKey
ALTER TABLE "Room" DROP CONSTRAINT "Room_calendarId_fkey";

-- DropForeignKey
ALTER TABLE "Site" DROP CONSTRAINT "Site_calendarId_fkey";

-- AlterTable
ALTER TABLE "Club" DROP COLUMN "calendarId";

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "calendarId";

-- AlterTable
ALTER TABLE "Site" DROP COLUMN "calendarId";

-- CreateTable
CREATE TABLE "_ClubToOpeningCalendar" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_OpeningCalendarToRoom" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_OpeningCalendarToSite" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ClubToOpeningCalendar_AB_unique" ON "_ClubToOpeningCalendar"("A", "B");

-- CreateIndex
CREATE INDEX "_ClubToOpeningCalendar_B_index" ON "_ClubToOpeningCalendar"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_OpeningCalendarToRoom_AB_unique" ON "_OpeningCalendarToRoom"("A", "B");

-- CreateIndex
CREATE INDEX "_OpeningCalendarToRoom_B_index" ON "_OpeningCalendarToRoom"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_OpeningCalendarToSite_AB_unique" ON "_OpeningCalendarToSite"("A", "B");

-- CreateIndex
CREATE INDEX "_OpeningCalendarToSite_B_index" ON "_OpeningCalendarToSite"("B");

-- AddForeignKey
ALTER TABLE "_ClubToOpeningCalendar" ADD CONSTRAINT "_ClubToOpeningCalendar_A_fkey" FOREIGN KEY ("A") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClubToOpeningCalendar" ADD CONSTRAINT "_ClubToOpeningCalendar_B_fkey" FOREIGN KEY ("B") REFERENCES "OpeningCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpeningCalendarToRoom" ADD CONSTRAINT "_OpeningCalendarToRoom_A_fkey" FOREIGN KEY ("A") REFERENCES "OpeningCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpeningCalendarToRoom" ADD CONSTRAINT "_OpeningCalendarToRoom_B_fkey" FOREIGN KEY ("B") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpeningCalendarToSite" ADD CONSTRAINT "_OpeningCalendarToSite_A_fkey" FOREIGN KEY ("A") REFERENCES "OpeningCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpeningCalendarToSite" ADD CONSTRAINT "_OpeningCalendarToSite_B_fkey" FOREIGN KEY ("B") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
