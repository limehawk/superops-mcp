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

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER_NAME = 'superops-msp';
const SERVER_VERSION = '1.0.0';
const PRODUCT_NAME = 'SuperOps MSP';

// API data cache
let apiData = null;

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
