const { test, expect } = require('../fixtures/test-fixtures');

test.describe('@db @mapping Mapping Elements in All Pages', () => {
const { test, expect } = require('../fixtures/test-fixtures');
  test('UI mapping: ensure at least one task exists (create via API only if needed) → Login → Dashboard → Task Form via Edit', async ({
    pages,
    creds,
    userIdFromCreds,
    dataBuilder,
    apiTasksForUser,
    apiCreateTask,
    apiDeleteTask,
    page,
  }) => {
    const userId = userIdFromCreds;
    expect(userId, 'User not found for provided credentials').toBeTruthy();

    let createdId = null;
    let createdTitle = null;

    try {

      const existing = await apiTasksForUser(userId);
      if (!existing || existing.length === 0) {
        const seed = dataBuilder.makeTaskData('Mapping');
        createdTitle = seed.title;
        createdId = await apiCreateTask({
          userId,
          title: createdTitle,
          description: seed.description,
          status: 'pending',
        });
        expect(createdId).toBeTruthy();
      }

      await pages.login.goto();
      await expect(pages.login.heading).toBeVisible();
      await expect(pages.login.form).toBeVisible();
      await expect(pages.login.email).toBeVisible();
      await expect(pages.login.password).toBeVisible();
      await expect(pages.login.submitBtn).toBeVisible();

      await pages.login.login(creds);

      await pages.dashboard.waitLoaded();
      await expect(pages.dashboard.heading).toBeVisible();
      await expect(pages.dashboard.tasksTable).toBeVisible();
      await expect(pages.dashboard.thead).toBeVisible();

      const headerTexts = await pages.dashboard.getHeaderTexts();
      const norm = headerTexts.map(t => t.trim().toLowerCase());
      expect(norm).toEqual(['title', 'description', 'status', 'actions']);

      if (createdTitle) {
  
        await pages.dashboard.waitForRowToAppear(createdTitle);
      } else {
 
        let gotRow = await pages.dashboard.waitForAnyRow(2000);

        if (!gotRow) {

          const late = dataBuilder.makeTaskData('Mapping-late');
          createdTitle = late.title;
          createdId = await apiCreateTask({
            userId,
            title: createdTitle,
            description: late.description,
            status: 'pending',
          });
          expect(createdId).toBeTruthy();

          await page.reload({ waitUntil: 'networkidle' });
          await pages.dashboard.waitLoaded();

          await pages.dashboard.waitForRowToAppear(createdTitle);
        }
      }

      if (createdTitle) {
        await pages.dashboard.clickEditByTitle(createdTitle);
      } else {
        const editFirst = pages.dashboard.firstEditButton();
        if ((await editFirst.count()) > 0) {
          await editFirst.click();
          await pages.taskForm.page.waitForURL(/task_form\.html/);
        } else {
          await pages.dashboard.openCreateTask();
        }
      }

      await expect(pages.taskForm.form).toBeVisible();
      await expect(pages.taskForm.title).toBeVisible();
      await expect(pages.taskForm.description).toBeVisible();
      await expect(pages.taskForm.status).toBeVisible();
      await expect(pages.taskForm.submitBtn).toBeVisible();

      const options = await pages.taskForm.getOptions();
      expect(options.map(o => o.trim().toLowerCase())).toEqual(['pending', 'completed']);
    } finally {

      if (createdId) {
        await apiDeleteTask(createdId);
      }
    }
  });

  test('Form validation: cannot create task without title', async ({
    page,
    pages,
    creds,
  }) => {

    await pages.login.goto();
    await pages.login.login(creds);
    await pages.dashboard.waitLoaded(); 
    await pages.dashboard.openCreateTask();
    await expect(pages.taskForm.form).toBeVisible();

    const sawPostPromise = page
      .waitForRequest(req => req.method() === 'POST' && /\/tasks$/.test(req.url()), { timeout: 1000 })
      .then(() => true)
      .catch(() => false);

    await pages.taskForm.fillAndSubmit(
      { title: '', description: `ui-no-title-${Date.now()}`, status: 'pending' },
      { expectSuccess: false, waitForError: /(title|required)/i }
    );

    await expect(page).toHaveURL(/task_form\.html/);
    await expect(pages.taskForm.message).toBeVisible();
    const msgText = (await pages.taskForm.message.textContent()) || '';
    expect(msgText.toLowerCase()).toMatch(/title|required/);

    const sawPost = await sawPostPromise;
    expect(sawPost, 'UI should not send POST /tasks when title is empty').toBeFalsy();
  });


})
