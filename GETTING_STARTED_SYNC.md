# Getting Started: Web + Desktop Sync

## Quick Setup (5 minutes)

### Prerequisites
```bash
# Verify you have these installed
node --version          # v18+
pnpm --version         # v8+
```

### 1. Update Dependencies

Desktop app now needs additional packages:

```bash
# Install desktop app dependencies
cd apps/desktop
pnpm install

# Should install:
# - better-sqlite3 (SQLite)
# - uuid (device ID generation)
```

### 2. Set Environment Variables

Create `.env.local` in project root:

```bash
# Web app (apps/web/.env.local)
CONTOUR_API_URL=http://localhost:3000

# Desktop app (apps/desktop/.env)
CONTOUR_API_URL=http://localhost:3000
CONTOUR_USER_ID=test-user-1
```

### 3. Run Applications

**Terminal 1: Start Web App**
```bash
cd apps/web
pnpm dev
# Runs on http://localhost:3000
```

**Terminal 2: Start Desktop App**
```bash
cd apps/desktop
pnpm dev
# Runs Electron app with sync enabled
```

**Terminal 3 (Optional): Watch Database**
```bash
# Monitor sync operations in real-time
sqlite3 ~/.contour/contour.db
> SELECT * FROM sync_queue;
```

## Testing the Sync

### Test 1: Verify Device Registration

1. Start desktop app
2. Check database for device:
```sql
SELECT device_id, device_type, app_version FROM sync_devices LIMIT 1;
```

Expected: One row with desktop device registered

### Test 2: Verify Initial Sync

1. Desktop app starts
2. Wait 5 seconds
3. Check sync state:
```sql
SELECT last_sync_at, consecutive_failures FROM sync_state LIMIT 1;
```

Expected: `last_sync_at` is recent, `consecutive_failures` = 0

### Test 3: Offline Changes

1. **Go offline:**
   - Open DevTools → Network → Offline
   - Or disconnect network cable

2. **Edit a deal on desktop:**
   - Navigate to /deals
   - Edit a deal title
   - Note: Won't auto-save (offline mode)

3. **Check sync queue:**
```sql
SELECT * FROM sync_queue WHERE status = 'pending' LIMIT 1;
```

Expected: One pending operation for deal update

4. **Go back online:**
   - Reconnect network
   - Note "syncing..." indicator

5. **Verify synced:**
```sql
SELECT COUNT(*) FROM sync_queue WHERE status = 'synced';
```

Expected: Count increased

### Test 4: Pull Remote Changes

1. **On web app:**
   - Navigate to /deals
   - Create a new deal or edit existing one
   - Save it

2. **On desktop app:**
   - Wait 30 seconds for automatic sync
   - Or check browser console for sync logs

3. **Verify on desktop:**
```sql
SELECT COUNT(*) FROM deals;
```

Expected: Deal count increased

## API Testing

### Register Device Manually

```bash
curl -X POST http://localhost:3000/api/sync/register \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "deviceId": "device-123",
    "deviceType": "desktop",
    "appVersion": "1.0.0"
  }'
```

### Pull Data

```bash
curl -X POST http://localhost:3000/api/sync/pull \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device-123"
  }'
```

### Push Changes

```bash
curl -X POST http://localhost:3000/api/sync/push \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device-123",
    "operations": [
      {
        "id": "op-1",
        "entityType": "deal",
        "entityId": "deal-uuid",
        "operationType": "update",
        "payload": {"title": "Updated Deal"}
      }
    ]
  }'
```

## Database Queries

### View Sync Status

