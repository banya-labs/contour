-- New organizations must enter the trial state explicitly; active is reserved for paid/manual subscriptions.
ALTER TABLE "organization"
ALTER COLUMN "subscriptionStatus" SET DEFAULT 'trialing';
