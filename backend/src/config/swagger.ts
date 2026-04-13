import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'State Lessons Learned API',
      version: '1.0.0',
      description: 'REST API for the State Construction Lessons Learned System',
      contact: { name: 'State IT', email: 'it@stateconstruction.com' },
    },
    servers: [
      { url: 'http://localhost:4000', description: 'Development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);

// Manually define paths since we're not using JSDoc annotations in routes
swaggerSpec.paths = {
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Login (dev mode)',
      security: [],
      requestBody: {
        content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' } }, required: ['email'] } } },
      },
      responses: { '200': { description: 'Login successful' }, '401': { description: 'User not found' } },
    },
  },
  '/auth/me': {
    get: { tags: ['Auth'], summary: 'Get current user', responses: { '200': { description: 'Current user info' } } },
  },
  '/api/lessons': {
    get: {
      tags: ['Lessons'],
      summary: 'List lessons with pagination and filters',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        { name: 'search', in: 'query', schema: { type: 'string' } },
        { name: 'system', in: 'query', schema: { type: 'string' } },
        { name: 'phase', in: 'query', schema: { type: 'string' } },
        { name: 'severity', in: 'query', schema: { type: 'string' } },
        { name: 'department', in: 'query', schema: { type: 'string' } },
      ],
      responses: { '200': { description: 'Paginated lessons list' } },
    },
    post: {
      tags: ['Lessons'],
      summary: 'Create a new lesson',
      requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '201': { description: 'Lesson created' } },
    },
  },
  '/api/lessons/{id}': {
    get: { tags: ['Lessons'], summary: 'Get lesson by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Lesson details' } } },
    patch: { tags: ['Lessons'], summary: 'Update lesson', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated lesson' } } },
  },
  '/api/lessons/{id}/approve/pm': {
    post: { tags: ['Approvals'], summary: 'PM approval', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Approval processed' } } },
  },
  '/api/lessons/{id}/approve/pmo': {
    post: { tags: ['Approvals'], summary: 'PMO approval', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Approval processed' } } },
  },
  '/api/lessons/{id}/approve/department': {
    post: { tags: ['Approvals'], summary: 'Department approval', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Approval processed' } } },
  },
  '/api/lessons/{id}/audit': {
    get: { tags: ['Audit'], summary: 'Get audit trail for a lesson', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Audit trail' } } },
  },
  '/api/dashboard/kpis': {
    get: { tags: ['Dashboard'], summary: 'Get KPI metrics', responses: { '200': { description: 'KPI data' } } },
  },
  '/api/dashboard/breakdowns': {
    get: { tags: ['Dashboard'], summary: 'Get chart breakdowns', responses: { '200': { description: 'Breakdown data' } } },
  },
  '/api/dashboard/watchouts': {
    get: { tags: ['Dashboard'], summary: 'Get watchout alerts', responses: { '200': { description: 'Watchout data' } } },
  },
  '/api/dashboard/top-drivers': {
    get: { tags: ['Dashboard'], summary: 'Get top drivers', responses: { '200': { description: 'Top driver data' } } },
  },
  '/api/config/thresholds': {
    get: { tags: ['Config'], summary: 'Get thresholds', responses: { '200': { description: 'Threshold list' } } },
    patch: { tags: ['Config'], summary: 'Update thresholds (Admin)', responses: { '200': { description: 'Updated thresholds' } } },
  },
  '/health': {
    get: { tags: ['System'], summary: 'Health check', security: [], responses: { '200': { description: 'Service healthy' } } },
  },
};
