# SuperOps MCP Help Desk Tools Design

## Overview

This document outlines 80 task-oriented MCP tools to be added to the SuperOps MCP server. These tools wrap the existing GraphQL API to provide convenient, human-friendly operations for help desk workflows.

**Target Users:**
- Humans interacting with the MCP directly
- Claude and other AI assistants in conversational interactions

**Design Principles:**
- Task-oriented (complete workflows, not raw API calls)
- Sensible defaults
- Human-readable output
- Consistent naming conventions

---

## 1. Ticket Queue Management (8 tools)

Tools for viewing and filtering tickets.

| Tool | Purpose | API Basis |
|------|---------|-----------|
| `get_ticket` | Get full details of a specific ticket by ID | `getTicket` |
| `get_open_tickets` | List open tickets with filters (client, technician, priority, date range) | `getTicketList` with status filter |
| `get_my_tickets` | Tickets assigned to a specific technician | `getTicketList` with technician filter |
| `get_new_tickets` | Tickets created in last N hours | `getTicketList` with date filter |
| `get_urgent_tickets` | High priority or SLA-breaching tickets | `getTicketList` with priority/SLA filter |
| `get_tickets_by_client` | All tickets for a specific client | `getTicketList` with client filter |
| `get_ticket_conversation` | Get the full conversation thread of a ticket | `getTicketConversationList` |
| `get_ticket_notes` | Get internal notes on a ticket | `getTicketNoteList` |

---

## 2. Ticket Actions (11 tools)

Tools for performing actions on tickets.

| Tool | Purpose | API Basis |
|------|---------|-----------|
| `create_ticket` | Create a new ticket | `createTicket` |
| `reply_to_ticket` | Send a reply to requester (with optional email) | `createTicketConversation` with `sendMail` |
| `add_ticket_note` | Add internal/public note | `createTicketNote` with `privacyType` |
| `update_ticket_status` | Change ticket status | `updateTicket` (status field) |
| `update_ticket_priority` | Change priority | `updateTicket` (priority field) |
| `update_ticket_category` | Change category/subcategory | `updateTicket` (category/subcategory) |
| `assign_ticket` | Assign to technician or group | `updateTicket` (technician/techGroup) |
| `change_ticket_requester` | Change who the ticket is for | `updateTicket` (requester field) |
| `add_ticket_follower` | Add a technician as follower | `updateTicket` (addFollowers) |
| `close_ticket` | Close with resolution code | `updateTicket` (status + resolutionCode) |
| `delete_ticket` | Soft delete (trash) a ticket | `softDeleteTickets` |

---

## 3. Asset Management (14 tools)

Tools for managing and monitoring assets.

| Tool | Purpose | API Basis |
|------|---------|-----------|
| `get_asset` | Get full details of a specific asset | `getAsset` |
| `get_assets` | List assets with filters (client, site, OS type, status) | `getAssetList` |
| `get_asset_summary` | Quick overview (CPU, memory, disk, network) | `getAssetSummary` |
| `get_asset_software` | List installed software on an asset | `getAssetSoftwareList` |
| `get_asset_patches` | Patch status and details | `getAssetPatchDetails` |
| `get_asset_disks` | Disk/partition details | `getAssetDiskDetails` |
| `get_asset_activity` | Full activity log for an asset | `getAssetActivity` |
| `get_asset_script_history` | Script executions (filtered from activity) | `getAssetActivity` filtered by module=SCRIPT |
| `get_asset_patch_history` | Patch operations (filtered from activity) | `getAssetActivity` filtered by module=PATCH |
| `get_asset_user_log` | User login/logout history | `getAssetUserLog` |
| `get_unmonitored_assets` | Assets not being monitored | `getUnMonitoredAssetList` |
| `update_asset` | Update asset metadata | `updateAsset` |
| `assign_device_category` | Categorize assets | `assignDeviceCategory` |
| `delete_asset` | Remove an asset | `softDeleteAsset` |

