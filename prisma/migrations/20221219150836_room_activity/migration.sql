-- CreateTable
CREATE TABLE "_ActivityToRoom" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ActivityToRoom_AB_unique" ON "_ActivityToRoom"("A", "B");

-- CreateIndex
CREATE INDEX "_ActivityToRoom_B_index" ON "_ActivityToRoom"("B");

-- AddForeignKey
ALTER TABLE "_ActivityToRoom" ADD CONSTRAINT "_ActivityToRoom_A_fkey" FOREIGN KEY ("A") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivityToRoom" ADD CONSTRAINT "_ActivityToRoom_B_fkey" FOREIGN KEY ("B") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
