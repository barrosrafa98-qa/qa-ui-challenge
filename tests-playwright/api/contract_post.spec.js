const { test, expect } = require('../fixtures/test-fixtures');
const Ajv = require('ajv').default;
let addFormats = null;
try { addFormats = require('ajv-formats'); } catch (_) {}

const { loadSwagger, getResponseSchema } = require('../helpers/schema_loader');

test.describe('@api @contract POST schema', () => {
  let swagger;
  let ajv;

  test.beforeAll(() => {
    swagger = loadSwagger();
    ajv = new Ajv({ strict: false, allErrors: true });
    if (addFormats) { try { addFormats(ajv); } catch (_) {} }
  });

  test('POST /tasks, schema { id:number }', async ({ api, userIdFromCreds, dataBuilder, apiDeleteTask }) => {
    const payload = {
      user_id: userIdFromCreds,
      title: dataBuilder.makeTaskData('Contract').title,
      description: 'contract-post',
      status: 'pending',
    };
    const res = await api.post('/tasks', payload);
    expect(res.status).toBe(200);

    const schema = getResponseSchema({ swagger, method: 'post', pathKey: '/tasks', status: 200 });
    if (schema) {
      const valid = ajv.validate(schema, res.data);
      if (!valid) console.error('Schema errors:', ajv.errors);
      expect(valid).toBe(true);
    }

    await apiDeleteTask(res.data.id);
  });
});
