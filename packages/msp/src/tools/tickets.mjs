/**
 * Ticket Queue Management and Ticket Actions Tools
 *
 * 19 tools for managing SuperOps MSP tickets:
 * - 8 query tools for viewing/filtering tickets
 * - 11 mutation tools for ticket actions
 */

// ============================================================================
// Constants
// ============================================================================

// Non-closed statuses for filtering open tickets
// Note: SuperOps API doesn't support "is not" operator, so we use "includes" with all non-closed statuses
const NON_CLOSED_STATUSES = ['Open', 'On Hold', 'On-Site', 'Waiting on third party', 'Abandoned', 'Resolved'];

// ============================================================================
// GraphQL Fragments and Queries
// ============================================================================

const TICKET_FIELDS = `
  ticketId
  displayId
  subject
  ticketType
  requestType
  source
  client
  site
  requester
  additionalRequester
  followers
  techGroup
  technician
  status
  priority
  impact
  urgency
  category
  subcategory
  cause
  subcause
  resolutionCode
  sla
  createdTime
  updatedTime
  firstResponseDueTime
  firstResponseTime
  firstResponseViolated
  resolutionDueTime
  resolutionTime
  resolutionViolated
  customFields
  worklogTimespent
`;

const GET_TICKET_QUERY = `
  query getTicket($input: TicketIdentifierInput!) {
    getTicket(input: $input) {
      ${TICKET_FIELDS}
    }
  }
`;

const GET_TICKET_LIST_QUERY = `
  query getTicketList($input: ListInfoInput!) {
    getTicketList(input: $input) {
      tickets {
        ${TICKET_FIELDS}
      }
      listInfo {
        page
        pageSize
        totalCount
        hasMore
      }
    }
  }
`;

const GET_TICKET_CONVERSATION_LIST_QUERY = `
  query getTicketConversationList($input: TicketIdentifierInput!) {
    getTicketConversationList(input: $input) {
      conversationId
      content
      time
      user
      toUsers {
        userId
        name
        email
      }
      ccUsers {
        userId
        name
        email
      }
      bccUsers {
        userId
        name
        email
      }
      attachments {
        name
        size
        downloadUrl
      }
      type
    }
  }
`;

const GET_TICKET_NOTE_LIST_QUERY = `
  query getTicketNoteList($input: TicketIdentifierInput!) {
    getTicketNoteList(input: $input) {
      noteId
      addedBy
      addedOn
      content
      attachments {
        name
        size
        downloadUrl
      }
      privacyType
    }
  }
`;

const CREATE_TICKET_MUTATION = `
  mutation createTicket($input: CreateTicketInput!) {
    createTicket(input: $input) {
      ${TICKET_FIELDS}
    }
  }
`;

const UPDATE_TICKET_MUTATION = `
  mutation updateTicket($input: UpdateTicketInput!) {
    updateTicket(input: $input) {
      ${TICKET_FIELDS}
    }
  }
`;

const CREATE_TICKET_CONVERSATION_MUTATION = `
  mutation createTicketConversation($input: CreateTicketConversationInput!) {
    createTicketConversation(input: $input) {
      conversationId
      content
      time
      user
      toUsers {
        userId
        name
        email
      }
      ccUsers {
        userId
        name
        email
      }
      bccUsers {
        userId
        name
        email
      }
      attachments {
        name
        size
        downloadUrl
      }
      type
    }
  }
`;

const CREATE_TICKET_NOTE_MUTATION = `
  mutation createTicketNote($input: CreateTicketNoteInput!) {
    createTicketNote(input: $input) {
      noteId
      addedBy
      addedOn
      content
      attachments {
        name
        size
        downloadUrl
      }
      privacyType
    }
  }
`;

const SOFT_DELETE_TICKETS_MUTATION = `
  mutation softDeleteTickets($input: [TicketIdentifierInput]) {
    softDeleteTickets(input: $input)
  }
`;

// ============================================================================
// Tool Definitions
// ============================================================================

