/*
  Warnings:

  - You are about to drop the `_ActivityToActivityGroup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ActivityToClub` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `clubId` to the `Activity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `groupId` to the `Activity` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_ActivityToActivityGroup" DROP CONSTRAINT "_ActivityToActivityGroup_A_fkey";

-- DropForeignKey
ALTER TABLE "_ActivityToActivityGroup" DROP CONSTRAINT "_ActivityToActivityGroup_B_fkey";

-- DropForeignKey
ALTER TABLE "_ActivityToClub" DROP CONSTRAINT "_ActivityToClub_A_fkey";

-- DropForeignKey
ALTER TABLE "_ActivityToClub" DROP CONSTRAINT "_ActivityToClub_B_fkey";

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "clubId" TEXT NOT NULL,
ADD COLUMN     "groupId" TEXT NOT NULL;

-- DropTable
DROP TABLE "_ActivityToActivityGroup";

-- DropTable
DROP TABLE "_ActivityToClub";

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ActivityGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
