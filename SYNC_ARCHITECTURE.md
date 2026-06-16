# Sync Architecture: Web + Desktop Integration

## Overview

This document describes the complete sync architecture enabling the Contour CRM to work seamlessly across web and desktop apps, with offline-first capabilities for the desktop client.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Web Application                             │
│                  (Next.js 16 App Router)                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
                    API Endpoints: /api/sync/
                    • POST /api/sync/register
                    • POST /api/sync/pull
                    • POST /api/sync/push
                              ↓ ↑
        ┌─────────────────────────────────────────┐
        │   PostgreSQL Database (Neon)            │
        │  ┌───────────────────────────────────┐  │
        │  │ sync_devices                      │  │
        │  │ sync_state                        │  │
        │  │ sync_operations                   │  │
        │  │ deals, clients, listings, etc     │  │
        │  └───────────────────────────────────┘  │
        └─────────────────────────────────────────┘
                              ↓ ↑
                        HTTP/HTTPS
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                  Desktop Application (Electron)                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Sync Manager                               │   │
│  │  • Device registration                                  │   │
│  │  • Pull remote changes                                  │   │
│  │  • Push local changes                                   │   │
│  │  • Conflict resolution (LWW)                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓ ↑                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              SQLite Database (Local)                     │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │ deals                                            │    │   │
│  │  │ clients                                          │    │   │
│  │  │ listings                                         │    │   │
│  │  │ sync_queue (pending operations)                  │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Database Layer (`packages/db`)

#### New Models

**SyncDevice**
- Represents a registered device (web, desktop, mobile)
- Tracks device type, app version, and last seen time
- One user can have multiple devices

**SyncState**
- Tracks sync progress per device
- Stores last sync token, time, and error information
- Used for resumable sync and retry logic

**SyncOperation**
- Queues local changes made on desktop when offline
- Tracks operation status: pending → synced/failed
- Stores entity type, ID, operation type (create/update/delete), and payload

```typescript
// New database functions in packages/db/src/device-sync.ts
registerDevice(prisma, input) // Register or update device
getSyncState(prisma, deviceId) // Get device sync metadata
updateSyncState(prisma, deviceId, data) // Update after sync
getPendingSyncOperations(prisma, deviceId) // Get queued changes
createSyncOperation(prisma, input) // Queue local change
markSyncOperationAsSynced(prisma, id) // Mark synced
markSyncOperationAsFailed(prisma, id, error) // Mark failed
```

### 2. Web API Endpoints (`apps/web/app/api/sync/`)

#### POST /api/sync/register
**Purpose:** Register a device and initialize sync state

**Request:**
```json
{
  "userId": "uuid",
  "deviceId": "unique-device-id",
  "deviceType": "desktop|web|mobile",
  "appVersion": "1.0.0"
}
```

**Response:**
```json
{
  "success": true,
  "device": {
    "id": "sync-device-uuid",
    "deviceId": "unique-device-id",
    "userId": "uuid",
    "deviceType": "desktop",
    "appVersion": "1.0.0",
    "createdAt": "2026-06-16T..."
  }
}
```

#### POST /api/sync/pull
**Purpose:** Download all remote data changes since last sync

**Request:**
```json
{
  "deviceId": "unique-device-id",
  "lastSyncToken": "token-from-previous-sync",
  "since": 1718530000000
}
```

**Response:**
```json
{
  "syncToken": "new-token-xyz",
  "data": {
    "deals": [...],
    "clients": [...],
    "listings": [...]
  },
  "hasMore": false
}
```

**What it does:**
- Returns all data updated since last sync
- Creates a new sync token for resumable sync
- Supports pagination if data is large
- Updates sync state on the server

#### POST /api/sync/push
**Purpose:** Upload local changes queued during offline mode

**Request:**
```json
{
  "deviceId": "unique-device-id",
  "operations": [
    {
      "id": "operation-uuid",
      "entityType": "deal",
      "entityId": "deal-uuid",
      "operationType": "update",
      "payload": { "title": "Updated Title", "stage": "offer_made" }
    }
  ]
}
```

