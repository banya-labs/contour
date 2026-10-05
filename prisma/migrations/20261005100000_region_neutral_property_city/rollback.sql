-- Development-only rollback of the default; does not rewrite any saved property location.
ALTER TABLE "property" ALTER COLUMN "city" SET DEFAULT 'Lusaka';
