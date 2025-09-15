const { test, expect } = require('../fixtures/test-fixtures');

test.describe('@negative @e2e E2E - Negative & Robustness', () => {
  test.describe.configure({ mode: 'serial' });

  test('API failure on submit: POST /tasks returns 500, UI shows error and stays on form', async ({
    page,
    pages,
    creds,
  }) => {
    await pages.login.goto();
    await pages.login.login(creds);
    await pages.dashboard.waitLoaded();
    await pages.dashboard.openCreateTask();

    await page.route('**/tasks', async (route) => {
      if (route.request().method().toUpperCase() === 'POST') {
        await route.fulfill({ status: 500, body: 'boom' });
      } else {
        await route.continue();
      }
    });

    await pages.taskForm.fillAndSubmit(
  {
    title: `fail-${Date.now()}`,
    description: 'should not be created',
    status: 'pending',
  },
  { expectSuccess: false, waitForError: /failed to save task/i }
);
await expect(page).toHaveURL(/task_form\.html/);
await expect(pages.taskForm.message).toHaveText(/failed to save task/i);
  });

  test('Stale data: API updates while UI is open, dashboard refresh shows the new data', async ({
    pages,
    page,
    creds,
    userIdFromCreds,
    dataBuilder,
    apiCreateTask,
    apiFindTaskById,
    apiUpdateTask,
    apiDeleteTask,
  }) => {
    const userId = userIdFromCreds;

    const seed = dataBuilder.makeTaskData('Stale');
    seed.status = 'pending';
    const createdId = await apiCreateTask({
      userId,
      title: seed.title,
      description: seed.description,
      status: seed.status,
    });

    try {
      await pages.login.goto();
      await pages.login.login(creds);
      await pages.dashboard.waitLoaded();
      await pages.dashboard.waitForRowToAppear(seed.title);

      await pages.dashboard.clickEditByTitle(seed.title);
      await expect(pages.taskForm.form).toBeVisible();

      const updated = {
        title: `${seed.title} - UPDATED`,
        description: `${seed.description} - UPDATED`,
        status: 'completed',
      };
      const putResp = await apiUpdateTask(createdId, updated);
      expect(putResp.status).toBe(200);

      await page.goto(/dashboard\.html/.test(page.url()) ? page.url() : 'http://localhost:8080/dashboard.html');
      await pages.dashboard.waitLoaded();
      await page.reload({ waitUntil: 'networkidle' });
      await pages.dashboard.waitForRowToAppear(updated.title);

      const apiRow = await apiFindTaskById(userId, createdId);
      expect(apiRow).toBeTruthy();
      expect(apiRow.title).toBe(updated.title);
      expect(apiRow.status).toBe('completed');
    } finally {
      await apiDeleteTask(createdId);
    }
  });

  test('Race condition: delete same task from two pages in parallel, UI remains consistent', async ({
    browser,
    creds,
    pages, 
    userIdFromCreds,
    dataBuilder,
    apiCreateTask,
    apiFindTaskByTitle,
    apiDeleteTask,
  }) => {
    const userId = userIdFromCreds;

    const seed = dataBuilder.makeTaskData('Race');
    seed.status = 'pending';
    const createdId = await apiCreateTask({
      userId,
      title: seed.title,
      description: seed.description,
      status: seed.status,
    });

    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    const { LoginPage } = require('../page-objects/login.page');
    const { DashboardPage } = require('../page-objects/dashboard.page');

    const loginA = new LoginPage(pageA);
    const loginB = new LoginPage(pageB);
    const dashA = new DashboardPage(pageA);
    const dashB = new DashboardPage(pageB);

    try {
      await loginA.goto();
      await loginA.login(creds);
      await dashA.waitLoaded();
      await dashA.waitForRowToAppear(seed.title);

      await loginB.goto();
      await loginB.login(creds);
      await dashB.waitLoaded();
      await dashB.waitForRowToAppear(seed.title);

      await dashA.clickDeleteByTitle(seed.title);
      await dashA.waitForRowToDisappear(seed.title);

      await dashB.clickDeleteByTitle(seed.title);
      await pageB.reload({ waitUntil: 'networkidle' });

      const rowB = dashB.rowByTitle(seed.title).first();
      await expect(rowB).toHaveCount(0);

      const stillThere = await apiFindTaskByTitle(userId, seed.title);
      expect(stillThere).toBeFalsy();
    } finally {
      await apiDeleteTask(createdId).catch(() => {});
      await ctxA.close();
      await ctxB.close();
    }
  });
});
