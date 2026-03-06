/**
 * POTAL API v1 — OpenAPI 3.0 Specification
 *
 * Auto-served at /api/v1/docs
 * Can be imported into Swagger UI, Postman, etc.
 */

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'POTAL API',
    version: '1.0.0',
    description:
      'Total Landed Cost calculation API for cross-border commerce. Calculate import duties, taxes, and fees for 181 countries.',
    contact: {
      name: 'POTAL Support',
      url: 'https://www.potal.app',
      email: 'contact@potal.app',
    },
  },
  servers: [
    {
      url: 'https://www.potal.app/api/v1',
      description: 'Production',
    },
  ],
  security: [{ ApiKeyHeader: [] }, { BearerAuth: [] }],
  paths: {
    '/calculate': {
      post: {
        summary: 'Calculate Total Landed Cost (single)',
        description:
          'Calculate the total landed cost for a single item including import duties, taxes, and fees.',
        operationId: 'calculateSingle',
        tags: ['Calculation'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CostInput' },
              examples: {
                chinaToUS: {
                  summary: 'China to US',
                  value: {
                    price: 49.99,
                    shippingPrice: 8.5,
                    origin: 'CN',
                    zipcode: '10001',
                    destinationCountry: 'US',
                  },
                },
                domesticUS: {
                  summary: 'US domestic',
                  value: {
                    price: 29.99,
                    origin: 'US',
                    zipcode: '90210',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Successful calculation',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/LandedCost' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '429': { $ref: '#/components/responses/RateLimited' },
        },
      },
    },
    '/calculate/batch': {
      post: {
        summary: 'Calculate Total Landed Cost (batch)',
        description:
          'Calculate TLC for multiple items in a single request. Max 100 items.',
        operationId: 'calculateBatch',
        tags: ['Calculation'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BatchRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Batch calculation results',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/BatchResponse' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '429': { $ref: '#/components/responses/RateLimited' },
        },
      },
    },
    '/sellers/keys': {
      get: {
        summary: 'List API keys',
        description: 'List all API keys for the authenticated seller. Requires secret key (sk_live_).',
        operationId: 'listKeys',
        tags: ['Key Management'],
        responses: {
          '200': {
            description: 'List of API keys',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            keys: {
                              type: 'array',
                              items: { $ref: '#/components/schemas/ApiKeyInfo' },
                            },
                            total: { type: 'integer' },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        summary: 'Create API key',
        description: 'Create a new API key. The full key is shown only once. Requires secret key.',
        operationId: 'createKey',
        tags: ['Key Management'],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['publishable', 'secret'], default: 'secret' },
                  name: { type: 'string', maxLength: 100, default: 'Default' },
                  rateLimitPerMinute: { type: 'integer', minimum: 1, maximum: 10000, default: 60 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Key created successfully' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      delete: {
        summary: 'Revoke API key',
        description: 'Revoke an API key by ID. Cannot revoke the key currently in use.',
        operationId: 'revokeKey',
        tags: ['Key Management'],
        parameters: [
          {
            name: 'id',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'The API key ID to revoke',
          },
        ],
        responses: {
          '200': { description: 'Key revoked successfully' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/countries': {
      get: {
        summary: 'List supported countries',
        description: 'Get a list of all supported destination countries with their tax/duty information.',
        operationId: 'listCountries',
        tags: ['Reference'],
        responses: {
          '200': {
            description: 'List of supported countries',
          },
        },
      },
    },
    '/sellers/usage': {
      get: {
        summary: 'Get usage statistics',
        description: 'Get monthly API usage statistics for the authenticated seller.',
        operationId: 'getUsage',
        tags: ['Account'],
        parameters: [
          {
            name: 'month',
            in: 'query',
            schema: { type: 'string', example: '2026-03' },
            description: 'Month in YYYY-MM format. Defaults to current month.',
          },
        ],
        responses: {
          '200': { description: 'Usage statistics' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      ApiKeyHeader: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key (pk_live_ or sk_live_)',
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'Bearer token (API key)',
      },
    },
    schemas: {
      CostInput: {
        type: 'object',
        required: ['price'],
        properties: {
          price: {
            oneOf: [{ type: 'number' }, { type: 'string' }],
            description: 'Product price (number or string like "$29.99")',
            example: 49.99,
          },
          shippingPrice: { type: 'number', minimum: 0, default: 0, description: 'Shipping cost in USD' },
          origin: { type: 'string', description: 'Origin: ISO code ("CN") or platform ("AliExpress")', example: 'CN' },
          shippingType: { type: 'string', enum: ['domestic', 'international', 'global'] },
          zipcode: { type: 'string', description: 'Buyer US ZIP code', example: '10001' },
          hsCode: { type: 'string', description: 'HS Code for precise duty (future)' },
          destinationCountry: { type: 'string', description: 'ISO destination country', default: 'US', example: 'US' },
        },
      },
      LandedCost: {
        type: 'object',
        properties: {
          productPrice: { type: 'number' },
          shippingCost: { type: 'number' },
          importDuty: { type: 'number' },
          mpf: { type: 'number' },
          salesTax: { type: 'number' },
          totalLandedCost: { type: 'number' },
          type: { type: 'string', enum: ['domestic', 'global'] },
          isDutyFree: { type: 'boolean' },
          originCountry: { type: 'string', enum: ['CN', 'OTHER', 'DOMESTIC'] },
          breakdown: {
            type: 'array',
            items: { $ref: '#/components/schemas/CostBreakdownItem' },
          },
        },
      },
      CostBreakdownItem: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          amount: { type: 'number' },
          note: { type: 'string' },
        },
      },
      BatchRequest: {
        type: 'object',
        required: ['items'],
        properties: {
          items: {
            type: 'array',
            maxItems: 100,
            items: {
              allOf: [
                { $ref: '#/components/schemas/CostInput' },
                { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
              ],
            },
          },
          defaults: {
            type: 'object',
            properties: {
              origin: { type: 'string' },
              zipcode: { type: 'string' },
              destinationCountry: { type: 'string' },
            },
          },
        },
      },
      BatchResponse: {
        type: 'object',
        properties: {
          results: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                result: { $ref: '#/components/schemas/LandedCost' },
              },
            },
          },
          errors: { type: 'array', items: { type: 'object' } },
          summary: {
            type: 'object',
            properties: {
              total: { type: 'integer' },
              success: { type: 'integer' },
              failed: { type: 'integer' },
            },
          },
        },
      },
      ApiKeyInfo: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          prefix: { type: 'string', example: 'pk_live_abc1' },
          type: { type: 'string', enum: ['publishable', 'secret'] },
          name: { type: 'string' },
          isActive: { type: 'boolean' },
          rateLimitPerMinute: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          lastUsedAt: { type: 'string', format: 'date-time', nullable: true },
          revokedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          meta: {
            type: 'object',
            properties: { timestamp: { type: 'string', format: 'date-time' } },
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' },
            },
          },
        },
      },
    },
    responses: {
      BadRequest: {
        description: 'Invalid request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
      Unauthorized: {
        description: 'Missing or invalid API key',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
      Forbidden: {
        description: 'Insufficient permissions',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
      NotFound: {
        description: 'Resource not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
      RateLimited: {
        description: 'Rate limit exceeded',
        headers: {
          'X-RateLimit-Limit': { schema: { type: 'integer' } },
          'X-RateLimit-Remaining': { schema: { type: 'integer' } },
          'Retry-After': { schema: { type: 'integer' } },
        },
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
    },
  },
} as const;