```sql
-- All devices
SELECT device_id, device_type, app_version, last_seen_at 
FROM sync_devices 
ORDER BY last_seen_at DESC;

-- Sync state per device
SELECT 
  d.device_id,
  s.last_sync_at,
  s.consecutive_failures,
  s.last_error_code
FROM sync_devices d
LEFT JOIN sync_state s ON d.id = s.device_id;

-- Pending operations
SELECT 
  entity_type,
  operation_type,
  COUNT(*) as count
FROM sync_operations
WHERE status = 'pending'
GROUP BY entity_type, operation_type;

-- Failed operations
SELECT 
  entity_type,
  entity_id,
  error_message,
  created_at
FROM sync_operations
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### Local SQLite Queries

```bash
# Connect to desktop app database
sqlite3 ~/.contour/contour.db

# View local deals
sqlite> SELECT COUNT(*) FROM deals;

# View pending operations
sqlite> SELECT * FROM sync_queue WHERE status = 'pending';

# View synced operations
sqlite> SELECT COUNT(*) FROM sync_queue WHERE status = 'synced';
```

## Debugging

### Enable Detailed Logs

Edit `apps/desktop/src/main.ts` and uncomment:

```typescript
initializeSync({
  onSyncProgress: (msg) => console.log("[v0] SYNC:", msg),
  onSyncError: (err) => console.error("[v0] ERROR:", err.message),
  onOfflineStatusChange: (offline) => console.log("[v0] OFFLINE:", offline),
})
```

### Check Browser Console

Desktop app console (DevTools):
```
Ctrl+Shift+I (Windows/Linux)
Cmd+Option+I (Mac)
```

### Common Issues

**Issue: Device not registering**
```
Error: Failed to register device
```
Solution:
- Check CONTOUR_API_URL environment variable
- Ensure web app is running
- Check network connectivity

**Issue: Can't connect to SQLite**
```
Error: SQLITE_CANTOPEN
```
Solution:
- Ensure ~/.contour/ directory exists
- Check file permissions
- Delete corrupted db and restart

**Issue: Sync stuck pending**
```
SELECT COUNT(*) FROM sync_queue WHERE status = 'pending';
-- Returns > 0 after 1 minute
```
Solution:
- Check API endpoints are responding
- Verify device registered in web app DB
- Check consecutive_failures (if > 5, sync disabled)

**Issue: Data not syncing from web**
```
-- Web creates deal, but doesn't appear on desktop
```
Solution:
- Check timestamp: deal.updated_at > last_sync_at
- Run manual pull: POST /api/sync/pull
- Check web app is connected to correct database

## Next Steps

1. **Read Full Documentation:**
   - `SYNC_ARCHITECTURE.md` - Complete technical reference
   - `ARCHITECTURE_COMPARISON.md` - Pros/cons of this approach
   - `IMPLEMENTATION_SUMMARY.md` - What was built

2. **Run Integration Tests:**
   ```bash
   cd packages/db
   pnpm test device-sync.test.ts
   ```

3. **Add UI Enhancements:**
   - Manual sync button
   - Offline indicator
   - Conflict resolution UI
   - Device management screen

4. **Deploy to Production:**
   - Set real CONTOUR_API_URL
   - Configure CONTOUR_USER_ID from auth
   - Build desktop app: `pnpm build`
   - Deploy web app to Vercel

5. **Monitor in Production:**
   - Dashboard for sync statistics
   - Alert on repeated failures
   - Track offline usage patterns

## Useful Shortcuts

```bash
# Full database reset (loses offline data!)
rm -rf ~/.contour/contour.db

# Reset sync state only
sqlite3 ~/.contour/contour.db "DELETE FROM sync_queue; DELETE FROM sync_operations;"

# View all tables
sqlite3 ~/.contour/contour.db ".tables"

# Export database schema
sqlite3 ~/.contour/contour.db ".schema" > schema.sql

# Backup database
cp ~/.contour/contour.db ./contour-backup.db
```

## Questions?

Refer to:
- SYNC_ARCHITECTURE.md - Architecture details
- device-sync.test.ts - Integration test examples
- sync-manager.ts - Implementation reference
- ARCHITECTURE_COMPARISON.md - Design decisions

Happy syncing!
