const { test, expect } = require('../fixtures/test-fixtures');

test.describe('@api API Happy Path - /tasks', () => {
  test('POST creates, PUT updates, DELETE removes (and responses reflect DB state)', async ({
    api,
    db,
    creds,
    userIdFromCreds,
    dataBuilder,
    apiCreateTask,
    apiUpdateTask,
    apiDeleteTask,
    apiFindTaskById,
    dbGetTaskById,
  }) => {
    const userId = userIdFromCreds;
    expect(userId).toBeTruthy();
    const createData = dataBuilder.makeTaskData('API-Happy');
    createData.status = 'pending';
    const createdId = await apiCreateTask({
      userId,
      title: createData.title,
      description: createData.description,
      status: createData.status,
    });
    expect(createdId, 'POST should return a numeric id').toBeTruthy();
    const apiAfterCreate = await apiFindTaskById(userId, createdId);
    expect(apiAfterCreate).toBeTruthy();
    expect(apiAfterCreate.title).toBe(createData.title);
    expect(apiAfterCreate.description).toBe(createData.description);
    expect(apiAfterCreate.status).toBe(createData.status);

    const dbAfterCreate = dbGetTaskById(createdId);
    expect(dbAfterCreate).toBeTruthy();
    expect(dbAfterCreate.title).toBe(createData.title);
    expect(dbAfterCreate.description).toBe(createData.description);
    expect(dbAfterCreate.status).toBe(createData.status);
    expect(dbAfterCreate.user_id).toBe(userId);

    const updateData = {
      title: `${createData.title} - UPDATED`,
      description: `${createData.description} - UPDATED`,
      status: 'completed',
    };
    const putResp = await apiUpdateTask(createdId, updateData);
    expect(putResp.status).toBe(200);
    expect(putResp.data).toMatchObject({ updated: 1 });

    const apiAfterUpdate = await apiFindTaskById(userId, createdId);
    expect(apiAfterUpdate).toBeTruthy();
    expect(apiAfterUpdate.title).toBe(updateData.title);
    expect(apiAfterUpdate.description).toBe(updateData.description);
    expect(apiAfterUpdate.status).toBe(updateData.status);

    const dbAfterUpdate = dbGetTaskById(createdId);
    expect(dbAfterUpdate).toBeTruthy();
    expect(dbAfterUpdate.title).toBe(updateData.title);
    expect(dbAfterUpdate.description).toBe(updateData.description);
    expect(dbAfterUpdate.status).toBe(updateData.status);

    const delResp = await apiDeleteTask(createdId);
    expect(delResp.status).toBe(200);
    expect(delResp.data).toMatchObject({ deleted: 1 });


    const apiAfterDelete = await apiFindTaskById(userId, createdId);
    expect(apiAfterDelete).toBeFalsy();

    const dbAfterDelete = dbGetTaskById(createdId);
    expect(dbAfterDelete).toBeUndefined();
  });

   test('POST /tasks with empty description', async ({
    api,
    db,
    userIdFromCreds,
  }) => {
    const userId = userIdFromCreds;
    const title = `empty-desc-${Date.now()}`;

    const payload = {
      user_id: userId,
      title,                      
      description: '',            
      status: 'pending',
    };

    const resp = await api.post('/tasks', payload);
    expect(resp.status).toBe(200);
    expect(resp.data && typeof resp.data.id).toBe('number');

    const createdId = resp.data.id;

    const row = db.prepare('SELECT id, title, description, status, user_id FROM tasks WHERE id = ?').get(createdId);
    expect(row).toBeTruthy();
    expect(row.title).toBe(title);
    expect(row.description).toBe('');     
    expect(row.status).toBe('pending');
    expect(row.user_id).toBe(userId);

    await api.delete(`/tasks/${createdId}`);
    const deleted = db.prepare('SELECT id FROM tasks WHERE id = ?').get(createdId);
    expect(deleted).toBeUndefined();
  });
});