### Asset Activity Details

The `getAssetActivity` API returns activity logs with the following structure:

```json
{
  "activityId": "6121126513870049280",
  "module": "SCRIPT",
  "activityType": "RUN_SCRIPT",
  "activityData": {
    "scriptId": 2059305194998857700,
    "name": "antivirus_status.ps1",
    "status": "Skipped"
  },
  "createdBy": { "userId": "123", "name": "Corey Watson" },
  "createdTime": "2026-01-19T19:00:02.968"
}
```

**Available modules:** `SCRIPT`, `PATCH`
**Activity types:** `RUN_SCRIPT`, `INSTALL_PATCH`, `SCAN_PATCH`

**Note:** Script output/stdout is NOT available via API - only execution metadata.

---

## 4. Client & Contact Management (11 tools)

Tools for managing clients and their users.

| Tool | Purpose | API Basis |
|------|---------|-----------|
| `get_client` | Get client details | `getClient` |
| `get_clients` | List all clients | `getClientList` |
| `get_client_sites` | List sites for a client | `getClientSiteList` |
| `get_client_users` | List contacts/users for a client | `getClientUserList` |
| `get_client_contracts` | List contracts for a client | `getClientContractList` |
| `create_client` | Create new client | `createClientV2` |
| `create_client_user` | Add a contact to a client | `createClientUser` |
| `create_client_site` | Add a site/location | `createClientSite` |
| `update_client` | Update client info | `updateClient` |
| `update_client_user` | Update contact info | `updateClientUser` |
| `search_contacts` | Find a contact by name/email across clients | `getClientUserList` with search |

---

## 5. Alert Management (4 tools)

Tools for managing RMM alerts.

| Tool | Purpose | API Basis |
|------|---------|-----------|
| `get_alerts` | List all active alerts | `getAlertList` |
| `get_asset_alerts` | Alerts for a specific asset | `getAlertsForAsset` |
| `resolve_alerts` | Mark alerts as resolved | `resolveAlerts` |
| `create_alert` | Create manual alert on asset | `createAlert` |

---

## 6. Time Tracking / Worklogs (4 tools)

Tools for logging and managing time entries.

| Tool | Purpose | API Basis |
|------|---------|-----------|
| `get_worklogs` | Fetch worklog entries (by ticket, technician, date) | `getWorklogEntries` |
| `add_worklog` | Log time against a ticket | `createWorklogEntries` |
| `update_worklog` | Edit a worklog entry | `updateWorklogEntry` |
| `delete_worklog` | Remove a worklog entry | `deleteWorklogEntry` |

---

## 7. Knowledge Base (6 tools)

Tools for managing KB articles and collections.

| Tool | Purpose | API Basis |
|------|---------|-----------|
| `search_kb` | Search KB articles and collections | `getKbItems` |
| `get_kb_article` | Get full article content | `getKbItem` |
| `create_kb_article` | Create a new KB article | `createKbArticle` |
| `update_kb_article` | Edit an existing article | `updateKbArticle` |
| `create_kb_collection` | Create a collection/folder | `createKbCollection` |
| `delete_kb_article` | Remove an article | `deleteKbArticle` |

---

## 8. Remote Execution (9 tools)

Tools for discovering and running scripts on assets.

### Script Discovery

| Tool | Purpose | API Basis |
|------|---------|-----------|
| `list_scripts` | List all scripts with metadata | `getScriptList` |
| `list_scripts_by_os` | Filter by OS (WINDOWS, MAC, LINUX) | `getScriptListByType` |
| `list_scripts_by_language` | Filter by language (PowerShell, Bash) | `getScriptList` + condition |
| `list_scripts_by_tag` | Filter by tag (Network, Security, etc.) | `getScriptList` + condition |
| `search_scripts` | Search by name/description | `getScriptList` + condition |
| `get_script` | Get full script details including readme | `getScriptList` filtered by ID |

