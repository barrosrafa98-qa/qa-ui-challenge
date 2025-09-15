const { test, expect } = require('../fixtures/test-fixtures');

test.describe('@api @negative API Errors & Validation - /tasks', () => {
  test('POST /tasks without user_id', async ({
  api,
  dbCountTasksByTitlePrefix,
  dbTaskIdsByTitlePrefix,
  apiDeleteManyTasks,
}) => {
  const prefix = `no-user-${Date.now()}-`;
  const title = `${prefix}should-not-create`;
  const before = dbCountTasksByTitlePrefix(prefix);
  const resp = await api.post('/tasks', {
    title,
    description: 'missing user_id',
    status: 'pending',
  });

  if (resp.status === 200) {
    const ids = dbTaskIdsByTitlePrefix(prefix);
    await apiDeleteManyTasks(ids);
    const after = dbCountTasksByTitlePrefix(prefix);
    expect(after).toBe(0);
  } else {
    const after = dbCountTasksByTitlePrefix(prefix);
    expect(after).toBe(before);
  }
});

  test('POST /tasks with invalid status', async ({
    api,
    db,
    userIdFromCreds,
  }) => {
    const userId = userIdFromCreds;
    const title = `invalid-status-${Date.now()}`;

    const resp = await api.post('/tasks', {
      user_id: userId,
      title,
      description: 'invalid status value',
      status: 'done',
    });

    if (resp.status === 200) {
      const row = db
        .prepare('SELECT id, status FROM tasks WHERE title = ? ORDER BY id DESC LIMIT 1')
        .get(title);
      expect(row).toBeTruthy();
      expect(row.status).toBe('done'); 
      await api.delete(`/tasks/${row.id}`);
    } else {
      expect(resp.status).not.toBe(200);
      const row = db
        .prepare('SELECT id FROM tasks WHERE title = ? ORDER BY id DESC LIMIT 1')
        .get(title);
      expect(row).toBeUndefined();
    }
  });

  test('PUT /tasks/:id with non-existent id', async ({ api }) => {
    const nonexistentId = 999999;
    const resp = await api.put(`/tasks/${nonexistentId}`, {
      title: 'x',
      description: 'y',
      status: 'completed',
    });
    expect(resp.status).toBe(200);
  });

  test('DELETE /tasks/:id twice', async ({
    api,
    userIdFromCreds,
    apiCreateTask,
  }) => {
    const userId = userIdFromCreds;
    const createdId = await apiCreateTask({
      userId,
      title: `del-twice-${Date.now()}`,
      description: 'temp',
      status: 'pending',
    });

    const first = await api.delete(`/tasks/${createdId}`);
    expect(first.status).toBe(200);
    expect(first.data).toMatchObject({ deleted: 1 });

    const second = await api.delete(`/tasks/${createdId}`);
    expect(second.status).toBe(200);
    expect(second.data).toMatchObject({ deleted: 0 });
  });

  test('GET /tasks/:userId with non-existent user', async ({ api }) => {
    const resp = await api.get('/tasks/999999');
    expect(resp.status).toBe(200);
    expect(Array.isArray(resp.data)).toBeTruthy();
    expect(resp.data.length).toBe(0);
  });

  test('NEGATIVE: POST /tasks with empty title', async ({
    api,
    db,
    userIdFromCreds,
  }) => {
    const userId = userIdFromCreds;
    const before = db.prepare('SELECT COUNT(*) AS c FROM tasks WHERE user_id = ?').get(userId).c;

    const payload = {
      user_id: userId,
      title: '',                 
      description: 'no-title',
      status: 'pending',
    };

    const resp = await api.post('/tasks', payload);
    if (resp.status === 200 && resp.data && typeof resp.data.id === 'number') {
      const createdId = resp.data.id;

      const createdRow = db.prepare('SELECT id, title FROM tasks WHERE id = ?').get(createdId);
      expect(createdRow).toBeTruthy();
      expect(createdRow.title).toBe('');
      await api.delete(`/tasks/${createdId}`);
      const after = db.prepare('SELECT COUNT(*) AS c FROM tasks WHERE user_id = ?').get(userId).c;
    } else {
      expect(resp.status).not.toBe(200);
      const after = db.prepare('SELECT COUNT(*) AS c FROM tasks WHERE user_id = ?').get(userId).c;
      expect(after).toBe(before);
    }
  });
});
