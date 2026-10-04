# Property assignment before deal progression

`POST /api/clients/{id}/transition` requires a linked property for active targets other than `NEW_INQUIRY`, and for `CLOSED` with `WON`. `LOST` and `CANCELLED` remain available without a property and retain their reason requirements. Management overrides do not bypass assignment. A missing property returns HTTP 409 with `code: "PROPERTY_REQUIRED"` and `missingRequirements: ["linked property"]`.

`GET /api/agent/matching/inquiries/{id}/available-properties?page=1&pageSize=20` requires `pwa.inquiries.read`. It uses the matching service's tenant and inquiry visibility rules. The paginated matching envelope includes every `AVAILABLE` property, sorted by descending match percentage and property ID for ties. Required-criteria failures remain visible and cannot be attached. No inventory returns a successful empty results array and total zero; a failed request must display an error rather than an empty state.

`POST /api/agent/matching/attach` persists the selected property using the existing availability, required-criteria, ownership and concurrent-change checks. The client resumes the requested transition only after successful attachment. If progression then fails, the attachment remains persisted and the transition error is displayed. Cancel before attachment leaves the inquiry unchanged. Offline clients must reconnect before attachment or progression.

Desktop Kanban, dashboard mobile status controls and agent PWA status controls share this requirement and picker. PWA status controls also allow Lost/Cancelled with a recorded reason. No schema change is needed.
