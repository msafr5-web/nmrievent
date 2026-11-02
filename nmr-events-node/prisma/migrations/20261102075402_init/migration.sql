-- CreateEnum
CREATE TYPE "VenueType" AS ENUM ('INDOOR', 'OUTDOOR');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('PENDING', 'COMPLIANT', 'CONDITIONAL', 'NON_COMPLIANT');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('PLANNED', 'ACTIVE', 'ON_BREAK', 'OFF_DUTY');

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dob" DATE NOT NULL,
    "email" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "uniqueTrackingId" TEXT,
    "clientIp" TEXT,
    "qrCodeUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpChallenge" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventProject" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "spaceArea" DOUBLE PRECISION NOT NULL,
    "duration" INTEGER NOT NULL,
    "venueType" "VenueType" NOT NULL,
    "complianceStatus" "ComplianceStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT NOT NULL DEFAULT 'exhibition',
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "currentOccupancy" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EventProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrowdStaff" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "status" "StaffStatus" NOT NULL DEFAULT 'PLANNED',
    "assignedEventId" TEXT,

    CONSTRAINT "CrowdStaff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_uniqueTrackingId_key" ON "Employee"("uniqueTrackingId");

-- CreateIndex
CREATE INDEX "Employee_verified_idx" ON "Employee"("verified");

-- CreateIndex
CREATE UNIQUE INDEX "OtpChallenge_employeeId_key" ON "OtpChallenge"("employeeId");

-- CreateIndex
CREATE INDEX "CrowdStaff_assignedEventId_idx" ON "CrowdStaff"("assignedEventId");

-- AddForeignKey
ALTER TABLE "OtpChallenge" ADD CONSTRAINT "OtpChallenge_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrowdStaff" ADD CONSTRAINT "CrowdStaff_assignedEventId_fkey" FOREIGN KEY ("assignedEventId") REFERENCES "EventProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
