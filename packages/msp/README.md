# SuperOps MSP MCP Server

An MCP (Model Context Protocol) server that provides AI assistants with access to the SuperOps MSP GraphQL API documentation.

## What is SuperOps MSP?

SuperOps MSP is for **Managed Service Providers** - IT companies that manage technology for multiple client businesses. Key concepts:

- **Multi-tenant**: One MSP serves many clients
- **Client-based**: Data organized by Client → Site → Assets/Tickets
- **Billing included**: Invoice and billing features for client management

## Installation

We recommend using [bun](https://bun.sh) for faster startup times - MCP servers start on every request, so speed matters.

```bash
bunx superops-msp@latest
```

Or with npx:

```bash
npx superops-msp@latest
```

Or install globally:

```bash
bun install -g superops-msp@latest
```

```bash
npm install -g superops-msp@latest
```

## Configuration

### Claude Code

```bash
claude mcp add superops-msp \
  -e SUPEROPS_API_KEY=your-api-key \
  -e SUPEROPS_SUBDOMAIN=your-subdomain \
  -- bunx superops-msp@latest
```

#### Installation Scopes

MCP servers can be configured at three different scopes:

**Local scope** (default) - Private to you, only accessible in the current project:
```bash
claude mcp add superops-msp \
  -e SUPEROPS_API_KEY=your-api-key \
  -e SUPEROPS_SUBDOMAIN=your-subdomain \
  --scope local \
  -- bunx superops-msp@latest
```

**Project scope** - Shared with your team via `.mcp.json` (checked into version control):
```bash
claude mcp add superops-msp \
  -e SUPEROPS_API_KEY=your-api-key \
  -e SUPEROPS_SUBDOMAIN=your-subdomain \
  --scope project \
  -- bunx superops-msp@latest
```

**User scope** - Available across all your projects:
```bash
claude mcp add superops-msp \
  -e SUPEROPS_API_KEY=your-api-key \
  -e SUPEROPS_SUBDOMAIN=your-subdomain \
  --scope user \
  -- bunx superops-msp@latest
```

| Scope | Storage | Best For |
|-------|---------|----------|
| Local | `~/.claude.json` (project path) | Personal servers, sensitive credentials |
| Project | `.mcp.json` in project root | Team collaboration, shared tools |
| User | `~/.claude.json` (global) | Personal utilities across projects |

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "superops-msp": {
      "command": "bunx",
      "args": ["superops-msp@latest"],
      "env": {
        "SUPEROPS_API_KEY": "your-api-key",
        "SUPEROPS_SUBDOMAIN": "your-subdomain"
      }
    }
  }
}
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPEROPS_API_KEY` | Yes | Your SuperOps API key |
| `SUPEROPS_SUBDOMAIN` | Yes | Your subdomain (e.g., `acme` from `acme.superops.ai`) |
| `SUPEROPS_REGION` | No | `us` (default) or `eu` |
| `SUPEROPS_TIMEOUT` | No | Request timeout in ms (default: 30000) |
| `SUPEROPS_READ_ONLY` | No | Set to `true` to block mutations |

Get your API key from **SuperOps Admin > API Settings**.

## Available Tools

### `search_superops_api`

Search the API documentation for queries, mutations, and types.

```
search_superops_api({ query: "ticket" })
```

### `get_superops_operation`

Get full details of a specific query or mutation.

```
get_superops_operation({ name: "getTicket" })
get_superops_operation({ name: "createClient" })
```

### `get_superops_type`

Get full details of a type definition.

```
get_superops_type({ name: "Ticket" })
get_superops_type({ name: "Client" })
```

### `list_superops_operations`

List all available operations.

```
list_superops_operations({ type: "queries" })
list_superops_operations({ type: "mutations" })
list_superops_operations({ type: "all" })
```

### `execute_graphql`

Execute a GraphQL query or mutation against the SuperOps API. Requires environment variables (see [Configuration](#configuration)).

```
execute_graphql({
  operation: "query { getTicket(id: \"123\") { id subject status } }"
})

execute_graphql({
  operation: "mutation createTicket($input: CreateTicketInput!) { createTicket(input: $input) { id } }",
  variables: { input: { subject: "New ticket", clientId: "456" } }
})
```

**API limits and notes:**
- Maximum 800 API requests per minute
- Date/time values must be in UTC timezone with ISO format (e.g., `2022-04-10T10:15:30`)
- Use `null` to clear/reset attribute values

## API Endpoints

- **US**: `https://api.superops.ai/msp`
- **EU**: `https://euapi.superops.ai/msp`

## Example Usage

Once configured, ask Claude:

- "How do I create a ticket in SuperOps?"
- "What fields are available on the Client type?"
- "Search for invoice-related operations"
- "Show me how to update an asset"

## Related

- [superops-it](https://npmjs.com/package/superops-it) - For SuperOps IT Teams (internal IT departments)

## License

MIT
