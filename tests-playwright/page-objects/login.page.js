class LoginPage {
  constructor(page) {
    this.page = page;
    this.heading = page.locator('h1:text("Login")');
    this.form = page.locator('form#loginForm');
    this.email = page.locator('#email');
    this.password = page.locator('#password');
    this.submitBtn = page.locator('form#loginForm button[type="submit"]');
    this.message = page.locator('#message');
  }

  async goto() {
    await this.page.goto('/'); 
  }

  async login({ email, password }) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submitBtn.click();
    await this.page.waitForURL(/dashboard\.html/);
  }
}
module.exports = { LoginPage };