export const ticketTools = [
  // -------------------------------------------------------------------------
  // Ticket Queue Management (8 tools)
  // -------------------------------------------------------------------------
  {
    name: 'get_ticket',
    description: 'Get full details of a specific ticket by ID. Returns all ticket fields including status, priority, assignee, SLA info, and custom fields.',
    inputSchema: {
      type: 'object',
      properties: {
        ticketId: {
          type: 'string',
          description: 'The ID of the ticket to retrieve'
        }
      },
      required: ['ticketId']
    }
  },
  {
    name: 'get_open_tickets',
    description: 'List open tickets with optional filters. Returns tickets that are not closed, with pagination support.',
    inputSchema: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'Filter by client account ID'
        },
        technicianId: {
          type: 'string',
          description: 'Filter by assigned technician user ID'
        },
        priority: {
          type: 'string',
          description: 'Filter by priority level (e.g., "High", "Medium", "Low")'
        },
        createdAfter: {
          type: 'string',
          description: 'Filter tickets created after this date (ISO 8601 format, e.g., "2024-01-15T00:00:00")'
        },
        createdBefore: {
          type: 'string',
          description: 'Filter tickets created before this date (ISO 8601 format)'
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)'
        },
        pageSize: {
          type: 'number',
          description: 'Number of tickets per page (default: 25, max: 100)'
        }
      }
    }
  },
  {
    name: 'get_my_tickets',
    description: 'Get tickets assigned to a specific technician. Useful for viewing a technician\'s workload.',
    inputSchema: {
      type: 'object',
      properties: {
        technicianId: {
          type: 'string',
          description: 'The user ID of the technician'
        },
        technicianEmail: {
          type: 'string',
          description: 'The email of the technician (alternative to technicianId)'
        },
        includeFollowed: {
          type: 'boolean',
          description: 'Include tickets where the technician is a follower (default: false)'
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)'
        },
        pageSize: {
          type: 'number',
          description: 'Number of tickets per page (default: 25, max: 100)'
        }
      }
    }
  },
  {
    name: 'get_new_tickets',
    description: 'Get tickets created within the last N hours. Useful for monitoring incoming ticket volume.',
    inputSchema: {
      type: 'object',
      properties: {
        hours: {
          type: 'number',
          description: 'Number of hours to look back (default: 24)'
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)'
        },
        pageSize: {
          type: 'number',
          description: 'Number of tickets per page (default: 25, max: 100)'
        }
      }
    }
  },
  {
    name: 'get_urgent_tickets',
    description: 'Get high priority tickets or tickets that have violated/are about to violate SLA. Useful for identifying critical issues.',
    inputSchema: {
      type: 'object',
      properties: {
        includeHighPriority: {
          type: 'boolean',
          description: 'Include tickets with High priority (default: true)'
        },
        includeSLAViolated: {
          type: 'boolean',
          description: 'Include tickets that have violated SLA (default: true)'
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)'
        },
        pageSize: {
          type: 'number',
          description: 'Number of tickets per page (default: 25, max: 100)'
        }
      }
    }
  },
  {
    name: 'get_tickets_by_client',
    description: 'Get all tickets for a specific client. Useful for viewing client history and open issues.',
    inputSchema: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'The account ID of the client'
        },
        status: {
          type: 'string',
          description: 'Filter by ticket status (e.g., "New", "Open", "Closed")'
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)'
        },
        pageSize: {
          type: 'number',
          description: 'Number of tickets per page (default: 25, max: 100)'
        }
      },
      required: ['clientId']
    }
  },
  {
    name: 'get_ticket_conversation',
    description: 'Get the full conversation thread of a ticket. Returns all messages between requester and technicians.',
    inputSchema: {
      type: 'object',
      properties: {
        ticketId: {
          type: 'string',
          description: 'The ID of the ticket'
        }
      },
      required: ['ticketId']
    }
  },
  {
    name: 'get_ticket_notes',
    description: 'Get internal notes on a ticket. Notes can be public (visible to requester) or private (internal only).',
    inputSchema: {
      type: 'object',
      properties: {
        ticketId: {
          type: 'string',
          description: 'The ID of the ticket'
        }
      },
      required: ['ticketId']
    }
  },

  // -------------------------------------------------------------------------
  // Ticket Actions (11 tools)
  // -------------------------------------------------------------------------
  {
    name: 'create_ticket',
    description: 'Create a new ticket. Requires at minimum a subject and client. Returns the created ticket with its new ID.',
    inputSchema: {
      type: 'object',
      properties: {
        subject: {
          type: 'string',
          description: 'The subject/title of the ticket'
        },
        description: {
          type: 'string',
          description: 'Detailed description of the issue'
        },
        clientId: {
          type: 'string',
          description: 'The account ID of the client'
        },
        requesterId: {
          type: 'string',
          description: 'The user ID of the requester (client user)'
        },
        technicianId: {
          type: 'string',
          description: 'The user ID of the technician to assign'
        },
        techGroupId: {
          type: 'string',
          description: 'The group ID of the technician group to assign'
        },
        status: {
          type: 'string',
          description: 'Initial status (default: "New")'
        },
        priority: {
          type: 'string',
          description: 'Priority level (e.g., "High", "Medium", "Low")'
        },
        category: {
          type: 'string',
          description: 'Ticket category'
        },
        subcategory: {
          type: 'string',
          description: 'Ticket subcategory'
        },
        impact: {
          type: 'string',
          description: 'Impact level'
        },
        urgency: {
          type: 'string',
          description: 'Urgency level'
        },
        source: {
          type: 'string',
          enum: ['FORM', 'AGENT', 'EMAIL', 'AI', 'PHONE', 'INTEGRATION'],
          description: 'Creation source (default: "FORM")'
        },
        customFields: {
          type: 'object',
          description: 'Custom field values as key-value pairs'
        }
      },
      required: ['subject', 'clientId']
    }
  },
  {
    name: 'reply_to_ticket',
    description: 'Send a reply to the ticket requester. Can optionally send an email notification.',
    inputSchema: {
      type: 'object',
      properties: {
        ticketId: {
          type: 'string',
          description: 'The ID of the ticket'
        },
        content: {
          type: 'string',
          description: 'The reply content (supports HTML)'
        },
        sendMail: {
          type: 'boolean',
          description: 'Send email notification to requester (default: true)'
        },
        ccEmails: {
          type: 'array',
          items: { type: 'string' },
          description: 'Email addresses to CC on the reply'
        }
      },
      required: ['ticketId', 'content']
    }
  },
  {
    name: 'add_ticket_note',
    description: 'Add an internal or public note to a ticket. Private notes are only visible to technicians.',
    inputSchema: {
      type: 'object',
      properties: {
        ticketId: {
          type: 'string',
          description: 'The ID of the ticket'
        },
        content: {
          type: 'string',
          description: 'The note content'
        },
        privacyType: {
          type: 'string',
          enum: ['PUBLIC', 'PRIVATE'],
          description: 'Note visibility (default: "PRIVATE")'
        }
      },
      required: ['ticketId', 'content']
    }
  },
  {
    name: 'update_ticket_status',
    description: 'Change the status of a ticket (e.g., New, Open, Pending, Resolved, Closed).',
    inputSchema: {
      type: 'object',
      properties: {
        ticketId: {
          type: 'string',
          description: 'The ID of the ticket'
        },
        status: {
          type: 'string',
          description: 'The new status value'
        }
      },
      required: ['ticketId', 'status']
    }
  },
  {
    name: 'update_ticket_priority',
    description: 'Change the priority of a ticket (e.g., High, Medium, Low).',
    inputSchema: {
      type: 'object',
      properties: {
        ticketId: {
          type: 'string',
          description: 'The ID of the ticket'
        },
        priority: {
          type: 'string',
          description: 'The new priority value'
        }
      },
      required: ['ticketId', 'priority']
    }
  },
  {
    name: 'update_ticket_category',
    description: 'Change the category and/or subcategory of a ticket.',
    inputSchema: {
      type: 'object',
      properties: {
        ticketId: {
          type: 'string',
          description: 'The ID of the ticket'
        },
        category: {
          type: 'string',
          description: 'The new category'
        },
        subcategory: {
          type: 'string',
          description: 'The new subcategory'
        }
      },
      required: ['ticketId']
    }
  },
  {
    name: 'assign_ticket',
    description: 'Assign a ticket to a technician and/or technician group.',
    inputSchema: {
      type: 'object',
      properties: {
        ticketId: {
          type: 'string',
          description: 'The ID of the ticket'
        },
        technicianId: {
          type: 'string',
          description: 'The user ID of the technician to assign'
        },
        techGroupId: {
          type: 'string',
          description: 'The group ID of the technician group to assign'
        }
      },
      required: ['ticketId']
    }
  },
  {
    name: 'change_ticket_requester',
    description: 'Change who the ticket is for (the requester).',
    inputSchema: {
      type: 'object',
      properties: {
        ticketId: {
          type: 'string',
          description: 'The ID of the ticket'
        },
        requesterId: {
          type: 'string',
          description: 'The user ID of the new requester'
        }
      },
      required: ['ticketId', 'requesterId']
    }
  },
  {
    name: 'add_ticket_follower',
    description: 'Add a technician as a follower on a ticket. Followers receive notifications about ticket updates.',
    inputSchema: {
      type: 'object',
      properties: {
        ticketId: {
          type: 'string',
          description: 'The ID of the ticket'
        },
        technicianId: {
          type: 'string',
          description: 'The user ID of the technician to add as follower'
        }
      },
      required: ['ticketId', 'technicianId']
    }
  },
  {
    name: 'close_ticket',
    description: 'Close a ticket with an optional resolution code. Sets status to "Closed" and records the resolution.',
    inputSchema: {
      type: 'object',
      properties: {
        ticketId: {
          type: 'string',
          description: 'The ID of the ticket'
        },
        resolutionCode: {
          type: 'string',
          description: 'Resolution code (e.g., "Permanent Fix", "Workaround", "Unable to Reproduce")'
        },
        suppressNotification: {
          type: 'boolean',
          description: 'Suppress the close notification email (default: false)'
        }
      },
      required: ['ticketId']
    }
  },
  {
    name: 'delete_ticket',
    description: 'Soft delete (trash) a ticket. The ticket can be restored from trash in SuperOps.',
    inputSchema: {
      type: 'object',
      properties: {
        ticketId: {
          type: 'string',
          description: 'The ID of the ticket to delete'
        }
      },
      required: ['ticketId']
    }
  }
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build a condition for date range filtering
 */
