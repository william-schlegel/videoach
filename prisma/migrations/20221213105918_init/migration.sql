-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MEMBER', 'COACH', 'MANAGER', 'MANAGER_COACH', 'ADMIN');

-- CreateEnum
CREATE TYPE "RoomReservation" AS ENUM ('NONE', 'POSSIBLE', 'MANDATORY');

-- CreateEnum
CREATE TYPE "DayName" AS ENUM ('SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY');

-- CreateTable
CREATE TABLE "Example" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Example_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "calendarId" TEXT,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "openWithClub" BOOLEAN NOT NULL DEFAULT true,
    "calendarId" TEXT,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reservation" "RoomReservation" NOT NULL DEFAULT 'NONE',
    "capacity" INTEGER NOT NULL,
    "unavailable" BOOLEAN NOT NULL DEFAULT false,
    "openWithClub" BOOLEAN NOT NULL DEFAULT true,
    "openWithSite" BOOLEAN NOT NULL DEFAULT true,
    "calendarId" TEXT,
    "siteId" TEXT NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "default" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,

    CONSTRAINT "ActivityGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpeningCalendar" (
    "id" TEXT NOT NULL,

    CONSTRAINT "OpeningCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayOpeningTime" (
    "id" TEXT NOT NULL,
    "name" "DayName" NOT NULL,
    "openingTimeId" TEXT NOT NULL,
    "wholeDay" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DayOpeningTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpeningTime" (
    "id" TEXT NOT NULL,
    "opening" TIME NOT NULL,
    "closing" TIME NOT NULL,

    CONSTRAINT "OpeningTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Member" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_DayOpeningTimeToOpeningTime" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_DayOpeningTimeToOpeningCalendar" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "_Member_AB_unique" ON "_Member"("A", "B");

-- CreateIndex
CREATE INDEX "_Member_B_index" ON "_Member"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_DayOpeningTimeToOpeningTime_AB_unique" ON "_DayOpeningTimeToOpeningTime"("A", "B");

-- CreateIndex
CREATE INDEX "_DayOpeningTimeToOpeningTime_B_index" ON "_DayOpeningTimeToOpeningTime"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_DayOpeningTimeToOpeningCalendar_AB_unique" ON "_DayOpeningTimeToOpeningCalendar"("A", "B");

-- CreateIndex
CREATE INDEX "_DayOpeningTimeToOpeningCalendar_B_index" ON "_DayOpeningTimeToOpeningCalendar"("B");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "OpeningCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "OpeningCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "OpeningCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityGroup" ADD CONSTRAINT "ActivityGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ActivityGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Member" ADD CONSTRAINT "_Member_A_fkey" FOREIGN KEY ("A") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Member" ADD CONSTRAINT "_Member_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DayOpeningTimeToOpeningTime" ADD CONSTRAINT "_DayOpeningTimeToOpeningTime_A_fkey" FOREIGN KEY ("A") REFERENCES "DayOpeningTime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DayOpeningTimeToOpeningTime" ADD CONSTRAINT "_DayOpeningTimeToOpeningTime_B_fkey" FOREIGN KEY ("B") REFERENCES "OpeningTime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DayOpeningTimeToOpeningCalendar" ADD CONSTRAINT "_DayOpeningTimeToOpeningCalendar_A_fkey" FOREIGN KEY ("A") REFERENCES "DayOpeningTime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DayOpeningTimeToOpeningCalendar" ADD CONSTRAINT "_DayOpeningTimeToOpeningCalendar_B_fkey" FOREIGN KEY ("B") REFERENCES "OpeningCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
