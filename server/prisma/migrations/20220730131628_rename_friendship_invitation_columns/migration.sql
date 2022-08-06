/*
  Warnings:

  - You are about to drop the column `fromUserId` on the `FriendshipInvitvation` table. All the data in the column will be lost.
  - You are about to drop the column `toUserId` on the `FriendshipInvitvation` table. All the data in the column will be lost.
  - Added the required column `inviteeId` to the `FriendshipInvitvation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inviterId` to the `FriendshipInvitvation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "FriendshipInvitvation" DROP CONSTRAINT "FriendshipInvitvation_fromUserId_fkey";

-- DropForeignKey
ALTER TABLE "FriendshipInvitvation" DROP CONSTRAINT "FriendshipInvitvation_toUserId_fkey";

-- AlterTable
ALTER TABLE "FriendshipInvitvation" DROP COLUMN "fromUserId",
DROP COLUMN "toUserId",
ADD COLUMN     "inviteeId" TEXT NOT NULL,
ADD COLUMN     "inviterId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "FriendshipInvitvation" ADD CONSTRAINT "FriendshipInvitvation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendshipInvitvation" ADD CONSTRAINT "FriendshipInvitvation_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
