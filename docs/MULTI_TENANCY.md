# Multi-Tenancy Implementation

**Type:** Shared Database, Shared Schema (Tier 3 Logical Multi-Tenancy)  
**Status:** Completed & Tested (42/42 tests passed)

---

## What Was Implemented

Multiple agricultural companies (organizations) can now use the same deployed instance of the system with full data isolation. Company A's farmers, batches, and supply chain records are completely invisible to Company B's users.

### How Isolation Works

Every database row in key tables carries an `organizationId` column. All API queries automatically filter by the requesting user's org. A platform-level ADMIN (no org assigned) is the only role that can see across all organizations.

```
User (organizationId: null)  ← Platform Admin — sees everything
User (organizationId: "abc") ← Org-scoped user — sees only own org's data
```

---

## Files Changed

| File | Type of Change |
|---|---|
| `application/prisma/schema.prisma` | Added `Organization` model + `organizationId` FK to 7 models |
| `application/prisma/seed.js` | Create default org, assign existing users, backfill existing rows |
| `application/server.js` | Auth middleware, all API endpoints, new platform/org routes |
| `chaincode/agricultural-contract/lib/agricultural-contract.js` | Tag on-chain batch records with `organizationId` |

---

## Phase 1 — Database Schema

### New Model: `Organization`

```prisma
model Organization {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique   // used as org code on registration (e.g. "alpha-farms")
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users   User[]
  batches Batch[]

  @@map("organizations")
}
```

### `organizationId` Added To

| Model | Type | Notes |
|---|---|---|
| `User` | `String?` (nullable FK) | `null` = platform-level admin |
| `Batch` | `String?` (nullable FK) | Populated on every batch create |
| `ProcessingRecord` | `String?` (bare column) | No FK — consistent with hybrid storage pattern |
| `TransportRoute` | `String?` (bare column) | Same |
| `QualityTest` | `String?` (bare column) | Same |
| `BatchTransfer` | `String?` (bare column) | Same |
| `DistributionRecord` | `String?` (bare column) | Same |

### Migration

```
prisma/migrations/20261115153105_add_multi_tenancy/
```

### Seed Updates

- Creates `Default Organization` (slug: `default-org`)
- Assigns all existing demo users (farmer, processor, distributor, retailer) to default org
- Platform admin (`admin@agricultural.com`) intentionally left with `organizationId = null`
- Backfills all existing `Batch`, `ProcessingRecord`, `TransportRoute`, `QualityTest`, `BatchTransfer`, `DistributionRecord` rows with default org ID

---

## Phase 2 — Auth Middleware

**File:** `application/server.js`

### `authenticate` middleware (line ~374)

Added `organization: true` to the session include. After session lookup:

```js
req.organizationId  = session.user.organizationId ?? null;
req.isPlatformAdmin = session.user.role === "ADMIN" && session.user.organizationId === null;
```

Every route handler now has access to these two values without a separate DB query.

### `authorize` middleware (line ~569)

Added optional `{ requireOrg: true }` option to block platform admins from calling org-scoped endpoints:

```js
const authorize = (allowedRoles, options = {}) => { ... }
```

### JWT payload (login endpoint)

Added `organizationId` to the signed token:

```js
jwt.sign({ userId, email, role, organizationId: user.organizationId ?? null }, ...)
```

---

## Phase 3 — API Filtering

The core pattern applied to every listing endpoint:

```js
// Non-platform admins are automatically scoped to their org
const where = req.isPlatformAdmin ? {} : { organizationId: req.organizationId };
```

### Read Endpoints Fixed (org filter added to `where`)

| Endpoint | Role |
|---|---|
| `GET /api/farmer/my-batches` | FARMER |
| `GET /api/batches` | ADMIN / REGULATOR |
| `GET /api/admin/users` | ADMIN |
| `GET /api/processor/available-batches` | PROCESSOR |
| `GET /api/distributor/my-batches` | DISTRIBUTOR |
| `GET /api/retailer/available-batches` | RETAILER |
| `GET /api/retailer/my-batches` | RETAILER |
| `GET /api/retailer/sold-batches` | RETAILER |
| `GET /api/ml/flagged-batches` | ADMIN / REGULATOR |
| Dashboard counts (`GET /api/dashboard`) | ADMIN |

### Cross-Org Guard Added

`GET /api/admin/users/:userId` — after fetching user, verifies they belong to the same org:

```js
if (!req.isPlatformAdmin && user.organizationId !== req.organizationId) {
  return res.status(403).json({ error: "User belongs to a different organization." });
}
```

### Write Endpoints Fixed (`organizationId` injected on create)