function buildDateCondition(attribute, operator, value) {
  return {
    attribute,
    operator,
    value
  };
}

/**
 * Build ListInfoInput with conditions
 */
function buildListInput({ page = 1, pageSize = 25, conditions = [], sort = [] }) {
  const input = {
    page,
    pageSize: Math.min(pageSize, 100)
  };

  if (conditions.length === 1) {
    input.condition = conditions[0];
  } else if (conditions.length > 1) {
    // Multiple conditions need AND logic
    input.condition = {
      operator: 'AND',
      value: conditions
    };
  }

  if (sort.length > 0) {
    input.sort = sort;
  }

  return input;
}

/**
 * Calculate ISO date string for N hours ago
 */
function hoursAgo(hours) {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString().replace('Z', '');
}

/**
 * Format ticket for human-readable output
 */
function formatTicket(ticket) {
  return {
    id: ticket.ticketId,
    displayId: ticket.displayId,
    subject: ticket.subject,
    status: ticket.status,
    priority: ticket.priority,
    client: ticket.client?.name || ticket.client,
    requester: ticket.requester?.name || ticket.requester,
    technician: ticket.technician?.name || ticket.technician,
    techGroup: ticket.techGroup?.name || ticket.techGroup,
    category: ticket.category,
    subcategory: ticket.subcategory,
    createdTime: ticket.createdTime,
    updatedTime: ticket.updatedTime,
    sla: ticket.sla?.name || ticket.sla,
    firstResponseViolated: ticket.firstResponseViolated,
    resolutionViolated: ticket.resolutionViolated,
    source: ticket.source
  };
}

