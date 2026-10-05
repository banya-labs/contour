# Agency closing requirements

Agency Settings presents Closing Requirements as its fourth tab, after Subscription & Billing and before Public API & Website Integration. The old `/dashboard/settings/closing-requirements` URL redirects to `/dashboard/settings?tab=closing`. The repeated settings banner and separate sidebar shortcut are removed.

The tab groups active requirements by category and explains required versus optional checks, responsibility, and supporting evidence. Add/Edit forms share labelled fields, automatic references for new items, optional reference/order controls, client validation using the existing template validator, pending states and save feedback. Existing organization permissions, management-only mutations and API validation remain authoritative. Archiving continues to preserve existing workflow snapshots and the server's final-required-item safeguard.

Requirements are copied when a deal enters Verification & Closing. Changes here apply to future workflows only. Evidence supports a management decision and does not make an upload compulsory.

Verification: TypeScript and scoped new-source lint pass, the design detector reports no findings, and nine existing closing-workflow tests pass. A browser preview with fixture authentication/API data verified tab order, banner removal on the branding tab, adding an optional agent-owned requirement, and editing an existing required requirement. No production agency configuration was modified during these checks. No migration or dependency changes are needed.
