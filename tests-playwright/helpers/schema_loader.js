const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function loadSwagger() {
  const p = path.resolve(process.cwd(), 'api', 'swagger.yaml');
  try {
    const raw = fs.readFileSync(p, 'utf8');
    return yaml.load(raw);
  } catch {
    return null;
  }
}

function getResponseSchema({ swagger, method, pathKey, status }) {
  if (swagger) {
    const p = swagger.paths?.[pathKey];
    const op = p && p[method.toLowerCase()];
    const res = op?.responses?.[String(status)];
    const content = res?.content?.['application/json']?.schema;
    if (content) return content;
    if (res?.schema) return res.schema;
  }
  if (method === 'get' && pathKey === '/tasks/{userId}' && status === 200) {
    return {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'user_id', 'title', 'description', 'status'],
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'integer' },
          title: { type: 'string' },
          description: { type: 'string' },
          status: { enum: ['pending', 'completed', 'done', 'in_progress'], type: 'string' }
        },
        additionalProperties: true
      }
    };
  }
  if (method === 'post' && pathKey === '/tasks' && status === 200) {
    return {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'integer' } },
      additionalProperties: true
    };
  }
  if (method === 'put' && pathKey === '/tasks/{id}' && status === 200) {
    return {
      type: 'object',
      required: ['updated'],
      properties: { updated: { type: 'integer' } },
      additionalProperties: true
    };
  }
  if (method === 'delete' && pathKey === '/tasks/{id}' && status === 200) {
    return {
      type: 'object',
      required: ['deleted'],
      properties: { deleted: { type: 'integer' } },
      additionalProperties: true
    };
  }
  return null;
}

module.exports = { loadSwagger, getResponseSchema };
