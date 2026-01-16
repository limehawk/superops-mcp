#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { SuperOpsClient, SuperOpsAPIError } from './client.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER_NAME = 'superops-msp';
const SERVER_VERSION = '1.0.0';
const PRODUCT_NAME = 'SuperOps MSP';

// API data cache
let apiData = null;

// API client (lazy initialization)
let client = null;

function getClient() {
    if (!client && process.env.SUPEROPS_API_KEY && process.env.SUPEROPS_SUBDOMAIN) {
        client = new SuperOpsClient({
            apiKey: process.env.SUPEROPS_API_KEY,
            subdomain: process.env.SUPEROPS_SUBDOMAIN,
            region: process.env.SUPEROPS_REGION,
            timeout: parseInt(process.env.SUPEROPS_TIMEOUT) || undefined,
            readOnly: process.env.SUPEROPS_READ_ONLY === 'true'
        });
    }
    return client;
}

async function loadApiData() {
    if (apiData) return apiData;

    try {
        const indexPath = join(__dirname, '..', 'docs', 'api-index.json');
        const content = await readFile(indexPath, 'utf-8');
        apiData = JSON.parse(content);
        return apiData;
    } catch (error) {
        throw new Error(`Failed to load API data: ${error.message}`);
    }
}

// Create server
const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
        instructions: 'Use this server when the user needs help with the SuperOps MSP GraphQL API for managed service providers. Provides documentation for tickets, assets, clients, sites, contracts, billing, runbooks, and other MSP operations. Search for API queries, mutations, and type definitions.',
        capabilities: { tools: {} }
    }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'search_superops_api',
                description: `Search the ${PRODUCT_NAME} API documentation for queries, mutations, and types`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'Search term to find in operation names, descriptions, and types'
                        }
                    },
                    required: ['query']
                }
            },
            {
                name: 'get_superops_operation',
                description: `Get full details of a specific ${PRODUCT_NAME} API query or mutation`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Name of the query or mutation (e.g., "getTicket", "createClient")'
                        }
                    },
                    required: ['name']
                }
            },
            {
                name: 'get_superops_type',
                description: `Get full details of a ${PRODUCT_NAME} API type definition`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Name of the type (e.g., "Ticket", "Client", "Asset")'
                        }
                    },
                    required: ['name']
                }
            },
            {
                name: 'list_superops_operations',
                description: `List all available ${PRODUCT_NAME} API operations`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            enum: ['queries', 'mutations', 'all'],
                            description: 'Type of operations to list'
                        }
                    },
                    required: ['type']
                }
            },
            {
                name: 'execute_graphql',
                description: `Execute a GraphQL query or mutation against the ${PRODUCT_NAME} API. Requires SUPEROPS_API_KEY environment variable.

IMPORTANT: Before constructing queries, you MUST look up the correct field names and syntax:
1. Call get_superops_operation to get the query template and see the input type name
2. Call get_superops_type for the input type (e.g., ListInfoInput) to see exact field names (pageSize not limit)
3. Call get_superops_type for any nested types (e.g., SortInput, SortOrder) to see enum values (use DESC not "desc")
4. Call get_superops_type for the return type (e.g., Ticket, Client) to see available fields (accountId not id)

Do NOT guess field names - they are non-standard. Always look them up first.`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        operation: {
                            type: 'string',
                            description: 'The GraphQL query or mutation to execute'
                        },
                        variables: {
                            type: 'object',
                            description: 'Variables for the operation (optional)'
                        }
                    },
                    required: ['operation']
                }
            }
        ]
    };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        const data = await loadApiData();

        switch (name) {
            case 'search_superops_api': {
                const query = args.query.toLowerCase();
                const results = {
                    queries: [],
                    mutations: [],
                    types: []
                };

                for (const op of data.queries) {
                    if (op.name.toLowerCase().includes(query) ||
                        op.description?.toLowerCase().includes(query)) {
                        results.queries.push({
                            name: op.name,
                            description: op.description,
                            returns: op.returns
                        });
                    }
                }

                for (const op of data.mutations) {
                    if (op.name.toLowerCase().includes(query) ||
                        op.description?.toLowerCase().includes(query)) {
                        results.mutations.push({
                            name: op.name,
                            description: op.description,
                            returns: op.returns
                        });
                    }
                }

                for (const type of data.types) {
                    if (type.name.toLowerCase().includes(query) ||
                        type.description?.toLowerCase().includes(query)) {
                        results.types.push({
                            name: type.name,
                            kind: type.kind,
                            description: type.description
                        });
                    }
                }

                const total = results.queries.length + results.mutations.length + results.types.length;
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            searchTerm: args.query,
                            totalResults: total,
                            results
                        }, null, 2)
                    }]
                };
            }

            case 'get_superops_operation': {
                const opName = args.name.toLowerCase();

                let operation = data.queries.find(q => q.name.toLowerCase() === opName);
                if (!operation) {
                    operation = data.mutations.find(m => m.name.toLowerCase() === opName);
                }

                if (!operation) {
                    return {
                        content: [{
                            type: 'text',
                            text: `Operation "${args.name}" not found. Use search_superops_api to find available operations.`
                        }],
                        isError: true
                    };
                }

                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify(operation, null, 2)
                    }]
                };
            }

            case 'get_superops_type': {
                const typeName = args.name.toLowerCase();
                const type = data.types.find(t => t.name.toLowerCase() === typeName);

                if (!type) {
                    return {
                        content: [{
                            type: 'text',
                            text: `Type "${args.name}" not found. Use search_superops_api to find available types.`
                        }],
                        isError: true
                    };
                }

                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify(type, null, 2)
                    }]
                };
            }

            case 'list_superops_operations': {
                const listType = args.type;
                let result = {};

                if (listType === 'queries' || listType === 'all') {
                    result.queries = data.queries.map(q => ({
                        name: q.name,
                        description: q.description
                    }));
                }

                if (listType === 'mutations' || listType === 'all') {
                    result.mutations = data.mutations.map(m => ({
                        name: m.name,
                        description: m.description
                    }));
                }

                result.meta = data.meta;

                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }]
                };
            }

            case 'execute_graphql': {
                const apiClient = getClient();

                if (!apiClient) {
                    return {
                        content: [{
                            type: 'text',
                            text: 'API execution requires SUPEROPS_API_KEY and SUPEROPS_SUBDOMAIN environment variables.\n\nGet your API key from SuperOps Admin > API Settings.\nYour subdomain is the prefix in your SuperOps URL (e.g., "acme" from acme.superops.ai).'
                        }],
                        isError: true
                    };
                }

                try {
                    const result = await apiClient.execute(
                        args.operation,
                        args.variables || {}
                    );

                    return {
                        content: [{
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }]
                    };
                } catch (error) {
                    let message;

                    if (error instanceof SuperOpsAPIError) {
                        if (error.isAuthError()) {
                            message = 'Authentication failed. Check your SUPEROPS_API_KEY.';
                        } else if (error.isRateLimited()) {
                            message = 'Rate limited after retries. Try again later.';
                        } else if (error.isGraphQLError()) {
                            message = `GraphQL Error: ${error.message}`;
                        } else {
                            message = `API Error (${error.status}): ${error.message}`;
                        }
                    } else {
                        message = error.message;
                    }

                    return {
                        content: [{ type: 'text', text: message }],
                        isError: true
                    };
                }
            }

            default:
                return {
                    content: [{
                        type: 'text',
                        text: `Unknown tool: ${name}`
                    }],
                    isError: true
                };
        }
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: `Error: ${error.message}`
            }],
            isError: true
        };
    }
});

// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch(console.error);
