-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '无题',
    "content" TEXT NOT NULL DEFAULT '',
    "folderId" TEXT,
    "tags" TEXT[],
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteFolder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "orderIdx" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteLink" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "context" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiDigest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "noteIds" TEXT[],
    "prompt" TEXT,
    "result" TEXT NOT NULL,
    "savedAsNoteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiDigest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Note_userId_folderId_idx" ON "Note"("userId", "folderId");
CREATE INDEX "Note_userId_updatedAt_idx" ON "Note"("userId", "updatedAt");
CREATE INDEX "Note_userId_pinned_idx" ON "Note"("userId", "pinned");

-- CreateIndex
CREATE INDEX "NoteFolder_userId_parentId_idx" ON "NoteFolder"("userId", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "NoteLink_sourceId_targetId_key" ON "NoteLink"("sourceId", "targetId");
CREATE INDEX "NoteLink_targetId_idx" ON "NoteLink"("targetId");

-- CreateIndex
CREATE INDEX "AiDigest_userId_createdAt_idx" ON "AiDigest"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Note" ADD CONSTRAINT "Note_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "NoteFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteFolder" ADD CONSTRAINT "NoteFolder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NoteFolder" ADD CONSTRAINT "NoteFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "NoteFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteLink" ADD CONSTRAINT "NoteLink_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NoteLink" ADD CONSTRAINT "NoteLink_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDigest" ADD CONSTRAINT "AiDigest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
