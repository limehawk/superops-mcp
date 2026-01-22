/**
 * Client & Contact Management and Alert Management Tools
 *
 * Tools for managing MSP clients, contacts, sites, contracts, and alerts.
 */

// GraphQL fragments for consistent field selection
const CLIENT_FIELDS = `
  accountId
  name
  stage
  status
  emailDomains
  accountManager
  primaryContact
  secondaryContact
  hqSite
  technicianGroups
  customFields
`;

const CLIENT_SITE_FIELDS = `
  id
  name
  timezoneCode
  working24x7
  line1
  line2
  line3
  city
  postalCode
  countryCode
  stateCode
  contactNumber
  client
  hq
`;

const CLIENT_USER_FIELDS = `
  userId
  firstName
  lastName
  name
  email
  contactNumber
  reportingManager
  site
  role
  client
  customFields
`;

const CLIENT_CONTRACT_FIELDS = `
  contractId
  client
  contract {
    contractId
    name
    description
    contractType
  }
  startDate
  endDate
  contractStatus
`;

const ALERT_FIELDS = `
  id
  message
  createdTime
  status
  severity
  description
  asset
  policy
`;

// Tool definitions
export const clientTools = [
  // Client & Contact Management (11 tools)
  {
    name: 'get_client',
    description: 'Get full details of a specific client by ID. Returns client info including name, stage, status, email domains, contacts, HQ site, and technician groups.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: {
          type: 'string',
          description: 'The unique ID of the client'
        }
      },
      required: ['accountId']
    }
  },
  {
    name: 'get_clients',
    description: 'List all clients with optional filtering. Returns paginated list of clients with their basic info.',
    inputSchema: {
      type: 'object',
      properties: {
        page: {
          type: 'integer',
          description: 'Page number for pagination (default: 1)',
          default: 1
        },
        pageSize: {
          type: 'integer',
          description: 'Number of results per page (default: 50, max: 100)',
          default: 50
        },
        stage: {
          type: 'string',
          description: 'Filter by client stage (e.g., "Active", "Prospect")'
        },
        status: {
          type: 'string',
          description: 'Filter by client status (e.g., "Paid", "Trial")'
        },
        search: {
          type: 'string',
          description: 'Search by client name'
        }
      }
    }
  },
  {
    name: 'get_client_sites',
    description: 'List all sites/locations for a specific client. Returns site details including address, timezone, and business hours configuration.',
    inputSchema: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'The unique ID of the client'
        },
        page: {
          type: 'integer',
          description: 'Page number for pagination (default: 1)',
          default: 1
        },
        pageSize: {
          type: 'integer',
          description: 'Number of results per page (default: 50)',
          default: 50
        }
      },
      required: ['clientId']
    }
  },
  {
    name: 'get_client_users',
    description: 'List all contacts/users for a specific client. Returns user details including name, email, role, and site association.',
    inputSchema: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'The unique ID of the client'
        },
        page: {
          type: 'integer',
          description: 'Page number for pagination (default: 1)',
          default: 1
        },
        pageSize: {
          type: 'integer',
          description: 'Number of results per page (default: 50)',
          default: 50
        }
      },
      required: ['clientId']
    }
  },
  {
    name: 'get_client_contracts',
    description: 'List all contracts for a specific client. Returns contract details including type, status, start/end dates.',
    inputSchema: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'Filter by client ID (optional - if not provided, returns all contracts)'
        },
        page: {
          type: 'integer',
          description: 'Page number for pagination (default: 1)',
          default: 1
        },
        pageSize: {
          type: 'integer',
          description: 'Number of results per page (default: 50)',
          default: 50
        }
      }
    }
  },
  {
    name: 'create_client',
    description: 'Create a new client with headquarters site. The HQ site is required and created automatically with the client.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Client name (required, must be unique)'
        },
        stage: {
          type: 'string',
          description: 'Client stage (default: "Active")'
        },
        status: {
          type: 'string',
          description: 'Client status (default: "Paid")'
        },
        emailDomains: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of email domains for the client (e.g., ["acme.com"])'
        },
        accountManagerId: {
          type: 'string',
          description: 'User ID of the account manager (technician)'
        },
        hqSiteName: {
          type: 'string',
          description: 'Name of the headquarters site (required)'
        },
        hqSiteTimezone: {
          type: 'string',
          description: 'Timezone for HQ site in IANA format (required, e.g., "America/New_York")'
        },
        hqSiteWorking24x7: {
          type: 'boolean',
          description: 'Whether HQ site operates 24/7 (default: true)',
          default: true
        },
        hqSiteAddress: {
          type: 'object',
          description: 'Address for HQ site',
          properties: {
            line1: { type: 'string' },
            line2: { type: 'string' },
            city: { type: 'string' },
            postalCode: { type: 'string' },
            countryCode: { type: 'string', description: 'ISO 3166 two-letter country code' },
            stateCode: { type: 'string', description: 'ISO 3166 state/subdivision code' }
          }
        },
        customFields: {
          type: 'object',
          description: 'Custom field values as key-value pairs'
        }
      },
      required: ['name', 'hqSiteName', 'hqSiteTimezone']
    }
  },
  {
    name: 'create_client_user',
    description: 'Add a new contact/user to a client. Creates a client user with specified role and site association.',
    inputSchema: {
      type: 'object',
      properties: {
        firstName: {
          type: 'string',
          description: 'First name of the user (required)'
        },
        lastName: {
          type: 'string',
          description: 'Last name of the user'
        },
        email: {
          type: 'string',
          description: 'Email address (required, must be unique)'
        },
        contactNumber: {
          type: 'string',
          description: 'Phone number in format +[country][area][local]'
        },
        roleId: {
          type: 'string',
          description: 'Role ID for the user (required)'
        },
        clientId: {
          type: 'string',
          description: 'Client ID to associate the user with (required)'
        },
        siteId: {
          type: 'string',
          description: 'Site ID to associate the user with (required)'
        },
        reportingManagerId: {
          type: 'string',
          description: 'User ID of the reporting manager'
        },
        customFields: {
          type: 'object',
          description: 'Custom field values as key-value pairs'
        }
      },
      required: ['firstName', 'email', 'roleId', 'clientId', 'siteId']
    }
  },
  {
    name: 'create_client_site',
    description: 'Add a new site/location to an existing client.',
    inputSchema: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'Client ID to add the site to (required)'
        },
        name: {
          type: 'string',
          description: 'Site name (required)'
        },
        timezoneCode: {
          type: 'string',
          description: 'Timezone in IANA format (required, e.g., "America/New_York")'
        },
        working24x7: {
          type: 'boolean',
          description: 'Whether site operates 24/7 (default: true)',
          default: true
        },
        line1: { type: 'string', description: 'Address line 1' },
        line2: { type: 'string', description: 'Address line 2' },
        line3: { type: 'string', description: 'Address line 3' },
        city: { type: 'string', description: 'City' },
        postalCode: { type: 'string', description: 'Postal/ZIP code' },
        countryCode: { type: 'string', description: 'ISO 3166 two-letter country code' },
        stateCode: { type: 'string', description: 'ISO 3166 state/subdivision code' },
        contactNumber: { type: 'string', description: 'Contact phone number' }
      },
      required: ['clientId', 'name', 'timezoneCode']
    }
  },
  {
    name: 'update_client',
    description: 'Update an existing client\'s information.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: {
          type: 'string',
          description: 'Client ID to update (required)'
        },
        name: {
          type: 'string',
          description: 'New client name'
        },
        stage: {
          type: 'string',
          description: 'New client stage'
        },
        status: {
          type: 'string',
          description: 'New client status'
        },
        emailDomains: {
          type: 'array',
          items: { type: 'string' },
          description: 'Updated list of email domains'
        },
        accountManagerId: {
          type: 'string',
          description: 'New account manager user ID'
        },
        primaryContactId: {
          type: 'string',
          description: 'New primary contact user ID'
        },
        secondaryContactId: {
          type: 'string',
          description: 'New secondary contact user ID'
        },
        hqSiteId: {
          type: 'string',
          description: 'New HQ site ID'
        },
        addTechnicianGroupIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Technician group IDs to add'
        },
        deleteTechnicianGroupIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Technician group IDs to remove'
        },
        customFields: {
          type: 'object',
          description: 'Custom field values to update'
        }
      },
      required: ['accountId']
    }
  },
  {
    name: 'update_client_user',
    description: 'Update an existing client user/contact\'s information.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID to update (required)'
        },
        firstName: {
          type: 'string',
          description: 'New first name'
        },
        lastName: {
          type: 'string',
          description: 'New last name'
        },
        email: {
          type: 'string',
          description: 'New email address'
        },
        contactNumber: {
          type: 'string',
          description: 'New phone number'
        },
        reportingManagerId: {
          type: 'string',
          description: 'New reporting manager user ID'
        },
        siteId: {
          type: 'string',
          description: 'New site ID'
        },
        roleId: {
          type: 'string',
          description: 'New role ID'
        },
        customFields: {
          type: 'object',
          description: 'Custom field values to update'
        }
      },
      required: ['userId']
    }
  },
  {
    name: 'search_contacts',
    description: 'Search for contacts/users across all clients by name or email.',
    inputSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search term to match against name or email (required)'
        },
        page: {
          type: 'integer',
          description: 'Page number for pagination (default: 1)',
          default: 1
        },
        pageSize: {
          type: 'integer',
          description: 'Number of results per page (default: 50)',
          default: 50
        }
      },
      required: ['search']
    }
  },

  // Alert Management (4 tools)
  {
    name: 'get_alerts',
    description: 'List all alerts with optional filtering. Returns paginated list of RMM alerts with status, severity, and asset info.',
    inputSchema: {
      type: 'object',
      properties: {
        page: {
          type: 'integer',
          description: 'Page number for pagination (default: 1)',
          default: 1
        },
        pageSize: {
          type: 'integer',
          description: 'Number of results per page (default: 50)',
          default: 50
        },
        status: {
          type: 'string',
          description: 'Filter by alert status (e.g., "Open", "Resolved")'
        },
        severity: {
          type: 'string',
          description: 'Filter by severity (e.g., "Critical", "High", "Medium", "Low")'
        }
      }
    }
  },
  {
    name: 'get_asset_alerts',
    description: 'Get all alerts for a specific asset. Returns alert history including resolved alerts.',
    inputSchema: {
      type: 'object',
      properties: {
        assetId: {
          type: 'string',
          description: 'The unique ID of the asset (required)'
        },
        page: {
          type: 'integer',
          description: 'Page number for pagination (default: 1)',
          default: 1
        },
        pageSize: {
          type: 'integer',
          description: 'Number of results per page (default: 50)',
          default: 50
        }
      },
      required: ['assetId']
    }
  },
  {
    name: 'resolve_alerts',
    description: 'Mark one or more alerts as resolved.',
    inputSchema: {
      type: 'object',
      properties: {
        alertIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of alert IDs to resolve (required)'
        }
      },
      required: ['alertIds']
    }
  },
  {
    name: 'create_alert',
    description: 'Create a manual alert on an asset. Use for custom monitoring or manual incident reporting.',
    inputSchema: {
      type: 'object',
      properties: {
        assetId: {
          type: 'string',
          description: 'Asset ID to create the alert on (required)'
        },
        message: {
          type: 'string',
          description: 'Alert message/title (required)'
        },
        description: {
          type: 'string',
          description: 'Detailed description of the alert'
        },
        severity: {
          type: 'string',
          description: 'Alert severity (e.g., "Critical", "High", "Medium", "Low")'
        }
      },
      required: ['assetId', 'message']
    }
  }
];

