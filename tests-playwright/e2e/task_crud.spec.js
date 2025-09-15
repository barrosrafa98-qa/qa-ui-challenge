const { test, expect } = require('../fixtures/test-fixtures');
test.describe('@e2e E2E -  Task CRUD', () => {
test('CRUD via UI with cross-layer consistency by ID', async ({
  pages,
  loginAsUser,      
  dataBuilder,        
  uiCreateTask,
  uiEditTaskByTitle,
  uiDeleteTaskByTitle,
  apiFindTaskByTitle,
  apiFindTaskById,
  dbGetTaskById,
}) => {
  const { userId } = loginAsUser;

  const createData = dataBuilder.makeTaskData('Create');
  const updateData = dataBuilder.makeTaskData('Update');

  await uiCreateTask(createData);

  const created = await apiFindTaskByTitle(userId, createData.title);
  expect(created, 'Created task should be found by title via API').toBeTruthy();
  const taskId = created.id;

  const dbRowAfterCreate = dbGetTaskById(taskId);
  expect(dbRowAfterCreate).toBeTruthy();
  expect(dbRowAfterCreate.title).toBe(createData.title);
  expect(dbRowAfterCreate.description).toBe(createData.description);
  expect(dbRowAfterCreate.status).toBe(createData.status);
  expect(dbRowAfterCreate.user_id).toBe(userId);

  await uiEditTaskByTitle(createData.title, updateData);

  const updated = await apiFindTaskById(userId, taskId);
  expect(updated, 'Updated task should still be retrievable by same ID').toBeTruthy();
  expect(updated.title).toBe(updateData.title);
  expect(updated.description).toBe(updateData.description);
  expect(updated.status).toBe(updateData.status);

  const dbRowAfterUpdate = dbGetTaskById(taskId);
  expect(dbRowAfterUpdate.title).toBe(updateData.title);
  expect(dbRowAfterUpdate.description).toBe(updateData.description);
  expect(dbRowAfterUpdate.status).toBe(updateData.status);

  await uiDeleteTaskByTitle(updateData.title);

  const stillThere = await apiFindTaskById(userId, taskId);
  expect(stillThere, 'Task should not be present in API after deletion').toBeFalsy();

  const dbRowAfterDelete = dbGetTaskById(taskId);
  expect(dbRowAfterDelete, 'Task should not be present in DB after deletion').toBeUndefined();
});
})