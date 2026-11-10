# ARM-X Hackaton

This repository is a temporary Salesforce metadata snapshot for the **ARM-X Hackaton**.

**It will be deleted after November 15, 2026.** Do not treat it as a long-lived project or as a source of record after that date.

## What was retrieved

Metadata was pulled from the Salesforce scratch org alias `Hackaton3` (org name: Hackathon QA). The retrieve used a manifest built from the org itself, including managed and unlocked package metadata, so the project contains every component the Metadata API could return — not only the default code package (`ApexClass`, `ApexTrigger`, `ApexPage`, Aura, LWC, and static resources).

That default code package is empty in this org (no Apex, Visualforce, Aura, LWC, or static resources). What exists locally is the rest of the org: objects, fields, layouts, profiles, permission sets, settings, sharing rules, flows, reports, roles, and related configuration. Custom objects include `CH3_Request__c`, `CH3_Line__c`, `Demo_Invoice__c`, `Demo_Order__c`, and `Demo_Return__c`.

Source files are in `force-app/main/default/`. The full component list is `manifest/package-full.xml` (59 metadata types). `manifest/package.xml` is the original code-only manifest.

## Components the org would not return

The retrieve succeeded with warnings for components the org lists but will not retrieve:

- 183 standard list views (`ListView`)
- Record types `Metric.Completion` and `Metric.Progress`
- Connected app `CPQIntegrationUserApp`
- `UiViewDefinition` `Demo_Service_Account_Page` (type not available in this org)
- `WorkflowFlowAutomation` `sfdc_default_ReportExport_Protection_Flow`
- Two sharing-rule filters (`ConversationEntryCopy`, `ConvEntryRelatedRecordCopy`)

There are no custom labels in the org.
