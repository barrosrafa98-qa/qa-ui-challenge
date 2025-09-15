const { test, expect } = require('../fixtures/test-fixtures');
const Ajv = require('ajv').default;
let addFormats = null;
try { addFormats = require('ajv-formats'); } catch (_) {}

const { loadSwagger, getResponseSchema } = require('../helpers/schema_loader');

test.describe('@api @contract GET schema & snapshot', () => {
  let swagger;
  let ajv;

  test.beforeAll(() => {
    swagger = loadSwagger(); 
    ajv = new Ajv({ strict: false, allErrors: true });
    if (addFormats) { try { addFormats(ajv); } catch (_) {} }
  });

  test('GET /tasks/:userId, matches schema & stable signature snapshot', async ({ api, userIdFromCreds }) => {
    const userId = userIdFromCreds;
    const res = await api.get(`/tasks/${userId}`);
    expect(res.status).toBe(200);

    const schema = getResponseSchema({
      swagger,
      method: 'get',
      pathKey: '/tasks/{userId}',
      status: 200
    });

    if (schema) {
      const valid = ajv.validate(schema, res.data);
      if (!valid) console.error('Schema errors:', ajv.errors);
      expect(valid, 'Response does not match schema').toBe(true);
    }

    let signatureText;

    if (schema && schema.items && schema.items.properties) {
      const props = schema.items.properties;
      const keys = Object.keys(props).sort();
      const types = {};
      for (const k of keys) {
        const def = props[k] || {};
        types[k] = def.type || (def.enum ? 'string' : 'unknown');
      }
      signatureText = JSON.stringify({ kind: 'array<object>', keys, types }, null, 2);
    } else {
      const data = Array.isArray(res.data) ? res.data : [];
      if (data.length > 0 && typeof data[0] === 'object') {
        const sample = data[0];
        const keys = Object.keys(sample).sort();
        const types = {};
        for (const k of keys) types[k] = typeof sample[k];
        signatureText = JSON.stringify({ kind: 'array<object>', keys, types }, null, 2);
      } else {
        signatureText = JSON.stringify({ kind: 'array<object>', keys: [], types: {} }, null, 2);
      }
    }

    expect(signatureText).toMatchSnapshot('tasks_get_signature.json');
  });
});
