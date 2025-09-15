class TaskFormPage {
  constructor(page) {
    this.page = page;
    this.heading = page.locator('h1:text("Create/Edit Task")');
    this.form = page.locator('form#taskForm');
    this.title = page.locator('#title');
    this.description = page.locator('#description');
    this.status = page.locator('#status');
    this.submitBtn = page.locator('form#taskForm button[type="submit"]');
    this.message = page.locator('#message');
  }

async fillAndSubmit({ title, description, status }, { expectSuccess, waitForError } = {}) {
  if (typeof title === 'string') await this.title.fill(title);
  if (typeof description === 'string') await this.description.fill(description);
  if (status) await this.status.selectOption(status);

  await this.submitBtn.click();

  if (expectSuccess === true) {
    await this.page.waitForURL(/dashboard\.html/);
    return;
  }

  if (expectSuccess === false) {

    await this.page.waitForURL(/task_form\.html/);
    if (waitForError) {
      await this.message.waitFor();
      const text = (await this.message.textContent()) || '';
      if (waitForError instanceof RegExp) {
        if (!waitForError.test(text)) {
          throw new Error(`Expected error message matching ${waitForError}, got: "${text}"`);
        }
      } else {
        if (!text.toLowerCase().includes(String(waitForError).toLowerCase())) {
          throw new Error(`Expected error message to include "${waitForError}", got: "${text}"`);
        }
      }
    }
    return;
  }

  const navigated = await this.page
    .waitForURL(/dashboard\.html/, { timeout: 1500 })
    .then(() => true)
    .catch(() => false);

  if (!navigated) {
  
    await this.page.waitForURL(/task_form\.html/);
    if (waitForError) {
      await this.message.waitFor();
    }
  }
}

async submitExpectingFailure(data, waitForError) {
  return this.fillAndSubmit(data, { expectSuccess: false, waitForError });
}

  async getOptions() {
    return this.status.locator('option').allTextContents();
  }
}
module.exports = { TaskFormPage };
