# ARM-X Hackaton

This repository is a temporary Salesforce metadata snapshot for the **ARM-X Hackaton**.

**It will be deleted after November 15, 2026.** Do not treat it as a long-lived project or as a source of record after that date.

## What was retrieved

Metadata was pulled from the Salesforce scratch org alias `Hackaton3` (org name: Hackathon QA). The retrieve used a manifest built from the org itself, including managed and unlocked package metadata, so the project contains every component the Metadata API could return — not only the default code package (`ApexClass`, `ApexTrigger`, `ApexPage`, Aura, LWC, and static resources).

That default code package is empty in this org (no Apex, Visualforce, Aura, LWC, or static resources). What exists locally is the rest of the org: objects, fields, layouts, profiles, permission sets, settings, sharing rules, flows, reports, roles, and related configuration. Custom objects include `CH3_Request__c`, `CH3_Line__c`, `Demo_Invoice__c`, `Demo_Order__c`, and `Demo_Return__c`.

Source files are in `force-app/main/default/`. The full component list is `manifest/package-full.xml` (59 metadata types). `manifest/package.xml` is the original code-only manifest.

## Tooling API

`tooling/records/` is a JSON export from the Tooling API, alongside the Metadata API source. Of 520 queryable Tooling objects, 207 have rows and were saved (about 71,000 records). `tooling/inventory.json` lists every Tooling object, including the ones with no rows and the ones the org would not query.

Larger Tooling sets:

- `EntityDefinition` — 2,576 objects
- `FieldDefinition` — 40,320 fields, queried per entity because the API requires an `EntityDefinitionId` filter
- `ProfileLayout` — 10,183
- `PermissionSetTabSetting` — 8,850 distinct rows (the org reports a higher count; further rows are not returned)
- `DataType` — 4,780
- `PermissionDependency` — 2,000
- `ConnectedApplication` — the CPQ Integration User connected app, which the Metadata API refused

User records, permission-set assignments, recently viewed items, deploy logs, and Apex test results were left out. Schema objects that require a filter on every row (`EntityParticle`, `CompactLayoutInfo`, and similar) were not bulk-exported. The Tooling API counts `Metric` record types but does not return them. A contact email on the external client app was replaced with `[REDACTED]`.

## Components the org would not return

The retrieve succeeded with warnings for components the org lists but will not retrieve:

- 183 standard list views (`ListView`)
- Record types `Metric.Completion` and `Metric.Progress`
- Connected app `CPQIntegrationUserApp`
- `UiViewDefinition` `Demo_Service_Account_Page` (type not available in this org)
- `WorkflowFlowAutomation` `sfdc_default_ReportExport_Protection_Flow`
- Two sharing-rule filters (`ConversationEntryCopy`, `ConvEntryRelatedRecordCopy`)

There are no custom labels in the org.
