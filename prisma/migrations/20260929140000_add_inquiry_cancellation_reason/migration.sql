ALTER TYPE "PipelineOutcome" ADD VALUE 'CANCELLED';

ALTER TABLE "Inquiry" ADD COLUMN "cancellationReason" TEXT;
