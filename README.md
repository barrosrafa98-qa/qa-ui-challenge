    QA UI Automation Challenge


Approach & Strategy
This project was designed with a focus on end-to-end validation, ensuring that the UI, API, and database remain consistent. The automation framework emphasizes maintainability, reliability, and ease of onboarding for new contributors.

Reusable Methods & Patterns
Page Objects: Encapsulate UI interactions for maintainable and readable tests.
Helpers: Shared logic for API calls, schema validation, and data setup.
Fixtures: Ensure consistent test environments and deterministic cleanup.

    Fixes Applied to Original Application

During setup, a few issues in the provided code were fixed:
Database path in server.js
Original code couldn’t open the database (SQLITE_CANTOPEN).
Fixed by resolving the DB path explicitly with path.resolve.

Create Task and Edit Task functionality in UI
Original app.js had no handlers for creating or updating tasks.
Added logic in task_form.html and app.js to:
Detect when creating a new task (no id in query string).
Detect when editing an existing task (?id=<taskId>).
POST new tasks to /tasks.
PUT updates to /tasks/:id.

Playwright test stability
Adjusted Page Objects to handle optional elements (tbody, #message).
Added conditional seeding via API if no tasks exist.
Refactored methods (fillAndSubmit, waitLoaded) to support both success and error flows.


This project demonstrates an end-to-end automation framework validating consistency across UI, API, and Database layers.

It uses:

SQLite for the database

Express.js for the API

Static HTML/JS for the UI

Playwright for automation tests

I recommend using VSCode to run this project



    Prerequisites

You need the following installed on your system:

Node.js (v18 or later recommended)

npm (comes with Node.js)

SQLite3 (command line tools)



    Verify installations

Run in your terminal:

node -v
npm -v
sqlite3 -version


If all three commands return versions, you are ready.
If not, follow the installation steps below.



    Windows (PowerShell)

winget install OpenJS.NodeJS.LTS
winget install SQLite.SQLite

AFTER INSTALLING, IT IS NECESSARY TO RESTART VSCODE



    Project Setup

Extract the .zip file to any folder (e.g. C:\qa-ui-challenge).

Open the folder in your IDE (VSCode recommended).

Open a terminal / PowerShell in the project root.



    Database Setup

The project includes a SQLite schema (db/init.sql) and a database file (db/seed.db).

If you need to recreate the database from scratch, run the appropriate command for your operating system:

    Windows (PowerShell or CMD)
sqlite3 db/seed.db ".read db/init.sql"

    Verify the database

Open the SQLite shell and check:

sqlite3 db/seed.db
.tables
SELECT * FROM users;
.exit

You should see the tables (users, tasks, feedback) and some seeded rows.



    API & UI Setup

Install dependencies and start everything with a single command:

cd qa-ui-challenge
npm install
npm run start:all

If you have problems running the npm install, you may need to run it with "Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force"

    This launches:

API on http://localhost:3000
Swagger docs: http://localhost:3000/swagger
UI on http://localhost:8080
Stop both servers with CTRL + C.

    Running Automated Tests

We use Playwright with JavaScript.

1. Install Playwright (once):

cd qa-ui-challenge
npm init playwright@latest -- --no-examples --javascript
if you have problems running this command, you may need to run it with "Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force" as well
(Choose: JavaScript, enable browsers download when prompted.)


2. We'll need to install ajv-formats for the contract tests

npm i -D ajv ajv-formats
We have the snapshots already present in the project, but if it is ever needed to update the snapshot, the following command can be used for it
npx playwright test tests-playwright/api/contract_get.spec.js --config=tests-playwright/playwright.config.js --update-snapshots


3. How to run the tests

Run all tests:
npm run test
Run a specific test:
This project includes tags that allow us to run specific tests (@api, @e2e, @db, @negative, @contract) for selective runs.
Example: npm run test:e2e


4. Show HTML report
npm run report

    
    
    Available Tests


UI Mapping Test

Logs in, verifies page elements, ensures at least one task exists 
(creates via API if needed, reloads dashboard if seeded late), and opens the Task Form.
Validates all elements in all pages (Login, Dashboard, Task Form).


CRUD E2E Test

Creates a task via UI, validates consistency across UI, API and DB.
Updates the task and checks consistency.
Deletes the task and confirms removal in API and DB.


API Happy Path Tests

Validates POST, PUT, DELETE flows for tasks.
Covers cases like empty description (allowed).


API Negative Tests

Documents behavior for invalid inputs: missing user_id, empty title, invalid status, duplicate deletions.
Validates that DB state remains consistent. 
(Some of those scenarios are not really supported by current application, since it does not validate that in the API layer, so I worked around it).


Robustness E2E Tests

API failure on submit: simulate 500 on /tasks and UI shows error and stays on form.
Stale data: update a task via API while form is open, dashboard reflects new data after reload.
Race conditions: deleting the same task from two contexts, UI stays consistent.


DB Integrity Tests

Validate seeded data in SQLite.
Check relationships between users, tasks, and feedback remain consistent.


API Contract Tests

Validate responses against Swagger schema using AJV.
Generate and compare structural snapshots for stability.


Security Tests (XSS Defense)

Creates a task with malicious HTML (<img onerror=...>).
Current Application behavior allows it, but I developed it either way as an example scenario


    Summary

This project demonstrates:

End-to-end automation across UI, API, and DB.
Proper environment setup and troubleshooting.
Fixes to make the original application fully functional (create/edit tasks).
A maintainable automation framework with fixtures, reusable helpers, and Page Objects.
Coverage of happy paths, negatives, robustness, database integrity, contract validation, and basic security scenarios.
Improved experience with a few simple scripts, to run full stack, target specific suites and open reports.
Deterministic cleanup after tests to keep DB state stable. 
