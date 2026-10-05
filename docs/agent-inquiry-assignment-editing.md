# Agent PWA inquiry assignment editing

In the Agent PWA, open an inquiry and choose **Edit inquiry**. The **Assigned property / mandate** selector shows the current assignment and available workspace properties with the same listing type and currency. Choose another mandate or **Unassigned — no property / mandate**, then save. Cancel does not change the assignment.

The original property is kept visible even if it is no longer in active inventory. Leaving it unchanged sends no assignment mutation. Changing it sends `propertyId` (explicitly `null` for unassignment) and `expectedPropertyId` through the existing inquiry PATCH endpoint.

The server uses the shared attachment service inside the same transaction as the requirement edits. It enforces inquiry visibility, tenant-scoped inventory, active inquiry/available property rules, matching criteria, and concurrent assignment checks. New assignments are evaluated against requirements submitted in that same edit. Unassignment preserves the pipeline stage and records the existing attachment audit event. Subsequent progression still requires a property under the normal transition rules.

Assignment editing requires a connection. After a successful save, matching summaries are invalidated and workspace refresh events update the PWA and related surfaces. No database schema or migration changes are needed.

## Manual checks

1. Open an assigned inquiry, choose a different available mandate, save, and reopen it to confirm the new assignment.
2. Choose Unassigned, save, and confirm the property link is cleared while the stage is unchanged.
3. Leave the current assignment unchanged while editing notes; confirm it remains attached, including if it has left active inventory.
4. Change currency and choose a matching replacement; confirm validation uses the edited currency.
5. Change the assignment in another session before saving; confirm a stale edit is rejected.
6. Disconnect: confirm assignment editing and saving are disabled with reconnect guidance.