| Operation | Model |
|---|---|
| `POST /api/batch/create` | `Batch` |
| Batch split | `Batch` (child inherits from parent) |
| `POST /api/processor/process/:batchId` | `ProcessingRecord` |
| Processor → processing facility route | `TransportRoute` |
| `POST /api/batch/transfer` (ownership) | `BatchTransfer` |
| Processor → distributor transfer | `BatchTransfer` |
| Distributor → retailer transfer | `BatchTransfer` |
| `POST /api/quality-test/:batchId` | `QualityTest` |
| `POST /api/transport/add` | `TransportRoute` (all 4 occurrences) |
| `POST /api/distributor/add-distribution/:batchId` | `DistributionRecord` |

---

## Phase 4 — Registration Flow

### `POST /api/auth/register` — updated

New field: `organizationSlug` (required for all non-platform-admin roles).

```js
// Request body
{
  "email": "farmer@alpha.com",
  "username": "alpha_farmer",
  "password": "...",
  "role": "FARMER",
  "organizationSlug": "alpha-farms"   // ← new required field
}
```

Logic:
- If `role === "ADMIN"` and no slug provided → registers as platform admin (`organizationId = null`)
- All other roles must provide a valid, active `organizationSlug` or receive `400`

### New Endpoints

#### `POST /api/platform/organizations` *(platform admin only)*

Creates a new organization and its first org-level admin in one call.

```json
// Request
{
  "name": "Alpha Farms",
  "slug": "alpha-farms",
  "description": "...",
  "adminEmail": "admin@alpha.com",
  "adminUsername": "alpha_admin",
  "adminPassword": "..."
}
```

#### `GET /api/platform/organizations` *(platform admin only)*

Lists all organizations with user and batch counts.

#### `PATCH /api/platform/organizations/:orgId` *(platform admin only)*

Toggles `isActive` on an organization (deactivating blocks new registrations with that slug).

#### `GET /api/org/info` *(any authenticated org-scoped user)*

Returns the current user's organization details including user and batch counts. Platform admins receive `400` (no org context).

---

## Phase 5 — Blockchain Chaincode

**File:** `chaincode/agricultural-contract/lib/agricultural-contract.js`

> **Deployment note:** Chaincode changes require a version bump and redeploy to the Fabric network. After redeploy, run `initLedger` to reset sample data.

### `createBatch`

`organizationId` is now stored on every batch record on the ledger:

```js
const batch = {
    // ... existing fields ...
    organizationId: extraData.organizationId || null   // ← added
};
```

`server.js` passes `organizationId: req.organizationId` inside `blockchainData` when calling `createBatch`.

### `getAvailableBatchesForDistributor`

Signature changed from `(ctx)` to `(ctx, organizationId = '')`.  
Empty string = no filter (backward compatible). Otherwise filters by org:

```js
const orgMatch = !organizationId || record.organizationId === organizationId;
if (record.status === 'PROCESSED' && ... && orgMatch) { ... }
```

`server.js` passes `req.organizationId || ""` when calling this function.

### `getBatchesByDistributor`

Same pattern — signature changed to `(ctx, distributorId, organizationId = '')`.

### `initLedger`

Sample batch seed data now includes `organizationId: null`.

---

## Admin Roles Explained

| User type | `role` | `organizationId` | Can see |
|---|---|---|---|
| Platform Admin | `ADMIN` | `null` | All orgs |
| Org Admin | `ADMIN` | `"org-id"` | Own org only |
| Farmer / Processor / etc. | (their role) | `"org-id"` | Own org only |

The distinction is purely the `organizationId` null-check — no extra boolean column needed.

---

## Test Results

Automated test suite: `application/test-multitenancy.js`

```
42/42 passed | 0 failed
```

| Test Category | Result |
|---|---|
| Platform org creation & listing | ✅ |
| Registration with/without slug | ✅ |
| User login + JWT `organizationId` payload | ✅ |
| `/api/org/info` returns correct org per user | ✅ |
| Non-admin cannot access platform endpoints (403) | ✅ |
| Farmer batch isolation (org A ≠ org B) | ✅ |
| Admin user list isolation (org A ≠ org B) | ✅ |
| Cross-org user detail blocked (403) | ✅ |
| Platform admin sees all orgs' data | ✅ |
| Processor available-batches scoped to own org | ✅ |
| Dashboard counts scoped to own org | ✅ |

---

## Architecture Note

This implementation uses **Tier 3 — Shared Database, Shared Schema** multi-tenancy (also called logical multi-tenancy). Isolation is enforced at the application layer via Prisma `where` clauses. All organizations share the same PostgreSQL tables and Hyperledger Fabric channel.

**Trade-offs:**

| | Tier 3 (this implementation) | Tier 1 (separate DBs) |
|---|---|---|
| Isolation | Logical (app-enforced) | Physical (DB-enforced) |
| Setup complexity | Low | High |
| Performance isolation | Shared | Dedicated |
| Risk of data leak | One missed `where` clause | Structural |
| Suitable for FYP | ✅ Yes | ❌ Overkill |

For stronger isolation in a production system, PostgreSQL Row-Level Security (RLS) could be added as a second enforcement layer without changing the application schema.
