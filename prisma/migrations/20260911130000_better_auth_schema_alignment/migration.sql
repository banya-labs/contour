ALTER TABLE "session" ADD COLUMN "activeOrganizationId" TEXT;

ALTER TABLE "account" ADD COLUMN "idToken" TEXT;
ALTER TABLE "account" ADD COLUMN "accessTokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "account" ADD COLUMN "refreshTokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "account" ADD COLUMN "scope" TEXT;

ALTER TABLE "organization" ADD COLUMN "metadata" TEXT;

ALTER TABLE "invitation" ADD COLUMN "inviterId" TEXT;

ALTER TABLE "invitation"
ADD CONSTRAINT "invitation_inviterId_fkey"
FOREIGN KEY ("inviterId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
