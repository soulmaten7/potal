/**
 * POTAL API v1 — OpenAPI 3.0 Specification
 *
 * Auto-served at /api/v1/docs
 * Can be imported into Swagger UI, Postman, etc.
 */

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'POTAL API v1',
    version: '1.0.0',
    description:
      'B2B Total Landed Cost calculation API for cross-border e-commerce. Calculates import duties, VAT/GST, customs fees, and shipping costs for 240 countries/territories. Features: 5,371 HS codes + 92.3M tariff rates (44 countries completed), 30-language support (en, de, fr, es, it, pt, ru, ar, hi, th, vi, id, tr, pl, nl, sv, da, fi, nb, cs, ro, hu, uk, el, he, ms, ja, ko, zh, zn), AI product classification (text/image-based), customs document generation, import restriction checks, tariff change monitoring, integration with ChatGPT, Claude (MCP), Gemini, and AI shopping agents.',
    contact: {
      name: 'POTAL Support',
      url: 'https://www.potal.app/developers',
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
        description: 'Get a list of all supported destination countries (240) with their VAT/GST rates, de minimis thresholds, and customs fees. Results include 30 language translations for each country.',
        operationId: 'listCountries',
        tags: ['Reference'],
        responses: {
          '200': {
            description: 'List of 240 supported countries with multi-language names and tax information',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              code: { type: 'string', example: 'US' },
                              name: { type: 'string' },
                              nameInLanguages: { type: 'object', additionalProperties: { type: 'string' } },
                              vatRate: { type: 'number', nullable: true },
                              deMinimusThreshold: { type: 'number' },
                              customsFees: { type: 'object' },
                            },
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
        },
      },
    },
    '/classify': {
      post: {
        summary: 'Classify product to HS Code',
        description: 'Classify a product to its HS Code using text-based or image-based AI classification. Supports product name, category, image URL, or base64 image.',
        operationId: 'classifyProduct',
        tags: ['Classification'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  {
                    type: 'object',
                    properties: {
                      productName: { type: 'string', maxLength: 500 },
                      category: { type: 'string', maxLength: 500 },
                    },
                    required: ['productName'],
                  },
                  {
                    type: 'object',
                    properties: {
                      imageUrl: { type: 'string', format: 'uri' },
                      productHint: { type: 'string', maxLength: 500 },
                    },
                    required: ['imageUrl'],
                  },
                  {
                    type: 'object',
                    properties: {
                      imageBase64: { type: 'string' },
                      productHint: { type: 'string', maxLength: 500 },
                    },
                    required: ['imageBase64'],
                  },
                ],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Product classified successfully',
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
                            hsCode: { type: 'string', example: '6204.62' },
                            description: { type: 'string' },
                            confidence: { type: 'number', minimum: 0, maximum: 1 },
                            countryOfOrigin: { type: 'string', nullable: true },
                            alternatives: { type: 'array', items: { type: 'string' } },
                            detectedProductName: { type: 'string', nullable: true },
                          },
                        },
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
    '/documents': {
      post: {
        summary: 'Generate customs documents',
        description: 'Generate Commercial Invoice and/or Packing List for cross-border shipment. AI-powered HS Code classification and formatting.',
        operationId: 'generateDocuments',
        tags: ['Documentation'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'exporter', 'importer', 'items'],
                properties: {
                  type: { type: 'string', enum: ['commercial_invoice', 'packing_list', 'both'] },
                  exporter: { $ref: '#/components/schemas/TradeParty' },
                  importer: { $ref: '#/components/schemas/TradeParty' },
                  items: {
                    type: 'array',
                    maxItems: 100,
                    items: { $ref: '#/components/schemas/LineItem' },
                  },
                  shippingCost: { type: 'number', minimum: 0 },
                  insuranceCost: { type: 'number', minimum: 0 },
                  incoterm: { type: 'string', enum: ['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'] },
                  currency: { type: 'string', default: 'USD' },
                  paymentTerms: { type: 'string' },
                  shippingMethod: { type: 'string' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Documents generated successfully',
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
                            commercialInvoice: { type: 'string', nullable: true },
                            packingList: { type: 'string', nullable: true },
                          },
                        },
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
    '/restrictions': {
      post: {
        summary: 'Check import restrictions',
        description: 'Check if a product has import restrictions for a destination country (e.g., prohibited items, licenses required, banned substances).',
        operationId: 'checkRestrictions',
        tags: ['Compliance'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['destinationCountry'],
                properties: {
                  hsCode: { type: 'string', maxLength: 10 },
                  destinationCountry: { type: 'string', minLength: 2, maxLength: 2, example: 'US' },
                  productName: { type: 'string', maxLength: 500 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Restrictions checked successfully',
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
                            hasRestrictions: { type: 'boolean' },
                            isProhibited: { type: 'boolean' },
                            restrictions: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  type: { type: 'string' },
                                  description: { type: 'string' },
                                  licenseRequired: { type: 'boolean' },
                                },
                              },
                            },
                            hsCode: { type: 'string' },
                            destinationCountry: { type: 'string' },
                          },
                        },
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
    '/alerts': {
      get: {
        summary: 'List tariff change alerts',
        description: 'Get all tariff change alerts set up by the authenticated seller.',
        operationId: 'listAlerts',
        tags: ['Monitoring'],
        responses: {
          '200': {
            description: 'List of alerts',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/AlertItem' },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        summary: 'Create tariff change alert',
        description: 'Set up an alert for tariff rate changes on specific HS codes and destination countries.',
        operationId: 'createAlert',
        tags: ['Monitoring'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['hsCode', 'destinationCountry'],
                properties: {
                  hsCode: { type: 'string' },
                  destinationCountry: { type: 'string' },
                  webhookUrl: { type: 'string', format: 'uri' },
                  emailNotification: { type: 'boolean', default: true },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Alert created successfully' },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      delete: {
        summary: 'Delete tariff alert',
        description: 'Remove a tariff change alert by ID.',
        operationId: 'deleteAlert',
        tags: ['Monitoring'],
        parameters: [
          {
            name: 'id',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'Alert ID',
          },
        ],
        responses: {
          '200': { description: 'Alert deleted successfully' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/agent': {
      post: {
        summary: 'AI Agent Tool Call',
        description: 'Execute POTAL calculation and lookup functions via AI agent tools. Used by ChatGPT, Claude, Gemini integrations for seamless duty lookups.',
        operationId: 'agentToolCall',
        tags: ['AI Integration'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  tool: { type: 'string', enum: ['calculate_cost', 'lookup_duty_rate', 'classify', 'check_restrictions'] },
                  params: { type: 'object' },
                },
                required: ['tool', 'params'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'Tool execution result' },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/checkout': {
      post: {
        summary: 'Create DDP checkout session',
        description: 'Initiate a Paddle checkout session with DDP (Delivered Duty Paid) pricing. Includes landed cost, duty, VAT, and processing fees.',
        operationId: 'createCheckout',
        tags: ['Checkout'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['price', 'destinationCountry'],
                properties: {
                  price: { type: 'number' },
                  shippingPrice: { type: 'number', default: 0 },
                  destinationCountry: { type: 'string' },
                  successUrl: { type: 'string', format: 'uri' },
                  cancelUrl: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Checkout session created',
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
                            sessionId: { type: 'string' },
                            url: { type: 'string' },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/sellers/me': {
      get: {
        summary: 'Get authenticated seller profile',
        description: 'Retrieve current seller information and plan details.',
        operationId: 'getSellerProfile',
        tags: ['Account'],
        responses: {
          '200': { description: 'Seller profile' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/sellers/register': {
      post: {
        summary: 'Register new seller',
        description: 'Create a new seller account. Returns API keys.',
        operationId: 'registerSeller',
        tags: ['Account'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'storeName'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  storeName: { type: 'string', maxLength: 200 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Seller registered successfully' },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/sellers/usage': {
      get: {
        summary: 'Get usage statistics',
        description: 'Get monthly API usage statistics for the authenticated seller, broken down by endpoint and status code.',
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
          '200': {
            description: 'Usage statistics',
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
                            month: { type: 'string' },
                            totalCalls: { type: 'integer' },
                            callsByEndpoint: { type: 'object', additionalProperties: { type: 'integer' } },
                            successRate: { type: 'number' },
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
        },
      },
    },
    '/sellers/analytics': {
      get: {
        summary: 'Get seller analytics',
        description: 'Get detailed analytics on product classifications, duty calculations, and customer demographics.',
        operationId: 'getAnalytics',
        tags: ['Account'],
        parameters: [
          {
            name: 'from',
            in: 'query',
            schema: { type: 'string', format: 'date', example: '2026-01-01' },
            description: 'Start date for analytics period',
          },
          {
            name: 'to',
            in: 'query',
            schema: { type: 'string', format: 'date', example: '2026-03-08' },
            description: 'End date for analytics period',
          },
        ],
        responses: {
          '200': { description: 'Analytics data' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/admin/update-tariffs': {
      post: {
        summary: 'Trigger tariff update (admin only)',
        description: 'Manually trigger tariff rate updates from 7 government sources (USITC, UK, EU, Canada, Australia, Japan, Korea). Requires admin API key.',
        operationId: 'updateTariffs',
        tags: ['Admin'],
        responses: {
          '200': { description: 'Tariff update initiated' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      get: {
        summary: 'Get tariff update status (Vercel Cron)',
        description: 'Vercel Cron job endpoint. Runs automatically every Monday 06:00 UTC. Requires CRON_SECRET.',
        operationId: 'getTariffUpdateStatus',
        tags: ['Admin'],
        responses: {
          '200': { description: 'Tariff update completed' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/health': {
      get: {
        summary: 'Health check',
        description: 'Verify API and database connectivity.',
        operationId: 'healthCheck',
        tags: ['System'],
        responses: {
          '200': {
            description: 'System healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['ok'] },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
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
      TradeParty: {
        type: 'object',
        required: ['name', 'country'],
        properties: {
          name: { type: 'string', maxLength: 500 },
          country: { type: 'string', minLength: 2, maxLength: 2, example: 'US' },
          address: { type: 'string', maxLength: 500 },
          city: { type: 'string', maxLength: 100 },
          state: { type: 'string', maxLength: 100 },
          postalCode: { type: 'string', maxLength: 20 },
          phone: { type: 'string', maxLength: 30 },
          email: { type: 'string', format: 'email', maxLength: 200 },
          taxId: { type: 'string', maxLength: 50 },
        },
      },
      LineItem: {
        type: 'object',
        required: ['description', 'quantity', 'unitPrice'],
        properties: {
          description: { type: 'string', maxLength: 500 },
          quantity: { type: 'number', minimum: 0.001 },
          unitPrice: { type: 'number', minimum: 0 },
          hsCode: { type: 'string', maxLength: 10 },
          countryOfOrigin: { type: 'string', minLength: 2, maxLength: 2 },
          weightKg: { type: 'number', minimum: 0 },
          category: { type: 'string', maxLength: 200 },
          dimensionsCm: {
            type: 'object',
            properties: {
              length: { type: 'number' },
              width: { type: 'number' },
              height: { type: 'number' },
            },
          },
        },
      },
      AlertItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          hsCode: { type: 'string' },
          destinationCountry: { type: 'string' },
          currentRate: { type: 'number', nullable: true },
          webhookUrl: { type: 'string', format: 'uri', nullable: true },
          emailNotification: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          lastTriggeredAt: { type: 'string', format: 'date-time', nullable: true },
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
