/**
 * Asset Management Tools for SuperOps MCP
 *
 * Provides 14 tools for managing and monitoring assets:
 * - get_asset: Get full details of a specific asset
 * - get_assets: List assets with filters
 * - get_asset_summary: Quick overview (CPU, memory, disk, network)
 * - get_asset_software: List installed software
 * - get_asset_patches: Patch status and details
 * - get_asset_disks: Disk/partition details
 * - get_asset_activity: Full activity log
 * - get_asset_script_history: Script executions (filtered from activity)
 * - get_asset_patch_history: Patch operations (filtered from activity)
 * - get_asset_user_log: User login/logout history
 * - get_unmonitored_assets: Assets not being monitored
 * - update_asset: Update asset metadata
 * - assign_device_category: Categorize assets
 * - delete_asset: Remove an asset (soft delete)
 */

// GraphQL Fragments for reuse
const ASSET_FIELDS = `
  assetId
  name
  assetClass
  client
  site
  requester
  primaryMac
  loggedInUser
  serialNumber
  manufacturer
  model
  hostName
  publicIp
  gateway
  platform
  domain
  status
  sysUptime
  lastCommunicatedTime
  agentVersion
  platformFamily
  platformCategory
  platformVersion
  patchStatus
  warrantyExpiryDate
  purchasedDate
  customFields
  lastReportedTime
  deviceCategory
`;

const ASSET_SUMMARY_FIELDS = `
  cpu {
    assetId
    cpuName
    currentSpeed
    maxSpeed
    physicalCore
    logicalCore
    architecture
    l1Cache
    l2Cache
    l3Cache
    processCount
    threadsCount
    handlesCount
    cpuUsage
  }
  memory {
    totalMemory
    usedMemory
    availableMemory
    cachedMemory
    pagedPoolByte
    nonPagedPoolByte
    memoryUsage
    swapTotalMemory
    swapAvailableMemory
    swapUsedMemory
  }
  disk {
    disks {
      drive
      discType
      fileSystem
      size
      freeSize
      driveUsage
    }
    totalFreeSpace
    totalSize
  }
  assetInterface {
    name
    mac
    ipv4Address
    ipv6Address
    infIndex
    mtu
    connectType
    lineSpeed
    dataInPerSec
    dataOutPerSec
    adapterName
  }
  lastUserLog {
    id
    name
    lastLoginTime
  }
`;

const ASSET_SOFTWARE_FIELDS = `
  id
  software
  version
  installedDate
  bitVersion
  installedPath
`;

const ASSET_PATCH_FIELDS = `
  patchDetail {
    patchId
    patchKey
    title
    publishedDate
    category
    severity
    kbNumbers {
      kbNumber
    }
    restartRequired
  }
  approvalStatus
  installationTime
  installationStatus
  failedMessage
`;

const ASSET_DISK_FIELDS = `
  drive
  discType
  fileSystem
  maxFileLength
  autoMounted
  compressed
  pageFile
  indexed
  size
  freeSize
  activeTime
  responseTime
  readSpeed
  writeSpeed
  driveUsage
`;

const ASSET_ACTIVITY_FIELDS = `
  activityId
  module
  activityType
  activityData
  createdBy
  createdTime
`;

const ASSET_USER_LOG_FIELDS = `
  id
  name
  lastLoginTime
`;

const LIST_INFO_FIELDS = `
  page
  pageSize
  totalCount
`;

