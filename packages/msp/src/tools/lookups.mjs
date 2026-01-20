/**
 * Lookup / Reference Data Tools
 *
 * These tools retrieve valid values for use in other operations.
 * Most are simple parameter-less queries that return lists of options.
 */

// GraphQL queries for each lookup operation
const QUERIES = {
  getStatusList: `query getStatusList {
    getStatusList {
      id
      name
      description
    }
  }`,

  getPriorityList: `query getPriorityList {
    getPriorityList {
      id
      name
      colorCode
    }
  }`,

  getCategoryList: `query getCategoryList {
    getCategoryList {
      id
      name
      subCategories {
        id
        name
      }
    }
  }`,

  getCauseList: `query getCauseList {
    getCauseList {
      id
      name
      subCauses {
        id
        name
        description
      }
    }
  }`,

  getImpactList: `query getImpactList {
    getImpactList {
      id
      name
    }
  }`,

  getUrgencyList: `query getUrgencyList {
    getUrgencyList {
      id
      name
    }
  }`,

  getResolutionCodeList: `query getResolutionCodeList {
    getResolutionCodeList {
      id
      name
      description
    }
  }`,

  getSLAList: `query getSLAList {
    getSLAList {
      id
      name
    }
  }`,

  getTechnicianList: `query getTechnicianList($input: ListInfoInput!) {
    getTechnicianList(input: $input) {
      userList {
        userId
        firstName
        lastName
        name
        email
        contactNumber
        designation
        team
        role
        groups
      }
      listInfo {
        page
        pageSize
        totalCount
        hasMore
      }
    }
  }`,

  getTechnicianGroupList: `query getTechnicianGroupList {
    getTechnicianGroupList {
      groupId
      name
    }
  }`,

  getTeamList: `query getTeamList {
    getTeamList {
      teamId
      name
    }
  }`,

  getDeviceCategories: `query getDeviceCategories($input: DeviceCategoryIdentifierInput) {
    getDeviceCategories(input: $input) {
      deviceCategoryId
      name
      custom
      assetClass
      createdTime
    }
  }`,

  getClientStageList: `query getClientStageList {
    getClientStageList {
      stageId
      name
      constant
      statuses {
        statusId
        name
        constant
      }
    }
  }`
};

/**
 * Tool definitions for the MCP server
 */
