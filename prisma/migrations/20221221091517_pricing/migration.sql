-- CreateTable
CREATE TABLE "Pricing" (
    "id" TEXT NOT NULL,
    "roleTarget" "Role" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "free" BOOLEAN DEFAULT false,
    "highlighted" BOOLEAN DEFAULT false,
    "monthly" DOUBLE PRECISION DEFAULT 0,
    "yearly" DOUBLE PRECISION DEFAULT 0,
    "options" TEXT[],

    CONSTRAINT "Pricing_pkey" PRIMARY KEY ("id")
);
