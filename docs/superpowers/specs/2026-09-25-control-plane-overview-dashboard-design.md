# Control Plane Overview Dashboard Design

## Goal

Replace the placeholder control-plane overview with a real platform-operations dashboard showing agency, user, property, inquiry, subscription, revenue, and team-performance metrics over selectable time ranges.

## User outcome

An authorized Contour operator can open `/admin` and immediately understand platform scale, cash performance, subscription mix, operational throughput, and team activity. Every number is derived from persisted database records, clearly labelled when it represents recurring revenue versus collected cash, and updates when the operator changes the reporting range.

## Scope

### Included

- Date ranges: Today, 7 days, 30 days, 90 days, and Custom.
- KPI cards for agencies, users, properties, completed transactions, inquiries, active subscriptions, MRR, ARR, and collected revenue.
- Subscription tier distribution and revenue contribution.
- Time-series charts for collected revenue, new agencies/users, closed properties, and inquiries.
- Team performance table with inquiries, closed transactions, and revenue contribution.
- Empty, loading, error, and zero-revenue states.
- Server-side authorization and validated query parameters.

### Excluded

- Editing subscriptions or tiers; those remain in Subscriptions.
- Payment gateway credential management; credentials remain deployment-managed.
- Forecasting or predictive analytics.
- New database tables unless an existing persisted event source cannot support a required metric.

## Metric definitions

- **Agencies:** organizations visible to the platform control-plane actor; total is current count, new is created within the selected range.
- **Users:** distinct organization members; total is current active membership count, new is membership creation within the selected range.
- **Properties:** current property count; new is created within the selected range.
- **Closed properties:** completed sales and rental transactions within the selected range, using successful transaction records rather than UI state.
- **Inquiries:** inquiries created within the selected range.
- **Active subscriptions:** organizations with an active paid subscription state.
- **MRR:** sum of monthly equivalent catalog pricing for active paid organizations; annual plans are divided by twelve.
- **ARR:** MRR multiplied by twelve.
- **Collected revenue:** successful payment records within the selected range, grouped by currency and displayed without silently converting currencies.
- **Tier metrics:** subscriber count, trial count, past-due count, MRR contribution, and collected revenue grouped by subscription tier.
- **Team performance:** organization members with operational activity in the selected range, ranked by completed transactions and then revenue contribution.

## API contract

`GET /api/admin/overview?range=today|7d|30d|90d|custom&from=YYYY-MM-DD&to=YYYY-MM-DD`

The route must use the existing platform-admin authorization boundary, reject invalid ranges and malformed custom dates with HTTP 400, cap custom ranges to 366 days, and return a stable typed envelope:

```ts
type AdminOverviewResponse = {
  range: { key: string; from: string; to: string; timezone: string };
  kpis: {
    agencies: { total: number; newInRange: number };
    users: { total: number; newInRange: number };
    properties: { total: number; newInRange: number };
    closedProperties: { total: number; valueByCurrency: Record<string, number> };
    inquiries: { total: number; newInRange: number };
    subscriptions: { active: number; trialing: number; pastDue: number; cancelled: number };
    recurringRevenue: { mrrByCurrency: Record<string, number>; arrByCurrency: Record<string, number> };
    collectedRevenue: { totalByCurrency: Record<string, number> };
  };
  subscriptionMix: Array<{ tier: string; subscribers: number; trialing: number; pastDue: number; mrrByCurrency: Record<string, number>; collectedByCurrency: Record<string, number> }>;
  series: { revenue: Array<{ date: string; valuesByCurrency: Record<string, number> }>; agencies: Array<{ date: string; value: number }>; users: Array<{ date: string; value: number }>; propertiesClosed: Array<{ date: string; value: number }>; inquiries: Array<{ date: string; value: number }> };
  team: Array<{ memberId: string; name: string; email: string; inquiries: number; closedProperties: number; valueByCurrency: Record<string, number> }>;
};
```

## UI design

The overview becomes a dense but readable operator dashboard:

1. Header with “Control Plane Overview”, last-updated state, and range selector.
2. KPI grid with primary values, supporting period values, and short definitions.
3. Revenue and activity charts in a two-column desktop layout, stacked on mobile.
4. Subscription mix cards/table with tier counts and recurring revenue.
5. Team performance board with sortable-looking ranked rows and explicit currency columns.
6. Existing safety boundary moved below the data dashboard as a compact governance panel.

Charts should use existing dependencies or lightweight SVG/CSS rendering; no new chart package is required unless the repository already includes one. All charts need text summaries or table equivalents so the dashboard remains useful without visual rendering.

## Data and security

- Derive the actor through the existing control-plane authorization helper.
- Execute aggregates server-side with bounded date ranges and selected fields.
- Never return payment gateway secrets, full payment tokens, or unrelated tenant PII.
- Preserve currency boundaries; show separate ZMW/USD totals rather than inventing an exchange rate.
- Use UTC/database dates consistently and label the displayed timezone.

## Verification

- Unit tests for date-range parsing, MRR/ARR calculation, currency grouping, tier grouping, and zero-data output.
- Route tests for unauthorized access, invalid dates, valid range selection, and stable response shape.
- Typecheck, focused tests, full test suite, and production build.
- Browser verification for desktop and mobile dashboard layout, range changes, loading/error/empty states, and chart/table readability.
