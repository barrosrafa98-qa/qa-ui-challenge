const { test, expect } = require('../fixtures/test-fixtures');

test.describe('@db DB Integrity & Consistency', () => {

  test('Foreign key behavior: inserting task with non-existent user_id (raw DB insert)', async ({
    db,
    dbFk,
    dbInsertTaskRaw,
    dbDeleteTaskById,
  }) => {
    const nonexistentUserId = 999999;

    const r1 = dbInsertTaskRaw(nonexistentUserId, `FK-OFF-${Date.now()}`, 'should fail if FK enforced', 'pending');

    if (r1.ok) {
      const removed = dbDeleteTaskById(r1.id);
      expect(removed).toBe(1);
    }

    const stmtFk = dbFk.prepare(
      'INSERT INTO tasks(user_id, title, description, status) VALUES(?,?,?,?)'
    );

    let fkOk = false;
    try {
      stmtFk.run(nonexistentUserId, `FK-ON-${Date.now()}`, 'must be rejected', 'pending');
      fkOk = true; 
    } catch (e) {
      fkOk = false;
    }

    expect(fkOk).toBeFalsy();
  });

  test('Duplicate titles for the same user_id (current behavior via API)', async ({
    api,
    userIdFromCreds,
    apiCreateTask,
    apiDeleteManyTasks,
    dbCountTasksByTitleAndUser,
  }) => {
    const userId = userIdFromCreds;
    expect(userId).toBeTruthy();

    const title = `dup-title-${Date.now()}`;

    const id1 = await apiCreateTask({ userId, title, description: 'first', status: 'pending' });
    const id2Resp = await api.post('/tasks', {
      user_id: userId,
      title,
      description: 'second',
      status: 'completed',
    });

    if (id2Resp.status === 200 && id2Resp.data && typeof id2Resp.data.id === 'number') {
      const id2 = id2Resp.data.id;

      const count = dbCountTasksByTitleAndUser(title, userId);
      expect(count).toBe(2);

      await apiDeleteManyTasks([id1, id2]);
      const countAfter = dbCountTasksByTitleAndUser(title, userId);
      expect(countAfter).toBe(0);
    } else {

      expect(id2Resp.status).not.toBe(200);

      const count = dbCountTasksByTitleAndUser(title, userId);
      expect(count).toBe(1);

      await apiDeleteManyTasks([id1]);
      const countAfter = dbCountTasksByTitleAndUser(title, userId);
      expect(countAfter).toBe(0);
    }
  });

  test('Attempt to insert two tasks with the same explicit id, second insert must fail', async ({
  db,
  dbInsertTaskWithId,
  dbDeleteTaskById,
  userIdFromCreds,
}) => {
  const userId = userIdFromCreds;
  expect(userId).toBeTruthy();

  const forcedId = 999999;
  const title = `forced-id-${Date.now()}`;

  const r1 = dbInsertTaskWithId(forcedId, userId, title, 'first insert', 'pending');
  expect(r1.ok).toBeTruthy();

  const r2 = dbInsertTaskWithId(forcedId, userId, `${title}-dup`, 'second insert', 'pending');
  expect(r2.ok).toBeFalsy();
  expect(r2.error).toMatch(/UNIQUE constraint failed/i);

  const removed = dbDeleteTaskById(forcedId);
  expect(removed).toBe(1);
});


});