// Tool definitions
export const assetTools = [
  {
    name: 'get_asset',
    description: 'Get full details of a specific asset by ID. Returns comprehensive information including hardware specs, client/site assignment, network details, patch status, and custom fields.',
    inputSchema: {
      type: 'object',
      properties: {
        asset_id: {
          type: 'string',
          description: 'The unique ID of the asset'
        }
      },
      required: ['asset_id']
    }
  },
  {
    name: 'get_assets',
    description: 'List assets with optional filters. Supports filtering by client, site, OS type, status, and more. Returns paginated results.',
    inputSchema: {
      type: 'object',
      properties: {
        page: {
          type: 'integer',
          description: 'Page number (default: 1)',
          default: 1
        },
        page_size: {
          type: 'integer',
          description: 'Number of results per page (default: 25, max: 100)',
          default: 25
        },
        client_id: {
          type: 'string',
          description: 'Filter by client ID (accountId)'
        },
        site_id: {
          type: 'string',
          description: 'Filter by site ID'
        },
        status: {
          type: 'string',
          enum: ['ONLINE', 'OFFLINE'],
          description: 'Filter by online/offline status'
        },
        platform_category: {
          type: 'string',
          enum: ['WORKSTATION', 'SERVER'],
          description: 'Filter by platform category'
        },
        patch_status: {
          type: 'string',
          description: 'Filter by patch status (e.g., "Fully Patched", "Patches Available")'
        }
      }
    }
  },
  {
    name: 'get_asset_summary',
    description: 'Get a quick overview of an asset including CPU usage, memory usage, disk space, network interface details, and last user login. Ideal for at-a-glance health checks.',
    inputSchema: {
      type: 'object',
      properties: {
        asset_id: {
          type: 'string',
          description: 'The unique ID of the asset'
        }
      },
      required: ['asset_id']
    }
  },
  {
    name: 'get_asset_software',
    description: 'List all installed software on an asset. Returns software name, version, install date, and path.',
    inputSchema: {
      type: 'object',
      properties: {
        asset_id: {
          type: 'string',
          description: 'The unique ID of the asset'
        },
        page: {
          type: 'integer',
          description: 'Page number (default: 1)',
          default: 1
        },
        page_size: {
          type: 'integer',
          description: 'Number of results per page (default: 50)',
          default: 50
        }
      },
      required: ['asset_id']
    }
  },
  {
    name: 'get_asset_patches',
    description: 'Get patch status and details for an asset. Shows available, installed, and failed patches with severity and approval status.',
    inputSchema: {
      type: 'object',
      properties: {
        asset_id: {
          type: 'string',
          description: 'The unique ID of the asset'
        },
        page: {
          type: 'integer',
          description: 'Page number (default: 1)',
          default: 1
        },
        page_size: {
          type: 'integer',
          description: 'Number of results per page (default: 50)',
          default: 50
        }
      },
      required: ['asset_id']
    }
  },
  {
    name: 'get_asset_disks',
    description: 'Get detailed disk and partition information for an asset including drive letters, file systems, sizes, free space, and I/O metrics.',
    inputSchema: {
      type: 'object',
      properties: {
        asset_id: {
          type: 'string',
          description: 'The unique ID of the asset'
        }
      },
      required: ['asset_id']
    }
  },
  {
    name: 'get_asset_activity',
    description: 'Get the full activity log for an asset. Shows all activities including script executions, patch operations, and other events.',
    inputSchema: {
      type: 'object',
      properties: {
        asset_id: {
          type: 'string',
          description: 'The unique ID of the asset'
        },
        page: {
          type: 'integer',
          description: 'Page number (default: 1)',
          default: 1
        },
        page_size: {
          type: 'integer',
          description: 'Number of results per page (default: 25)',
          default: 25
        }
      },
      required: ['asset_id']
    }
  },
  {
    name: 'get_asset_script_history',
    description: 'Get script execution history for an asset. Shows script names, execution status, who triggered them, and when. Note: Script output/stdout is not available via API.',
    inputSchema: {
      type: 'object',
      properties: {
        asset_id: {
          type: 'string',
          description: 'The unique ID of the asset'
        },
        page: {
          type: 'integer',
          description: 'Page number (default: 1)',
          default: 1
        },
        page_size: {
          type: 'integer',
          description: 'Number of results per page (default: 25)',
          default: 25
        }
      },
      required: ['asset_id']
    }
  },
  {
    name: 'get_asset_patch_history',
    description: 'Get patch operation history for an asset. Shows patch installations, scans, and their status.',
    inputSchema: {
      type: 'object',
      properties: {
        asset_id: {
          type: 'string',
          description: 'The unique ID of the asset'
        },
        page: {
          type: 'integer',
          description: 'Page number (default: 1)',
          default: 1
        },
        page_size: {
          type: 'integer',
          description: 'Number of results per page (default: 25)',
          default: 25
        }
      },
      required: ['asset_id']
    }
  },
  {
    name: 'get_asset_user_log',
    description: 'Get user login/logout history for an asset. Shows usernames and their last login times.',
    inputSchema: {
      type: 'object',
      properties: {
        asset_id: {
          type: 'string',
          description: 'The unique ID of the asset'
        }
      },
      required: ['asset_id']
    }
  },
  {
    name: 'get_unmonitored_assets',
    description: 'List assets that are not currently being monitored. Useful for identifying devices that may have gone offline or had their agent removed.',
    inputSchema: {
      type: 'object',
      properties: {
        page: {
          type: 'integer',
          description: 'Page number (default: 1)',
          default: 1
        },
        page_size: {
          type: 'integer',
          description: 'Number of results per page (default: 25)',
          default: 25
        }
      }
    }
  },
  {
    name: 'update_asset',
    description: 'Update asset metadata including name, client/site assignment, requester, warranty dates, and custom fields.',
    inputSchema: {
      type: 'object',
      properties: {
        asset_id: {
          type: 'string',
          description: 'The unique ID of the asset to update'
        },
        name: {
          type: 'string',
          description: 'New name for the asset'
        },
        client_id: {
          type: 'string',
          description: 'New client ID (accountId) to assign the asset to'
        },
        site_id: {
          type: 'string',
          description: 'New site ID to assign the asset to'
        },
        requester_id: {
          type: 'string',
          description: 'New requester user ID for the asset'
        },
        warranty_expiry_date: {
          type: 'string',
          description: 'Warranty expiration date (format: YYYY-MM-DD)'
        },
        purchased_date: {
          type: 'string',
          description: 'Purchase date (format: YYYY-MM-DD)'
        },
        custom_fields: {
          type: 'object',
          description: 'Custom field values as key-value pairs'
        }
      },
      required: ['asset_id']
    }
  },
  {
    name: 'assign_device_category',
    description: 'Assign a device category to one or more assets. Use get_device_categories to see available categories.',
    inputSchema: {
      type: 'object',
      properties: {
        asset_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of asset IDs to categorize'
        },
        device_category_id: {
          type: 'string',
          description: 'The ID of the device category to assign'
        }
      },
      required: ['asset_ids', 'device_category_id']
    }
  },
  {
    name: 'delete_asset',
    description: 'Soft delete an asset. The asset will be moved to trash and can potentially be recovered. Use with caution.',
    inputSchema: {
      type: 'object',
      properties: {
        asset_id: {
          type: 'string',
          description: 'The unique ID of the asset to delete'
        }
      },
      required: ['asset_id']
    }
  }
];