**Response:**
```json
{
  "synced": 5,
  "failed": 1,
  "results": [
    { "operationId": "op-uuid", "success": true },
    { "operationId": "op-uuid", "success": false, "error": "Validation failed" }
  ]
}
```

**What it does:**
- Applies local changes to remote database
- Handles conflicts with Last-Write-Wins (LWW) strategy
- Returns detailed results per operation
- Stores failures for manual review

### 3. Desktop Application (`apps/desktop`)

#### Database Module (`src/database.ts`)
- SQLite database stored in `~/.contour/contour.db`
- Tables: deals, clients, listings, sync_queue
- Provides CRUD operations for all entities
- Manages sync queue for pending operations

#### Sync Manager (`src/sync-manager.ts`)
- Initializes device registration on app startup
- Runs background sync every 30 seconds when online
- Implements pull-then-push pattern:
  1. Pull latest remote data
  2. Push local queued changes
  3. Update sync state
- Detects online/offline status
- Emits sync events to renderer process

#### Main Process (`src/main.ts`)
- Initializes database and sync on app startup
- Sets up IPC handlers for renderer communication
- Emits sync status events:
  - `sync:start` - Sync begins
  - `sync:progress` - Progress message
  - `sync:complete` - Sync finished successfully
  - `sync:error` - Sync error occurred
  - `sync:offline` - Offline status changed

### 4. Sync Status Indicator (`apps/web/components/sync-status-indicator.tsx`)
- Displays current sync status in the UI
- Shows icons: syncing, success, error, offline
- Listens for Electron sync events via IPC
- Only renders in desktop app context

## Sync Flow

### Online Scenario: Desktop App Pulls & Pushes

```
1. App starts → registerDevice()
   └─ Device ID registered in sync_devices table
   └─ SyncState created with empty state

2. Every 30 seconds (if online):
   
   a) PULL PHASE
      └─ Fetch /api/sync/pull with lastSyncToken
      └─ Receive deals, clients, listings changed since lastSync
      └─ Save to local SQLite
      └─ Update lastSyncAt, syncToken
   
   b) PUSH PHASE
      └─ Query sync_queue for pending operations
      └─ Fetch /api/sync/push with operations
      └─ Server applies each operation (create/update/delete)
      └─ Receives results (success/failed)
      └─ Mark operations as synced or failed
   
   c) COMPLETE
      └─ Emit sync:complete event
      └─ UI shows success indicator
```

### Offline Scenario: Local Changes Queued

```
1. User makes change (edit deal, add client, etc.)
   └─ App detects offline status
   └─ Operation queued to sync_queue table
   └─ UI shows "Offline mode" indicator
   └─ Change visible locally (optimistic UI)

2. User goes online
   └─ Network listener detects online status
   └─ Immediately trigger sync
   └─ Pull → Push flow executes
   └─ Queued changes sent to server
   └─ UI updates to reflect synced status
```

### Conflict Resolution: Last-Write-Wins (LWW)

When conflicts occur (e.g., same deal edited on web and desktop offline):

```
Desktop offline edit:
  deal.title = "Desktop Updated" (updatedAt: 1718530000000)
  
Pushed to server which already had:
  deal.title = "Web Updated" (updatedAt: 1718530100000)
  
Resolution: LWW compares updatedAt timestamps
  → Web version wins (newer timestamp)
  → Desktop's change fails with conflict error
  → User sees error and can retry/merge

Better approach: Operational transformation or CRDTs for complex cases
```

## Local Testing

### Prerequisites

```bash
# Install dependencies
pnpm install

# Create .env.local with:
CONTOUR_API_URL=http://localhost:3000
CONTOUR_USER_ID=test-user
```

### Test Sync Locally

```bash
# Terminal 1: Start web dev server
cd apps/web
pnpm dev

# Terminal 2: Start desktop app
cd apps/desktop
pnpm dev

# Terminal 3: Run integration tests
cd packages/db
pnpm test device-sync.test.ts
```

### Manual Testing Checklist

1. **Device Registration**
   - [ ] Desktop app starts and registers device
   - [ ] Device visible in sync_devices table
   - [ ] Device ID unique per installation