export const lookupTools = [
  {
    name: 'get_statuses',
    description: 'Get valid ticket statuses. Returns a list of status options that can be used when creating or updating tickets.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: 'get_priorities',
    description: 'Get priority levels for tickets. Returns a list of priority options with their color codes.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: 'get_categories',
    description: 'Get ticket categories and their subcategories. Returns a hierarchical list of categories for classifying tickets.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: 'get_causes',
    description: 'Get ticket causes and their subcauses. Returns a hierarchical list of root causes for tickets.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: 'get_impacts',
    description: 'Get impact levels for tickets. Returns a list of impact options (e.g., Low, Medium, High).',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: 'get_urgencies',
    description: 'Get urgency levels for tickets. Returns a list of urgency options (e.g., Low, Medium, High).',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: 'get_resolution_codes',
    description: 'Get resolution codes for closing tickets. Returns a list of resolution options with descriptions.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: 'get_slas',
    description: 'Get available SLAs (Service Level Agreements). Returns a list of SLA options that can be assigned to tickets.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: 'get_technicians',
    description: 'Get list of technicians. Returns technicians with their contact info, team, role, and group memberships.',
    inputSchema: {
      type: 'object',
      properties: {
        page: {
          type: 'integer',
          description: 'Page number (default: 1)',
          minimum: 1
        },
        pageSize: {
          type: 'integer',
          description: 'Number of results per page (default: 100, max: 100)',
          minimum: 1,
          maximum: 100
        }
      },
      additionalProperties: false
    }
  },
  {
    name: 'get_technician_groups',
    description: 'Get technician groups. Returns a list of groups that technicians can belong to for ticket assignment.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: 'get_teams',
    description: 'Get teams. Returns a list of teams that technicians can be assigned to.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: 'get_device_categories',
    description: 'Get device categories for assets. Optionally filter by module type (ENDPOINT or NM_ASSET) or custom/default status.',
    inputSchema: {
      type: 'object',
      properties: {
        module: {
          type: 'array',
          items: { type: 'string', enum: ['ENDPOINT', 'NM_ASSET'] },
          description: 'Filter by module type(s): ENDPOINT (managed endpoints) or NM_ASSET (network assets)'
        },
        custom: {
          type: 'boolean',
          description: 'Filter by custom (true) or default (false) categories'
        },
        classId: {
          type: 'string',
          description: 'Filter by asset class ID'
        }
      },
      additionalProperties: false
    }
  },
  {
    name: 'get_client_stages',
    description: 'Get client lifecycle stages and their statuses. Returns stages like Prospect, Active, Inactive with associated statuses.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  }
];

/**
 * Check if a tool name is a lookup tool
 * @param {string} name - Tool name to check
 * @returns {boolean}
 */
export function isLookupTool(name) {
  return lookupTools.some(t => t.name === name);
}

/**
 * Handle a lookup tool call
 * @param {string} name - Tool name
 * @param {object} args - Tool arguments
 * @param {object} client - SuperOpsClient instance
 * @returns {Promise<object>} Tool result
 */
export async function handleLookupTool(name, args, client) {
  switch (name) {
    case 'get_statuses': {
      const data = await client.execute(QUERIES.getStatusList);
      return formatResult(data.getStatusList, 'statuses');
    }

    case 'get_priorities': {
      const data = await client.execute(QUERIES.getPriorityList);
      return formatResult(data.getPriorityList, 'priorities');
    }

    case 'get_categories': {
      const data = await client.execute(QUERIES.getCategoryList);
      return formatResult(data.getCategoryList, 'categories');
    }

    case 'get_causes': {
      const data = await client.execute(QUERIES.getCauseList);
      return formatResult(data.getCauseList, 'causes');
    }

    case 'get_impacts': {
      const data = await client.execute(QUERIES.getImpactList);
      return formatResult(data.getImpactList, 'impacts');
    }

    case 'get_urgencies': {
      const data = await client.execute(QUERIES.getUrgencyList);
      return formatResult(data.getUrgencyList, 'urgencies');
    }

    case 'get_resolution_codes': {
      const data = await client.execute(QUERIES.getResolutionCodeList);
      return formatResult(data.getResolutionCodeList, 'resolutionCodes');
    }

    case 'get_slas': {
      const data = await client.execute(QUERIES.getSLAList);
      return formatResult(data.getSLAList, 'slas');
    }

    case 'get_technicians': {
      const page = args.page || 1;
      const pageSize = Math.min(args.pageSize || 100, 100);

      const data = await client.execute(QUERIES.getTechnicianList, {
        input: { page, pageSize }
      });

      const result = data.getTechnicianList;
      return {
        technicians: result.userList,
        pagination: {
          page: result.listInfo.page,
          pageSize: result.listInfo.pageSize,
          totalCount: result.listInfo.totalCount,
          hasMore: result.listInfo.hasMore
        }
      };
    }

    case 'get_technician_groups': {
      const data = await client.execute(QUERIES.getTechnicianGroupList);
      return formatResult(data.getTechnicianGroupList, 'technicianGroups');
    }

    case 'get_teams': {
      const data = await client.execute(QUERIES.getTeamList);
      return formatResult(data.getTeamList, 'teams');
    }

    case 'get_device_categories': {
      const input = {};
      if (args.module) input.module = args.module;
      if (args.custom !== undefined) input.custom = args.custom;
      if (args.classId) input.classId = args.classId;

      const variables = Object.keys(input).length > 0 ? { input } : {};
      const data = await client.execute(QUERIES.getDeviceCategories, variables);
      return formatResult(data.getDeviceCategories, 'deviceCategories');
    }

    case 'get_client_stages': {
      const data = await client.execute(QUERIES.getClientStageList);
      return formatResult(data.getClientStageList, 'clientStages');
    }

    default:
      throw new Error(`Unknown lookup tool: ${name}`);
  }
}

/**
 * Format a result with a named key and count
 * @param {Array} items - Result items
 * @param {string} key - Key name for the items
 * @returns {object} Formatted result
 */
function formatResult(items, key) {
  const list = items || [];
  return {
    [key]: list,
    count: list.length
  };
}
