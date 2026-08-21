# CRM Properties and Plots Database

Source: https://app.notion.com/p/9edcef0fd3fa4ad09eee6fc10975d0a7

Data source: `collection://e6b9f510-937c-4f43-b9a7-2a97e4cdf2a0`

## Purpose

This Notion database models the initial inventory dashboard for properties and plots. It is useful as a product prototype and seed reference, but the production app should map it to the normalized Postgres `listings` and `listing_utilities` tables.

## Fields

| Notion Property | Type | Production Mapping |
|---|---|---|
| Listing / Plot ID | title | `listings.listing_code` |
| Type | select: Property, Vacant land | `listings.type` |
| Availability Status | status: Available, Reserved, Under Maintenance, Rented, Sold | `listings.availability_status` |
| Asking Price | number, rand format | `listings.asking_price_amount` |
| Currency | select: ZMW, USD | `listings.asking_price_currency` |
| Location / Area | select: Lusaka, Kitwe, Ndola, Livingstone, Other | `listings.location_area` |
| Land Size (ha) | number | `listings.land_size_ha` |
| Zoning | select: Residential, Commercial, Agricultural, Mixed, Other | `listings.zoning` |
| Land Designation | select: State Land, Traditional / Customary Land | `listings.land_designation` |
| Address | text | `listings.address` |
| Bathrooms | number | `listings.bathrooms` |
| Bedrooms | number | `listings.bedrooms` |
| Utilities | multi-select: Water, Electricity, Sewer, Internet | `listing_utilities.utility` |
| Internal Notes | text | `listings.internal_notes` |
| Created | created_time | `listings.created_at` |
| Last Updated | last_edited_time | `listings.updated_at` |

## Notion Views

### All Listings

- Type: table.
- Sort: `Last Updated` descending.
- Displays the full operational inventory fields.

### Pipeline by Status

- Type: board.
- Grouped by `Availability Status`.
- Displays listing ID, type, asking price, currency, location, and land size.

### Inventory Dashboard

- Type: dashboard.
- Widget 1: donut chart count by `Availability Status`.
- Widget 2: total portfolio value as sum of `Asking Price`.

## Production Notes

- Currency formatting in Notion uses `rand`, but production values must support ZMW and USD explicitly.
- `Location / Area` should not be locked to four cities in production. Use a text field or separate location table once data quality requires normalization.
- Utilities must be normalized, because multi-select arrays weaken reporting and filtering once the app leaves prototype mode.
- Current row data could not be exported because the Notion database query tool was unavailable and scoped search returned no visible rows.