2. **Offline Mode**
   - [ ] Disconnect network
   - [ ] Edit a deal on desktop
   - [ ] Change queued in sync_queue
   - [ ] UI shows "Offline mode" badge

3. **Pull on Reconnect**
   - [ ] Reconnect network
   - [ ] App syncs automatically
   - [ ] Remote changes pulled to local DB
   - [ ] Local changes pushed to server

4. **Conflict Handling**
   - [ ] Edit same deal on web and desktop (offline)
   - [ ] Bring desktop online
   - [ ] Observe conflict result
   - [ ] Web version should win (LWW)

5. **Multi-Device Sync**
   - [ ] Register 2 desktop devices same user
   - [ ] Edit on device 1
   - [ ] Device 2 should pull change
   - [ ] Both devices see latest data

## Performance Considerations

### Database Indexes
- `sync_devices_user_id_idx` - Fast device lookup by user
- `sync_operations_device_status_idx` - Fast pending op lookup
- `sync_operations_status_created_idx` - Filter by status for cleanup

### SQLite Optimizations
- Foreign keys enabled for referential integrity
- Indexes created for common queries
- Batch inserts for large data pulls
- Regular cleanup of old synced operations

### Sync Efficiency
- Pull only updates since lastSyncAt (not full table scan)
- Push operations in batches
- Resumable sync with tokens (partial retry support)
- Debounce local changes to reduce queue size

## Security

### Current Implementation
- Device registration requires userId (simplified)
- No authentication on sync endpoints (assumed auth middleware handles)

### Production Recommendations
1. **Authentication**
   - Add JWT token verification to sync endpoints
   - Validate deviceId ownership by user

2. **Authorization**
   - Only sync data user has access to
   - Filter based on user role and permissions

3. **Encryption**
   - Encrypt sync_queue payloads for sensitive data
   - TLS/HTTPS for all syncs

4. **Rate Limiting**
   - Limit sync frequency per device (already 30s interval)
   - Quota sync data size

## Future Improvements

### Short Term
1. **Better Conflict Resolution**
   - Implement 3-way merge for specific entities
   - Show user conflicts in UI for manual resolution

2. **Selective Sync**
   - Allow users to choose what data to sync offline
   - Reduce SQLite database size

3. **Incremental Backup**
   - Backup sync_queue to cloud for disaster recovery
   - Resume from backup if device corrupted

### Medium Term
1. **Operational Transformation (OT)**
   - Support collaborative editing
   - Resolve conflicts automatically

2. **Real-Time Sync**
   - WebSocket for instant push notifications
   - Reduces sync latency

3. **Mobile Support**
   - Extend sync to mobile app
   - Optimize for low bandwidth

### Long Term
1. **CRDT-Based Sync**
   - Conflict-free data types
   - True peer-to-peer sync capability

2. **Mesh Network**
   - Device-to-device sync without server
   - True offline-first architecture

## Debugging

### Enable Sync Logs
```typescript
// In desktop app main.ts
initializeSync({
  onSyncProgress: (msg) => console.log("[v0] Sync:", msg),
  onSyncError: (err) => console.error("[v0] Sync Error:", err),
})
```

### Check Sync Queue
```sql
-- View pending operations
SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY created_at DESC;

-- View last sync time per device
SELECT device_id, last_sync_at, consecutive_failures 
FROM sync_state ORDER BY last_sync_at DESC;

-- View sync operations
SELECT * FROM sync_operations WHERE device_id = '...' ORDER BY created_at DESC;
```

### Monitor API Endpoints
```bash
# Test pull endpoint
curl -X POST http://localhost:3000/api/sync/pull \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test-device-id"}'

# Test push endpoint
curl -X POST http://localhost:3000/api/sync/push \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId":"test-device-id",
    "operations":[{
      "id":"op-1",
      "entityType":"deal",
      "entityId":"deal-id",
      "operationType":"update",
      "payload":{"title":"New Title"}
    }]
  }'
```

## References

- [Prisma Documentation](https://www.prisma.io)
- [Better SQLite3](https://github.com/WiseLibs/better-sqlite3)
- [Electron IPC](https://www.electronjs.org/docs/tutorial/ipc)
- [Sync Strategies](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/)