/**
 * Format ticket list response
 */
function formatTicketListResponse(data, toolName) {
  const { tickets, listInfo } = data.getTicketList;
  return {
    tickets: tickets.map(formatTicket),
    pagination: {
      page: listInfo.page,
      pageSize: listInfo.pageSize,
      totalCount: listInfo.totalCount,
      hasMore: listInfo.hasMore
    },
    _meta: { tool: toolName }
  };
}

// ============================================================================
// Tool Handler
// ============================================================================

/**
 * Check if a tool name belongs to this module
 */
export function isTicketTool(name) {
  return ticketTools.some(t => t.name === name);
}

/**
 * Handle ticket tool calls
 * @param {string} name - Tool name
 * @param {object} args - Tool arguments
 * @param {object} client - SuperOpsClient instance
 * @returns {Promise<object>} Tool result
 */
export async function handleTicketTool(name, args, client) {
  switch (name) {
    // -----------------------------------------------------------------------
    // Ticket Queue Management
    // -----------------------------------------------------------------------
    case 'get_ticket': {
      const data = await client.execute(GET_TICKET_QUERY, {
        input: { ticketId: args.ticketId }
      });

      if (!data.getTicket) {
        return {
          error: true,
          message: `Ticket ${args.ticketId} not found`
        };
      }

      return {
        ticket: data.getTicket,
        _meta: { tool: 'get_ticket' }
      };
    }

    case 'get_open_tickets': {
      const conditions = [];

      // Filter to non-closed tickets
      conditions.push({
        attribute: 'status',
        operator: 'includes',
        value: NON_CLOSED_STATUSES
      });

      if (args.clientId) {
        conditions.push({
          attribute: 'client.accountId',
          operator: 'is',
          value: args.clientId
        });
      }

      if (args.technicianId) {
        conditions.push({
          attribute: 'technician.userId',
          operator: 'is',
          value: args.technicianId
        });
      }

      if (args.priority) {
        conditions.push({
          attribute: 'priority',
          operator: 'is',
          value: args.priority
        });
      }

      if (args.createdAfter) {
        conditions.push({
          attribute: 'createdTime',
          operator: 'greater than',
          value: args.createdAfter
        });
      }

      if (args.createdBefore) {
        conditions.push({
          attribute: 'createdTime',
          operator: 'less than',
          value: args.createdBefore
        });
      }

      const input = buildListInput({
        page: args.page,
        pageSize: args.pageSize,
        conditions,
        sort: [{ attribute: 'createdTime', order: 'DESC' }]
      });

      const data = await client.execute(GET_TICKET_LIST_QUERY, { input });
      return formatTicketListResponse(data, 'get_open_tickets');
    }

    case 'get_my_tickets': {
      const conditions = [];

      // Filter by technician
      if (args.technicianId) {
        conditions.push({
          attribute: 'technician.userId',
          operator: 'is',
          value: args.technicianId
        });
      } else if (args.technicianEmail) {
        conditions.push({
          attribute: 'technician.email',
          operator: 'is',
          value: args.technicianEmail
        });
      } else {
        return {
          error: true,
          message: 'Either technicianId or technicianEmail is required'
        };
      }

      // Filter to non-closed tickets by default
      conditions.push({
        attribute: 'status',
        operator: 'includes',
        value: NON_CLOSED_STATUSES
      });

      const input = buildListInput({
        page: args.page,
        pageSize: args.pageSize,
        conditions,
        sort: [{ attribute: 'updatedTime', order: 'DESC' }]
      });

      const data = await client.execute(GET_TICKET_LIST_QUERY, { input });
      return formatTicketListResponse(data, 'get_my_tickets');
    }

    case 'get_new_tickets': {
      const hours = args.hours || 24;
      const sinceDate = hoursAgo(hours);

      const conditions = [{
        attribute: 'createdTime',
        operator: 'greater than',
        value: sinceDate
      }];

      const input = buildListInput({
        page: args.page,
        pageSize: args.pageSize,
        conditions,
        sort: [{ attribute: 'createdTime', order: 'DESC' }]
      });

      const data = await client.execute(GET_TICKET_LIST_QUERY, { input });
      const result = formatTicketListResponse(data, 'get_new_tickets');
      result.timeRange = {
        hours,
        since: sinceDate
      };
      return result;
    }

    case 'get_urgent_tickets': {
      const includeHighPriority = args.includeHighPriority !== false;
      const includeSLAViolated = args.includeSLAViolated !== false;

      const orConditions = [];

      if (includeHighPriority) {
        orConditions.push({
          attribute: 'priority',
          operator: 'is',
          value: 'High'
        });
      }

      if (includeSLAViolated) {
        orConditions.push({
          attribute: 'firstResponseViolated',
          operator: 'is',
          value: true
        });
        orConditions.push({
          attribute: 'resolutionViolated',
          operator: 'is',
          value: true
        });
      }

      if (orConditions.length === 0) {
        return {
          error: true,
          message: 'At least one filter (includeHighPriority or includeSLAViolated) must be true'
        };
      }

      // Filter to non-closed tickets
      const conditions = [
        {
          attribute: 'status',
          operator: 'includes',
          value: NON_CLOSED_STATUSES
        },
        {
          operator: 'OR',
          value: orConditions
        }
      ];

      const input = buildListInput({
        page: args.page,
        pageSize: args.pageSize,
        conditions,
        sort: [{ attribute: 'createdTime', order: 'DESC' }]
      });

      const data = await client.execute(GET_TICKET_LIST_QUERY, { input });
      return formatTicketListResponse(data, 'get_urgent_tickets');
    }

    case 'get_tickets_by_client': {
      const conditions = [{
        attribute: 'client.accountId',
        operator: 'is',
        value: args.clientId
      }];

      if (args.status) {
        conditions.push({
          attribute: 'status',
          operator: 'is',
          value: args.status
        });
      }

      const input = buildListInput({
        page: args.page,
        pageSize: args.pageSize,
        conditions,
        sort: [{ attribute: 'createdTime', order: 'DESC' }]
      });

      const data = await client.execute(GET_TICKET_LIST_QUERY, { input });
      return formatTicketListResponse(data, 'get_tickets_by_client');
    }

    case 'get_ticket_conversation': {
      const data = await client.execute(GET_TICKET_CONVERSATION_LIST_QUERY, {
        input: { ticketId: args.ticketId }
      });

      const conversations = data.getTicketConversationList || [];
      return {
        ticketId: args.ticketId,
        conversationCount: conversations.length,
        conversations: conversations.map(c => ({
          id: c.conversationId,
          content: c.content,
          time: c.time,
          user: c.user,
          type: c.type,
          toUsers: c.toUsers,
          ccUsers: c.ccUsers,
          attachments: c.attachments
        })),
        _meta: { tool: 'get_ticket_conversation' }
      };
    }

    case 'get_ticket_notes': {
      const data = await client.execute(GET_TICKET_NOTE_LIST_QUERY, {
        input: { ticketId: args.ticketId }
      });

      const notes = data.getTicketNoteList || [];
      return {
        ticketId: args.ticketId,
        noteCount: notes.length,
        notes: notes.map(n => ({
          id: n.noteId,
          content: n.content,
          addedBy: n.addedBy,
          addedOn: n.addedOn,
          privacyType: n.privacyType,
          attachments: n.attachments
        })),
        _meta: { tool: 'get_ticket_notes' }
      };
    }

    // -----------------------------------------------------------------------
    // Ticket Actions
    // -----------------------------------------------------------------------
    case 'create_ticket': {
      const input = {
        subject: args.subject,
        client: { accountId: args.clientId },
        source: args.source || 'FORM'
      };

      if (args.description) {
        input.description = args.description;
      }

      if (args.requesterId) {
        input.requester = { userId: args.requesterId };
      }

      if (args.technicianId) {
        input.technician = { userId: args.technicianId };
      }

      if (args.techGroupId) {
        input.techGroup = { groupId: args.techGroupId };
      }

      if (args.status) {
        input.status = args.status;
      }

      if (args.priority) {
        input.priority = args.priority;
      }

      if (args.category) {
        input.category = args.category;
      }

      if (args.subcategory) {
        input.subcategory = args.subcategory;
      }

      if (args.impact) {
        input.impact = args.impact;
      }

      if (args.urgency) {
        input.urgency = args.urgency;
      }

      if (args.customFields) {
        input.customFields = args.customFields;
      }

      const data = await client.execute(CREATE_TICKET_MUTATION, { input });

      return {
        success: true,
        message: `Ticket ${data.createTicket.displayId} created successfully`,
        ticket: data.createTicket,
        _meta: { tool: 'create_ticket' }
      };
    }

    case 'reply_to_ticket': {
      const input = {
        ticket: { ticketId: args.ticketId },
        content: args.content,
        sendMail: args.sendMail !== false
      };

      if (args.ccEmails && args.ccEmails.length > 0) {
        input.ccUsers = args.ccEmails.map(email => ({ email }));
      }

      const data = await client.execute(CREATE_TICKET_CONVERSATION_MUTATION, { input });

      return {
        success: true,
        message: 'Reply sent successfully',
        conversation: data.createTicketConversation,
        emailSent: input.sendMail,
        _meta: { tool: 'reply_to_ticket' }
      };
    }

    case 'add_ticket_note': {
      const input = {
        ticket: { ticketId: args.ticketId },
        content: args.content,
        privacyType: args.privacyType || 'PRIVATE'
      };

      const data = await client.execute(CREATE_TICKET_NOTE_MUTATION, { input });

      return {
        success: true,
        message: `${input.privacyType} note added successfully`,
        note: data.createTicketNote,
        _meta: { tool: 'add_ticket_note' }
      };
    }

    case 'update_ticket_status': {
      const input = {
        ticketId: args.ticketId,
        status: args.status
      };

      const data = await client.execute(UPDATE_TICKET_MUTATION, { input });

      return {
        success: true,
        message: `Ticket status updated to "${args.status}"`,
        ticket: formatTicket(data.updateTicket),
        _meta: { tool: 'update_ticket_status' }
      };
    }

    case 'update_ticket_priority': {
      const input = {
        ticketId: args.ticketId,
        priority: args.priority
      };

      const data = await client.execute(UPDATE_TICKET_MUTATION, { input });

      return {
        success: true,
        message: `Ticket priority updated to "${args.priority}"`,
        ticket: formatTicket(data.updateTicket),
        _meta: { tool: 'update_ticket_priority' }
      };
    }

    case 'update_ticket_category': {
      const input = {
        ticketId: args.ticketId
      };

      if (args.category) {
        input.category = args.category;
      }

      if (args.subcategory) {
        input.subcategory = args.subcategory;
      }

      if (!args.category && !args.subcategory) {
        return {
          error: true,
          message: 'At least one of category or subcategory is required'
        };
      }

      const data = await client.execute(UPDATE_TICKET_MUTATION, { input });

      return {
        success: true,
        message: 'Ticket category updated successfully',
        ticket: formatTicket(data.updateTicket),
        _meta: { tool: 'update_ticket_category' }
      };
    }

    case 'assign_ticket': {
      const input = {
        ticketId: args.ticketId
      };

      if (args.technicianId) {
        input.technician = { userId: args.technicianId };
      }

      if (args.techGroupId) {
        input.techGroup = { groupId: args.techGroupId };
      }

      if (!args.technicianId && !args.techGroupId) {
        return {
          error: true,
          message: 'At least one of technicianId or techGroupId is required'
        };
      }

      const data = await client.execute(UPDATE_TICKET_MUTATION, { input });

      const assignedTo = [];
      if (data.updateTicket.technician?.name) {
        assignedTo.push(`technician: ${data.updateTicket.technician.name}`);
      }
      if (data.updateTicket.techGroup?.name) {
        assignedTo.push(`group: ${data.updateTicket.techGroup.name}`);
      }

      return {
        success: true,
        message: `Ticket assigned to ${assignedTo.join(', ')}`,
        ticket: formatTicket(data.updateTicket),
        _meta: { tool: 'assign_ticket' }
      };
    }

    case 'change_ticket_requester': {
      const input = {
        ticketId: args.ticketId,
        requester: { userId: args.requesterId }
      };

      const data = await client.execute(UPDATE_TICKET_MUTATION, { input });

      return {
        success: true,
        message: `Ticket requester changed to ${data.updateTicket.requester?.name || args.requesterId}`,
        ticket: formatTicket(data.updateTicket),
        _meta: { tool: 'change_ticket_requester' }
      };
    }

    case 'add_ticket_follower': {
      const input = {
        ticketId: args.ticketId,
        addFollowers: [{ userId: args.technicianId }]
      };

      const data = await client.execute(UPDATE_TICKET_MUTATION, { input });

      return {
        success: true,
        message: 'Follower added successfully',
        ticket: formatTicket(data.updateTicket),
        _meta: { tool: 'add_ticket_follower' }
      };
    }

    case 'close_ticket': {
      const input = {
        ticketId: args.ticketId,
        status: 'Closed'
      };

      if (args.resolutionCode) {
        input.resolutionCode = args.resolutionCode;
      }

      if (args.suppressNotification) {
        input.suppressCloseNotification = true;
      }

      const data = await client.execute(UPDATE_TICKET_MUTATION, { input });

      return {
        success: true,
        message: `Ticket ${data.updateTicket.displayId} closed${args.resolutionCode ? ` with resolution: ${args.resolutionCode}` : ''}`,
        ticket: formatTicket(data.updateTicket),
        _meta: { tool: 'close_ticket' }
      };
    }

    case 'delete_ticket': {
      const data = await client.execute(SOFT_DELETE_TICKETS_MUTATION, {
        input: [{ ticketId: args.ticketId }]
      });

      return {
        success: data.softDeleteTickets,
        message: data.softDeleteTickets
          ? `Ticket ${args.ticketId} moved to trash`
          : `Failed to delete ticket ${args.ticketId}`,
        _meta: { tool: 'delete_ticket' }
      };
    }

    default:
      return {
        error: true,
        message: `Unknown ticket tool: ${name}`
      };
  }
}