### Script Execution

| Tool | Purpose | API Basis |
|------|---------|-----------|
| `run_script` | Run script on asset with optional arguments | `runScriptOnAsset` |

### Execution History

| Tool | Purpose | API Basis |
|------|---------|-----------|
| `get_script_runs` | Recent script executions on an asset | `getAssetActivity` filtered to SCRIPT module |

### Script Metadata

Scripts include the following properties:

| Field | Description |
|-------|-------------|
| `scriptId` | Unique identifier |
| `name` | Script name/filename |
| `description` | Short description |
| `language` | PowerShell, Bash, etc. |
| `runAs` | `SYSTEM_USER` or `LOGGED_IN_USER` |
| `runTimeVariables` | Parameters the script accepts |
| `timeOut` | Execution timeout (seconds) |
| `tags` | Categories (Network, Security, Cleanup, etc.) |
| `favourite` | Marked as favorite |
| `readMe` | Full documentation |
| `addedBy` / `createdTime` | Authorship |

### Available Tags

Administration, Applications, Antivirus, Backup, Cleanup, Disk, Linux, Logs, Maintenance, Monitoring, Network, Patch, Security, Services, Software, Windows

### Script Counts by OS

- WINDOWS: 123 scripts
- MAC: 37 scripts
- LINUX: (subset of Bash scripts)

---

## 9. Lookup / Reference Data (13 tools)

Tools for retrieving valid values for other operations.

| Tool | Purpose | API Basis |
|------|---------|-----------|
| `get_statuses` | Valid ticket statuses | `getStatusList` |
| `get_priorities` | Priority levels | `getPriorityList` |
| `get_categories` | Ticket categories & subcategories | `getCategoryList` |
| `get_causes` | Ticket causes & subcauses | `getCauseList` |
| `get_impacts` | Impact levels | `getImpactList` |
| `get_urgencies` | Urgency levels | `getUrgencyList` |
| `get_resolution_codes` | Resolution codes for closing | `getResolutionCodeList` |
| `get_slas` | Available SLAs | `getSLAList` |
| `get_technicians` | List of technicians | `getTechnicianList` |
| `get_technician_groups` | Technician groups | `getTechnicianGroupList` |
| `get_teams` | Teams | `getTeamList` |
| `get_device_categories` | Asset device categories | `getDeviceCategories` |
| `get_client_stages` | Client lifecycle stages | `getClientStageList` |

---

## Summary

| Category | Tool Count |
|----------|------------|
| Ticket Queue Management | 8 |
| Ticket Actions | 11 |
| Asset Management | 14 |
| Client & Contact Management | 11 |
| Alert Management | 4 |
| Time/Worklog | 4 |
| Knowledge Base | 6 |
| Remote Execution | 9 |
| Lookup/Reference | 13 |
| **Total** | **80** |

---

## Implementation Notes

### Existing Tools (Keep)

The current MCP has 5 meta-tools that should be retained:

1. `search_superops_api` - Search API documentation
2. `get_superops_operation` - Get operation details
3. `get_superops_type` - Get type definitions
4. `list_superops_operations` - List all operations
5. `execute_graphql` - Execute raw GraphQL

### API Limitations Discovered

1. **Script output not available** - `runScriptOnAsset` returns execution metadata but not stdout/stderr. Output is only visible in SuperOps UI.

2. **No merge tickets** - API doesn't support merging duplicate tickets.

3. **No bulk script execution** - Scripts can only be run on one asset at a time via API.

### Filtering Capabilities

The `ListInfoInput` type supports:
- `page` / `pageSize` - Pagination
- `condition` - Filter with `attribute`, `operator`, `value`
- `sort` - Sort by attribute with ASC/DESC order

Example condition:
```json
{
  "attribute": "language",
  "operator": "is",
  "value": "PowerShell"
}
```