/**
 * Build a condition object for filtering
 */
function buildCondition(attribute, operator, value) {
  return { attribute, operator, value };
}

/**
 * Build ListInfoInput from common parameters
 */
function buildListInfo({ page = 1, pageSize = 25, condition = null, sort = null }) {
  const input = { page, pageSize };
  if (condition) input.condition = condition;
  if (sort) input.sort = sort;
  return input;
}

/**
 * Handle asset tool calls
 */
export async function handleAssetTool(name, args, client) {
  switch (name) {
    case 'get_asset': {
      const query = `
        query getAsset($input: AssetIdentifierInput!) {
          getAsset(input: $input) {
            ${ASSET_FIELDS}
          }
        }
      `;
      const result = await client.execute(query, {
        input: { assetId: args.asset_id }
      });
      return result.getAsset;
    }

    case 'get_assets': {
      const query = `
        query getAssetList($input: ListInfoInput!) {
          getAssetList(input: $input) {
            assets {
              ${ASSET_FIELDS}
            }
            listInfo {
              ${LIST_INFO_FIELDS}
            }
          }
        }
      `;

      // Build condition based on filters
      let condition = null;
      if (args.client_id) {
        condition = buildCondition('client.accountId', 'is', args.client_id);
      } else if (args.site_id) {
        condition = buildCondition('site.id', 'is', args.site_id);
      } else if (args.status) {
        condition = buildCondition('status', 'is', args.status);
      } else if (args.platform_category) {
        condition = buildCondition('platformCategory', 'is', args.platform_category);
      } else if (args.patch_status) {
        condition = buildCondition('patchStatus', 'is', args.patch_status);
      }

      const result = await client.execute(query, {
        input: buildListInfo({
          page: args.page || 1,
          pageSize: Math.min(args.page_size || 25, 100),
          condition
        })
      });
      return result.getAssetList;
    }

    case 'get_asset_summary': {
      const query = `
        query getAssetSummary($input: AssetIdentifierInput!) {
          getAssetSummary(input: $input) {
            ${ASSET_SUMMARY_FIELDS}
          }
        }
      `;
      const result = await client.execute(query, {
        input: { assetId: args.asset_id }
      });
      return result.getAssetSummary;
    }

    case 'get_asset_software': {
      const query = `
        query getAssetSoftwareList($input: AssetDetailsListInput!) {
          getAssetSoftwareList(input: $input) {
            assetSoftwares {
              ${ASSET_SOFTWARE_FIELDS}
            }
            listInfo {
              ${LIST_INFO_FIELDS}
            }
          }
        }
      `;
      const result = await client.execute(query, {
        input: {
          assetId: args.asset_id,
          listInfo: buildListInfo({
            page: args.page || 1,
            pageSize: args.page_size || 50
          })
        }
      });
      return result.getAssetSoftwareList;
    }

    case 'get_asset_patches': {
      const query = `
        query getAssetPatchDetails($input: AssetDetailsListInput!) {
          getAssetPatchDetails(input: $input) {
            assetPatches {
              ${ASSET_PATCH_FIELDS}
            }
            listInfo {
              ${LIST_INFO_FIELDS}
            }
          }
        }
      `;
      const result = await client.execute(query, {
        input: {
          assetId: args.asset_id,
          listInfo: buildListInfo({
            page: args.page || 1,
            pageSize: args.page_size || 50
          })
        }
      });
      return result.getAssetPatchDetails;
    }

    case 'get_asset_disks': {
      const query = `
        query getAssetDiskDetails($input: AssetIdentifierInput!) {
          getAssetDiskDetails(input: $input) {
            ${ASSET_DISK_FIELDS}
          }
        }
      `;
      const result = await client.execute(query, {
        input: { assetId: args.asset_id }
      });
      return result.getAssetDiskDetails;
    }

    case 'get_asset_activity': {
      const query = `
        query getAssetActivity($input: AssetDetailsListInput!) {
          getAssetActivity(input: $input) {
            activities {
              ${ASSET_ACTIVITY_FIELDS}
            }
            listInfo {
              ${LIST_INFO_FIELDS}
            }
          }
        }
      `;
      const result = await client.execute(query, {
        input: {
          assetId: args.asset_id,
          listInfo: buildListInfo({
            page: args.page || 1,
            pageSize: args.page_size || 25
          })
        }
      });
      return result.getAssetActivity;
    }

    case 'get_asset_script_history': {
      // Fetch activity and filter by module=SCRIPT
      const query = `
        query getAssetActivity($input: AssetDetailsListInput!) {
          getAssetActivity(input: $input) {
            activities {
              ${ASSET_ACTIVITY_FIELDS}
            }
            listInfo {
              ${LIST_INFO_FIELDS}
            }
          }
        }
      `;
      const result = await client.execute(query, {
        input: {
          assetId: args.asset_id,
          listInfo: buildListInfo({
            page: args.page || 1,
            pageSize: args.page_size || 25
          })
        }
      });

      // Filter to only SCRIPT module activities
      const scriptActivities = result.getAssetActivity.activities.filter(
        activity => activity.module === 'SCRIPT'
      );

      return {
        activities: scriptActivities,
        listInfo: result.getAssetActivity.listInfo,
        note: 'Script output/stdout is not available via API - only execution metadata.'
      };
    }

    case 'get_asset_patch_history': {
      // Fetch activity and filter by module=PATCH
      const query = `
        query getAssetActivity($input: AssetDetailsListInput!) {
          getAssetActivity(input: $input) {
            activities {
              ${ASSET_ACTIVITY_FIELDS}
            }
            listInfo {
              ${LIST_INFO_FIELDS}
            }
          }
        }
      `;
      const result = await client.execute(query, {
        input: {
          assetId: args.asset_id,
          listInfo: buildListInfo({
            page: args.page || 1,
            pageSize: args.page_size || 25
          })
        }
      });

      // Filter to only PATCH module activities
      const patchActivities = result.getAssetActivity.activities.filter(
        activity => activity.module === 'PATCH'
      );

      return {
        activities: patchActivities,
        listInfo: result.getAssetActivity.listInfo
      };
    }

    case 'get_asset_user_log': {
      const query = `
        query getAssetUserLog($input: AssetIdentifierInput!) {
          getAssetUserLog(input: $input) {
            ${ASSET_USER_LOG_FIELDS}
          }
        }
      `;
      const result = await client.execute(query, {
        input: { assetId: args.asset_id }
      });
      return result.getAssetUserLog;
    }

    case 'get_unmonitored_assets': {
      // Note: Unmonitored assets API doesn't support all asset fields (e.g., primaryMac causes errors)
      // Using a reduced field set that works reliably
      const query = `
        query getUnMonitoredAssetList($input: ListInfoInput!) {
          getUnMonitoredAssetList(input: $input) {
            assets {
              assetId
              name
              assetClass
              client
              site
              requester
              serialNumber
              manufacturer
              model
              hostName
              platform
              status
              lastCommunicatedTime
              deviceCategory
            }
            listInfo {
              ${LIST_INFO_FIELDS}
            }
          }
        }
      `;
      const result = await client.execute(query, {
        input: buildListInfo({
          page: args.page || 1,
          pageSize: Math.min(args.page_size || 25, 100)
        })
      });
      return result.getUnMonitoredAssetList;
    }

    case 'update_asset': {
      const mutation = `
        mutation updateAsset($input: UpdateAssetInput!) {
          updateAsset(input: $input) {
            assetId
            name
            assetClass
            client
            site
            requester
            customFields
          }
        }
      `;

      const input = { assetId: args.asset_id };

      if (args.name) input.name = args.name;
      if (args.client_id) input.client = { accountId: args.client_id };
      if (args.site_id) input.site = { id: args.site_id };
      if (args.requester_id) input.requester = { userId: args.requester_id };
      if (args.warranty_expiry_date) input.warrantyExpiryDate = args.warranty_expiry_date;
      if (args.purchased_date) input.purchasedDate = args.purchased_date;
      if (args.custom_fields) input.customFields = args.custom_fields;

      const result = await client.execute(mutation, { input });
      return result.updateAsset;
    }

    case 'assign_device_category': {
      const mutation = `
        mutation assignDeviceCategory($input: AssignDeviceCategoryInput) {
          assignDeviceCategory(input: $input)
        }
      `;
      const result = await client.execute(mutation, {
        input: {
          assetIds: args.asset_ids,
          deviceCategoryId: args.device_category_id
        }
      });
      return {
        success: result.assignDeviceCategory,
        message: result.assignDeviceCategory
          ? `Device category assigned to ${args.asset_ids.length} asset(s)`
          : 'Failed to assign device category'
      };
    }

    case 'delete_asset': {
      const mutation = `
        mutation softDeleteAsset($input: AssetIdentifierInput) {
          softDeleteAsset(input: $input)
        }
      `;
      const result = await client.execute(mutation, {
        input: { assetId: args.asset_id }
      });
      return {
        success: result.softDeleteAsset,
        message: result.softDeleteAsset
          ? `Asset ${args.asset_id} has been deleted`
          : 'Failed to delete asset'
      };
    }

    default:
      throw new Error(`Unknown asset tool: ${name}`);
  }
}

/**
 * Check if a tool name is an asset tool
 */
export function isAssetTool(name) {
  return assetTools.some(t => t.name === name);
}
