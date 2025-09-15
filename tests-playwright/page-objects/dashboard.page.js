class DashboardPage {
  constructor(page) {
    this.page = page;
    this.heading = page.locator('h1:text("Dashboard")');
    this.tasksTable = page.locator('#tasksTable');
    this.thead = page.locator('#tasksTable thead');
    this.tbody = page.locator('#tasksTable tbody');
    this.rows = page.locator('#tasksTable tbody tr');
    this.createTaskBtn = page.getByRole('button', { name: /create task/i });
  }
  async waitLoaded({ waitForRows = false } = {}) {
  await this.heading.waitFor();
  await this.tasksTable.waitFor();
  await this.thead.waitFor();


  const tbodyCount = await this.tbody.count();
  if (tbodyCount > 0) {
    await this.tbody.first().waitFor({ state: 'attached' });
  }

 
  if (waitForRows) {
    await this.rows.first().waitFor();
  }
}


  headers() {
    return this.page.locator('#tasksTable thead th');
  }

  async getHeaderTexts() {
  
    return this.headers().allTextContents();
  }

  
async hasAnyRow() {
  return (await this.rows.first().count()) > 0;
}


async waitForAnyRow(timeoutMs = 3000) {
  try {
    await this.rows.first().waitFor({ timeout: timeoutMs });
    return true;
  } catch {
    return false;
  }
}



  rowByTitle(title) {
    return this.page.locator(
      `xpath=//table[@id="tasksTable"]//tbody//tr[td[1][normalize-space()="${title}"]]`
    );
  }

  async clickEditByTitle(title) {
    const editBtn = this.page.locator(
      `xpath=//table[@id="tasksTable"]//tbody//tr[td[1][normalize-space()="${title}"]]//button[normalize-space()="Edit"]`
    );
    await editBtn.first().click();
    await this.page.waitForURL(/task_form\.html/);
  }

  async clickDeleteByTitle(title) {
    const deleteBtn = this.page.locator(
      `xpath=//table[@id="tasksTable"]//tbody//tr[td[1][normalize-space()="${title}"]]//button[normalize-space()="Delete"]`
    );
    await deleteBtn.first().click();
  }

  async waitForRowToAppear(title) {
    await this.rowByTitle(title).first().waitFor();
  }

  async waitForRowToDisappear(title) {
    await this.rowByTitle(title).first().waitFor({ state: 'detached' });
  }

  
  firstEditButton() {
    return this.page.getByRole('button', { name: /edit/i }).first();
  }

  async openCreateTask() {
    await this.createTaskBtn.click();
    await this.page.waitForURL(/task_form\.html/);
  }

  rowByTitleRawHtml(titleLiteral) {
  return this.page.locator('#tasksTable tbody tr').filter({
    has: this.page.locator('td').first().filter({ hasText: titleLiteral }),
  });
}
}


module.exports = { DashboardPage };
