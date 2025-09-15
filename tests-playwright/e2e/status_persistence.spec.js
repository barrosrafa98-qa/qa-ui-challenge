const { test, expect } = require('../fixtures/test-fixtures');

test.describe('@e2e @validation Status persistence', () => {
  test('Edit to completed, persisted in API and DB for same id', async ({
    pages,
    creds,
    userIdFromCreds,
    dataBuilder,
    apiCreateTask,
    apiFindTaskById,
    apiDeleteTask,
    dbGetTaskById,
    page,
  }) => {
    const userId = userIdFromCreds;
    const seed = dataBuilder.makeTaskData('StatusPersist');
    const createdId = await apiCreateTask({
      userId,
      title: seed.title,
      description: seed.description,
      status: 'pending',
    });

    try {
      await pages.login.goto();
      await pages.login.login(creds);
      await pages.dashboard.waitLoaded();
      await pages.dashboard.waitForRowToAppear(seed.title);
      await pages.dashboard.clickEditByTitle(seed.title);
      await expect(pages.taskForm.form).toBeVisible();
      const current = await pages.taskForm.getOptions(); 
      expect(current.map(c => c.toLowerCase())).toEqual(['pending', 'completed']);

      await pages.taskForm.fillAndSubmit(
        { title: seed.title, description: seed.description + ' (edited)', status: 'completed' },
        { expectSuccess: true }
      );

      const apiRow = await apiFindTaskById(userId, createdId);
      expect(apiRow).toBeTruthy();
      expect(apiRow.status).toBe('completed');

      const dbRow = dbGetTaskById(createdId);
      expect(dbRow).toBeTruthy();
      expect(dbRow.status).toBe('completed');
    } finally {
      await apiDeleteTask(createdId).catch(() => {});
    }
  });
});
