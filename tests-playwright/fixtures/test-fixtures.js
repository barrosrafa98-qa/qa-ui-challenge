const { test: base, expect } = require('@playwright/test');
const axios = require('axios');
const Database = require('better-sqlite3');
const path = require('path');

const { LoginPage } = require('../page-objects/login.page');
const { DashboardPage } = require('../page-objects/dashboard.page');
const { TaskFormPage } = require('../page-objects/task-form.page');

const test = base.extend({
 
  api: async ({}, use, testInfo) => {
    const apiBase = testInfo.config.metadata.apiBaseUrl;
    const client = axios.create({
      baseURL: apiBase,
      validateStatus: () => true,
    });

  client.interceptors.request.use(req => {
  console.log(`[API REQ] ${req.method?.toUpperCase()} ${req.baseURL}${req.url}`);
  if (req.data) {
    console.log(`[API REQ BODY]`, req.data);
  }
  return req;
});


client.interceptors.response.use(res => {
  console.log(`[API RES] ${res.status} ${res.config.url}`);
  console.log(`[API RES BODY]`, res.data);
  return res;
},
err => {
  console.error('\n--- API ERROR ---');
  console.error('URL:', err?.config?.url);
  console.error('Message:', err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    }
    console.error('-----------------\n');
    throw err;
  }
);
    await use(client);
  },

  db: async ({}, use, testInfo) => {
    const dbPathRel = testInfo.config.metadata.dbPath;
    const dbPathAbs = path.resolve(process.cwd(), dbPathRel);
    const db = new Database(dbPathAbs, { fileMustExist: true });
    try { await use(db); } finally { db.close(); }
  },

  pages: async ({ page }, use) => {
    await use({
      login: new LoginPage(page),
      dashboard: new DashboardPage(page),
      taskForm: new TaskFormPage(page),
    });
  },


  creds: async ({}, use) => {

    await use({ email: 'alice@mail.com', password: 'alice123' });
  },

  loginAsUser: async ({ pages, db, creds }, use) => {

    await pages.login.goto();
    await pages.login.login(creds);
    await pages.dashboard.waitLoaded();

    
    const user = db.prepare(
      'SELECT id FROM users WHERE email = ? AND password = ?'
    ).get(creds.email, creds.password);

    await use({ ...creds, userId: user?.id });
  },

  dataBuilder: async ({}, use) => {
   
    const makeTaskData = (phase = 'Create') => {
      const ts = Date.now();
      return {
        title: `Test ${phase} ${ts}`,
        description: `${phase} at ${ts}`,
        status: phase === 'Create' ? 'pending' : 'completed',
      };
    };
    await use({ makeTaskData });
  },


  apiTasksForUser: async ({ api }, use) => {
    const fn = async (userId) => {
      const resp = await api.get(`/tasks/${userId}`);
      if (resp.status !== 200) throw new Error(`GET /tasks/${userId} -> ${resp.status}`);
      return Array.isArray(resp.data) ? resp.data : [];
    };
    await use(fn);
  },

  apiFindTaskByTitle: async ({ apiTasksForUser }, use) => {
    const fn = async (userId, title) => {
      const tasks = await apiTasksForUser(userId);
      return tasks.find(t => t.title === title);
    };
    await use(fn);
  },

  apiFindTaskById: async ({ apiTasksForUser }, use) => {
    const fn = async (userId, id) => {
      const tasks = await apiTasksForUser(userId);
      return tasks.find(t => String(t.id) === String(id));
    };
    await use(fn);
  },


  dbGetTaskById: async ({ db }, use) => {
    const stmt = db.prepare('SELECT id, title, description, status, user_id FROM tasks WHERE id = ?');
    const fn = (id) => stmt.get(id);
    await use(fn);
  },


  uiCreateTask: async ({ pages, page }, use) => {
    const fn = async (data) => {
      await pages.dashboard.createTaskBtn.click();
      await page.waitForURL(/task_form\.html/);
      await pages.taskForm.fillAndSubmit(data);
      await pages.dashboard.waitLoaded();
      await pages.dashboard.waitForRowToAppear(data.title);
    };
    await use(fn);
  },

  uiEditTaskByTitle: async ({ pages }, use) => {
    const fn = async (oldTitle, newData) => {
      await pages.dashboard.clickEditByTitle(oldTitle);
      await pages.taskForm.fillAndSubmit(newData);
      await pages.dashboard.waitLoaded();
      await pages.dashboard.waitForRowToAppear(newData.title);
    };
    await use(fn);
  },

   apiCreateTask: async ({ api }, use) => {

    const fn = async ({ userId, title, description, status = 'pending' }) => {
      const resp = await api.post('/tasks', {
        user_id: userId,
        title,
        description,
        status,
      });
      if (resp.status !== 200 || !resp.data?.id) {
        throw new Error(`POST /tasks failed: ${resp.status} ${JSON.stringify(resp.data)}`);
      }
      return resp.data.id;
    };
    await use(fn);
  },


  userIdFromCreds: async ({ db, creds }, use) => {
    const row = db.prepare(
      'SELECT id FROM users WHERE email = ? AND password = ?'
    ).get(creds.email, creds.password);
    await use(row?.id);
  },


  apiUpdateTask: async ({ api }, use) => {
    const fn = async (id, payload) => {
      const resp = await api.put(`/tasks/${id}`, payload);
      return resp;
    };
    await use(fn);
  },


  apiDeleteTask: async ({ api }, use) => {
    const fn = async (id) => {
      const resp = await api.delete(`/tasks/${id}`);
      return resp;
    };
    await use(fn);
  },


  uiDeleteTaskByTitle: async ({ pages }, use) => {
    const fn = async (title) => {
      await pages.dashboard.clickDeleteByTitle(title);
      await pages.dashboard.waitForRowToDisappear(title);
    };
    await use(fn);
  },


  dbCountTasksByTitlePrefix: async ({ db }, use) => {
    const stmt = db.prepare(`
      SELECT COUNT(*) AS c
      FROM tasks
      WHERE title LIKE ?
    `);
    const fn = (prefix) => stmt.get(`${prefix}%`).c;
    await use(fn);
  },

  dbTaskIdsByTitlePrefix: async ({ db }, use) => {
    const stmt = db.prepare(`
      SELECT id
      FROM tasks
      WHERE title LIKE ?
    `);
    const fn = (prefix) => stmt.all(`${prefix}%`).map(r => r.id);
    await use(fn);
  },


  apiDeleteManyTasks: async ({ api }, use) => {
    const fn = async (ids = []) => {
      for (const id of ids) {
        await api.delete(`/tasks/${id}`);
      }
    };
    await use(fn);
  },

dbFk: async ({}, use, testInfo) => {
  const path = require('path');
  const Database = require('better-sqlite3');

  const dbPathRel =
    (testInfo.config.metadata && testInfo.config.metadata.dbPath) ||
    process.env.DB_PATH ||
    'db/seed.db';

  const dbPathAbs = path.resolve(process.cwd(), dbPathRel);
  const db = new Database(dbPathAbs, { fileMustExist: true });
  try {
 
    db.exec('PRAGMA foreign_keys = ON;');
    await use(db);
  } finally {
    db.close();
  }
},


dbInsertTaskRaw: async ({ db }, use) => {
  const stmt = db.prepare(
    'INSERT INTO tasks(user_id, title, description, status) VALUES(?,?,?,?)'
  );
  const fn = (user_id, title, description = '', status = 'pending') => {
    try {
      const info = stmt.run(user_id, title, description, status);
      return { ok: true, id: Number(info.lastInsertRowid) };
    } catch (e) {
      return { ok: false, error: String(e && e.message || e) };
    }
  };
  await use(fn);
},


dbCountTasksByTitleAndUser: async ({ db }, use) => {
  const stmt = db.prepare(
    'SELECT COUNT(*) AS c FROM tasks WHERE title = ? AND user_id = ?'
  );
  const fn = (title, userId) => stmt.get(title, userId).c;
  await use(fn);
},


dbDeleteTaskById: async ({ db }, use) => {
  const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
  const fn = (id) => stmt.run(id).changes;
  await use(fn);
},


dbInsertTaskWithId: async ({ db }, use) => {
  const stmt = db.prepare(
    'INSERT INTO tasks(id, user_id, title, description, status) VALUES(?,?,?,?,?)'
  );
  const fn = (id, userId, title, description = '', status = 'pending') => {
    try {
      const info = stmt.run(id, userId, title, description, status);
      return { ok: true, id: Number(info.lastInsertRowid) };
    } catch (e) {
      return { ok: false, error: String(e && e.message || e) };
    }
  };
  await use(fn);
},


});

 


module.exports = { test, expect };
