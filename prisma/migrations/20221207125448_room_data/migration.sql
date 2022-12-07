/*
  Warnings:

  - Added the required column `capacity` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `closingTime` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `openingTime` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RoomReservation" AS ENUM ('NONE', 'POSSIBLE', 'MANDATORY');

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "capacity" INTEGER NOT NULL,
ADD COLUMN     "closingTime" TIME NOT NULL,
ADD COLUMN     "openWithClub" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "openingTime" TIME NOT NULL,
ADD COLUMN     "reservation" "RoomReservation" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "unavailable" BOOLEAN NOT NULL DEFAULT false;
