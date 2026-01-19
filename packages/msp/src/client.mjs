/**
 * SuperOps MSP GraphQL Client
 *
 * Features:
 * - Bearer token authentication
 * - Configurable timeout with AbortController
 * - Exponential backoff retry for transient failures
 * - Read-only mode to block mutations
 * - Handles GraphQL errors returned with 200 status
 */

const DEFAULT_TIMEOUT_MS = 30000;
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

/**
 * Structured error for SuperOps API failures
 */
export class SuperOpsAPIError extends Error {
  constructor(status, body, context = {}) {
    const message = SuperOpsAPIError.formatMessage(status, body);
    super(message);

    this.name = 'SuperOpsAPIError';
    this.status = status;
    this.body = body;
    this.context = context;
  }

  static formatMessage(status, body) {
    if (status === 200 && Array.isArray(body)) {
      // Try to extract message fields first
      const messages = body.map(e => e.message).filter(Boolean);
      if (messages.length > 0) {
        return messages.join('; ');
      }
      // SuperOps sometimes returns null message with details in extensions.clientError
      const clientErrors = body.flatMap(e =>
        e.extensions?.clientError?.map(ce =>
          `${ce.code}: ${ce.param?.attributes?.join(', ') || 'unknown'}`
        ) || []
      );
      if (clientErrors.length > 0) {
        return clientErrors.join('; ');
      }
      // Fallback to full error structure
      return JSON.stringify(body, null, 2);
    }
    return `HTTP ${status}: ${body?.message || body?.error || 'Request failed'}`;
  }

  isRateLimited() { return this.status === 429; }
  isAuthError() { return this.status === 401 || this.status === 403; }
  isServerError() { return this.status >= 500; }
  isGraphQLError() { return this.status === 200 && Array.isArray(this.body); }
  isRetryable() { return this.isRateLimited() || this.isServerError(); }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRetry(fn, maxRetries = MAX_RETRIES) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!(error instanceof SuperOpsAPIError) || !error.isRetryable()) {
        throw error;
      }

      if (attempt < maxRetries - 1) {
        await sleep(RETRY_DELAYS[attempt]);
      }
    }
  }

  throw lastError;
}

export class SuperOpsClient {
  constructor(config) {
    if (!config.apiKey) {
      throw new Error('SUPEROPS_API_KEY is required');
    }
    if (!config.subdomain) {
      throw new Error('SUPEROPS_SUBDOMAIN is required');
    }

    this.apiKey = config.apiKey;
    this.subdomain = config.subdomain;
    this.region = config.region || 'us';
    this.timeout = config.timeout || DEFAULT_TIMEOUT_MS;
    this.readOnly = config.readOnly ?? false;

    const host = this.region === 'eu' ? 'euapi.superops.ai' : 'api.superops.ai';
    this.endpoint = `https://${host}/msp`;
  }

  async execute(operation, variables = {}) {
    if (this.readOnly && operation.trim().toLowerCase().startsWith('mutation')) {
      throw new Error(
        'Mutations are disabled in read-only mode. ' +
        'Set SUPEROPS_READ_ONLY=false to enable mutations.'
      );
    }

    const context = { operation, variables, endpoint: this.endpoint };

    return withRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'CustomerSubDomain': this.subdomain,
            'User-Agent': 'superops-msp-mcp/1.0'
          },
          body: JSON.stringify({ query: operation, variables }),
          signal: controller.signal
        });

        const rawText = await response.text();

        let body;
        try {
          body = JSON.parse(rawText);
        } catch (e) {
          throw new Error(`Invalid JSON response (HTTP ${response.status}): ${rawText.substring(0, 200)}`);
        }

        if (!response.ok) {
          throw new SuperOpsAPIError(response.status, body, context);
        }

        if (body.errors?.length) {
          throw new SuperOpsAPIError(200, body.errors, context);
        }

        return body.data;
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timed out after ${this.timeout}ms`);
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    });
  }
}
