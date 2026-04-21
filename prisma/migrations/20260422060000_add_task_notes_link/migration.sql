-- 新增 Task ↔ Note 隐式多对多中间表
-- Prisma 默认命名约定：`_<ModelA>To<ModelB>`（字母序），A/B 列分别为 FK。

-- CreateTable
CREATE TABLE "_NoteToTask" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL,
  CONSTRAINT "_NoteToTask_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_NoteToTask_B_index" ON "_NoteToTask"("B");

-- AddForeignKey
ALTER TABLE "_NoteToTask" ADD CONSTRAINT "_NoteToTask_A_fkey" FOREIGN KEY ("A") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NoteToTask" ADD CONSTRAINT "_NoteToTask_B_fkey" FOREIGN KEY ("B") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