/**
 * Check if a tool name belongs to this module
 */
export function isClientTool(name) {
  return clientTools.some(t => t.name === name);
}

/**
 * Handle client and alert tool execution
 */
export async function handleClientTool(name, args, client) {
  switch (name) {
    // ==================== Client Tools ====================

    case 'get_client': {
      const query = `
        query getClient($input: ClientIdentifierInput!) {
          getClient(input: $input) {
            ${CLIENT_FIELDS}
          }
        }
      `;
      const result = await client.execute(query, {
        input: { accountId: args.accountId }
      });
      return result.getClient;
    }

    case 'get_clients': {
      const query = `
        query getClientList($input: ListInfoInput!) {
          getClientList(input: $input) {
            clients {
              ${CLIENT_FIELDS}
            }
            listInfo {
              page
              pageSize
              totalCount
            }
          }
        }
      `;

      const input = {
        page: args.page || 1,
        pageSize: Math.min(args.pageSize || 50, 100)
      };

      // Build condition for filtering
      if (args.stage || args.status || args.search) {
        const conditions = [];

        if (args.stage) {
          conditions.push({
            attribute: 'stage',
            operator: 'is',
            value: args.stage
          });
        }

        if (args.status) {
          conditions.push({
            attribute: 'status',
            operator: 'is',
            value: args.status
          });
        }

        if (args.search) {
          conditions.push({
            attribute: 'name',
            operator: 'contains',
            value: args.search
          });
        }

        // If multiple conditions, we need to handle them (API may only support single condition)
        if (conditions.length === 1) {
          input.condition = conditions[0];
        } else if (conditions.length > 1) {
          // Use the first condition; API may not support multiple
          input.condition = conditions[0];
        }
      }

      const result = await client.execute(query, { input });
      return {
        clients: result.getClientList.clients,
        pagination: result.getClientList.listInfo
      };
    }

    case 'get_client_sites': {
      const query = `
        query getClientSiteList($input: GetClientSiteListInput!) {
          getClientSiteList(input: $input) {
            sites {
              ${CLIENT_SITE_FIELDS}
            }
            listInfo {
              page
              pageSize
              totalCount
            }
          }
        }
      `;

      const input = {
        clientId: args.clientId,
        listInfo: {
          page: args.page || 1,
          pageSize: Math.min(args.pageSize || 50, 100)
        }
      };

      const result = await client.execute(query, { input });
      return {
        sites: result.getClientSiteList.sites,
        pagination: result.getClientSiteList.listInfo
      };
    }

    case 'get_client_users': {
      const query = `
        query getClientUserList($input: GetClientUserListInput!) {
          getClientUserList(input: $input) {
            userList {
              ${CLIENT_USER_FIELDS}
            }
            listInfo {
              page
              pageSize
              totalCount
            }
          }
        }
      `;

      const input = {
        clientId: args.clientId,
        listInfo: {
          page: args.page || 1,
          pageSize: Math.min(args.pageSize || 50, 100)
        }
      };

      const result = await client.execute(query, { input });
      return {
        users: result.getClientUserList.userList,
        pagination: result.getClientUserList.listInfo
      };
    }

    case 'get_client_contracts': {
      const query = `
        query getClientContractList($input: ListInfoInput) {
          getClientContractList(input: $input) {
            clientContracts {
              ${CLIENT_CONTRACT_FIELDS}
            }
            listInfo {
              page
              pageSize
              totalCount
            }
          }
        }
      `;

      const input = {
        page: args.page || 1,
        pageSize: Math.min(args.pageSize || 50, 100)
      };

      // Filter by client if provided
      if (args.clientId) {
        input.condition = {
          attribute: 'client.accountId',
          operator: 'is',
          value: args.clientId
        };
      }

      const result = await client.execute(query, { input });
      return {
        contracts: result.getClientContractList.clientContracts,
        pagination: result.getClientContractList.listInfo
      };
    }

    case 'create_client': {
      const mutation = `
        mutation createClientV2($input: CreateClientInputV2!) {
          createClientV2(input: $input) {
            ${CLIENT_FIELDS}
          }
        }
      `;

      // Build HQ site input
      const hqSite = {
        name: args.hqSiteName,
        timezoneCode: args.hqSiteTimezone,
        working24x7: args.hqSiteWorking24x7 !== false
      };

      // Add address fields if provided
      if (args.hqSiteAddress) {
        Object.assign(hqSite, {
          line1: args.hqSiteAddress.line1,
          line2: args.hqSiteAddress.line2,
          city: args.hqSiteAddress.city,
          postalCode: args.hqSiteAddress.postalCode,
          countryCode: args.hqSiteAddress.countryCode,
          stateCode: args.hqSiteAddress.stateCode
        });
      }

      const input = {
        name: args.name,
        hqSite
      };

      // Optional fields
      if (args.stage) input.stage = args.stage;
      if (args.status) input.status = args.status;
      if (args.emailDomains) input.emailDomains = args.emailDomains;
      if (args.accountManagerId) {
        input.accountManager = { userId: args.accountManagerId };
      }
      if (args.customFields) input.customFields = args.customFields;

      const result = await client.execute(mutation, { input });
      return result.createClientV2;
    }

    case 'create_client_user': {
      const mutation = `
        mutation createClientUser($input: CreateClientUserInput!) {
          createClientUser(input: $input) {
            ${CLIENT_USER_FIELDS}
          }
        }
      `;

      const input = {
        firstName: args.firstName,
        email: args.email,
        role: { roleId: args.roleId },
        addAssociations: [{
          client: { accountId: args.clientId },
          site: { id: args.siteId }
        }]
      };

      // Optional fields
      if (args.lastName) input.lastName = args.lastName;
      if (args.contactNumber) input.contactNumber = args.contactNumber;
      if (args.reportingManagerId) {
        input.reportingManager = { userId: args.reportingManagerId };
      }
      if (args.customFields) input.customFields = args.customFields;

      const result = await client.execute(mutation, { input });
      return result.createClientUser;
    }

    case 'create_client_site': {
      const mutation = `
        mutation createClientSite($input: CreateClientSiteInput!) {
          createClientSite(input: $input) {
            ${CLIENT_SITE_FIELDS}
          }
        }
      `;

      const input = {
        client: { accountId: args.clientId },
        name: args.name,
        timezoneCode: args.timezoneCode,
        working24x7: args.working24x7 !== false
      };

      // Optional address fields
      if (args.line1) input.line1 = args.line1;
      if (args.line2) input.line2 = args.line2;
      if (args.line3) input.line3 = args.line3;
      if (args.city) input.city = args.city;
      if (args.postalCode) input.postalCode = args.postalCode;
      if (args.countryCode) input.countryCode = args.countryCode;
      if (args.stateCode) input.stateCode = args.stateCode;
      if (args.contactNumber) input.contactNumber = args.contactNumber;

      const result = await client.execute(mutation, { input });
      return result.createClientSite;
    }

    case 'update_client': {
      const mutation = `
        mutation updateClient($input: UpdateClientInput!) {
          updateClient(input: $input) {
            ${CLIENT_FIELDS}
          }
        }
      `;

      const input = {
        accountId: args.accountId
      };

      // Optional update fields
      if (args.name) input.name = args.name;
      if (args.stage) input.stage = args.stage;
      if (args.status) input.status = args.status;
      if (args.emailDomains) input.emailDomains = args.emailDomains;
      if (args.accountManagerId) {
        input.accountManager = { userId: args.accountManagerId };
      }
      if (args.primaryContactId) {
        input.primaryContact = { userId: args.primaryContactId };
      }
      if (args.secondaryContactId) {
        input.secondaryContact = { userId: args.secondaryContactId };
      }
      if (args.hqSiteId) {
        input.hqSite = { id: args.hqSiteId };
      }
      if (args.addTechnicianGroupIds) {
        input.addTechnicianGroups = args.addTechnicianGroupIds.map(id => ({ groupId: id }));
      }
      if (args.deleteTechnicianGroupIds) {
        input.deleteTechnicianGroups = args.deleteTechnicianGroupIds.map(id => ({ groupId: id }));
      }
      if (args.customFields) input.customFields = args.customFields;

      const result = await client.execute(mutation, { input });
      return result.updateClient;
    }

    case 'update_client_user': {
      const mutation = `
        mutation updateClientUser($input: UpdateClientUserInput!) {
          updateClientUser(input: $input) {
            ${CLIENT_USER_FIELDS}
          }
        }
      `;

      const input = {
        userId: args.userId
      };

      // Optional update fields
      if (args.firstName) input.firstName = args.firstName;
      if (args.lastName) input.lastName = args.lastName;
      if (args.email) input.email = args.email;
      if (args.contactNumber) input.contactNumber = args.contactNumber;
      if (args.reportingManagerId) {
        input.reportingManager = { userId: args.reportingManagerId };
      }
      if (args.siteId) {
        input.site = { id: args.siteId };
      }
      if (args.roleId) {
        input.role = { roleId: args.roleId };
      }
      if (args.customFields) input.customFields = args.customFields;

      const result = await client.execute(mutation, { input });
      return result.updateClientUser;
    }

    case 'search_contacts': {
      const query = `
        query getClientUserList($input: GetClientUserListInput!) {
          getClientUserList(input: $input) {
            userList {
              ${CLIENT_USER_FIELDS}
            }
            listInfo {
              page
              pageSize
              totalCount
            }
          }
        }
      `;

      // Search by name or email using contains operator
      const input = {
        listInfo: {
          page: args.page || 1,
          pageSize: Math.min(args.pageSize || 50, 100),
          condition: {
            attribute: 'name',
            operator: 'contains',
            value: args.search
          }
        }
      };

      const result = await client.execute(query, { input });
      return {
        users: result.getClientUserList.userList,
        pagination: result.getClientUserList.listInfo,
        searchTerm: args.search
      };
    }

    // ==================== Alert Tools ====================

    case 'get_alerts': {
      const query = `
        query getAlertList($input: ListInfoInput!) {
          getAlertList(input: $input) {
            alerts {
              ${ALERT_FIELDS}
            }
            listInfo {
              page
              pageSize
              totalCount
            }
          }
        }
      `;

      const input = {
        page: args.page || 1,
        pageSize: Math.min(args.pageSize || 50, 100)
      };

      // Build condition for filtering
      if (args.status) {
        input.condition = {
          attribute: 'status',
          operator: 'is',
          value: args.status
        };
      } else if (args.severity) {
        input.condition = {
          attribute: 'severity',
          operator: 'is',
          value: args.severity
        };
      }

      const result = await client.execute(query, { input });
      return {
        alerts: result.getAlertList.alerts,
        pagination: result.getAlertList.listInfo
      };
    }

    case 'get_asset_alerts': {
      const query = `
        query getAlertsForAsset($input: AssetDetailsListInput!) {
          getAlertsForAsset(input: $input) {
            alerts {
              ${ALERT_FIELDS}
            }
            listInfo {
              page
              pageSize
              totalCount
            }
          }
        }
      `;

      const input = {
        assetId: args.assetId,
        listInfo: {
          page: args.page || 1,
          pageSize: Math.min(args.pageSize || 50, 100)
        }
      };

      const result = await client.execute(query, { input });
      return {
        alerts: result.getAlertsForAsset.alerts,
        pagination: result.getAlertsForAsset.listInfo
      };
    }

    case 'resolve_alerts': {
      const mutation = `
        mutation resolveAlerts($input: [ResolveAlertInput]) {
          resolveAlerts(input: $input)
        }
      `;

      const input = args.alertIds.map(id => ({ id }));

      const result = await client.execute(mutation, { input });
      return {
        success: result.resolveAlerts,
        resolvedCount: args.alertIds.length,
        alertIds: args.alertIds
      };
    }

    case 'create_alert': {
      const mutation = `
        mutation createAlert($input: CreateAlertInput!) {
          createAlert(input: $input) {
            ${ALERT_FIELDS}
          }
        }
      `;

      const input = {
        assetId: args.assetId,
        message: args.message
      };

      if (args.description) input.description = args.description;
      if (args.severity) input.severity = args.severity;

      const result = await client.execute(mutation, { input });
      return result.createAlert;
    }

    default:
      throw new Error(`Unknown client tool: ${name}`);
  }
}
