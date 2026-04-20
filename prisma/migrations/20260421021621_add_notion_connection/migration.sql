-- CreateTable
CREATE TABLE "NotionConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenCipher" TEXT NOT NULL,
    "tokenIv" TEXT NOT NULL,
    "tokenTag" TEXT NOT NULL,
    "databaseId" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotionConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotionConnection_userId_key" ON "NotionConnection"("userId");

-- AddForeignKey
ALTER TABLE "NotionConnection" ADD CONSTRAINT "NotionConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
