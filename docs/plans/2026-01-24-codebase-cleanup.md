# RPG Image Generator Codebase Cleanup Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Clean up dead code, unused dependencies, debug artifacts, and improve code organization.

**Architecture:** Remove technical debt accumulated during rapid development. Focus on quick wins first (dead file removal, unused deps), then structural improvements (test organization), and finally database cleanup (unused tables).

**Tech Stack:** Node.js, Express, SQLite3, React, Vite

---

## Task 1: Remove Debug Script

**Files:**
- Delete: `debug_db.js`

**Step 1: Delete the file**

```bash
rm debug_db.js
```

**Step 2: Verify deletion**

```bash
ls debug_db.js 2>&1 || echo "File successfully removed"
```

Expected: "No such file or directory" or "File successfully removed"

**Step 3: Commit**

```bash
git add -A && git commit -m "chore: remove debug_db.js script

No longer needed for development.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Remove Orphaned Test Files

**Files:**
- Delete: `frontend/src/utils/magicBoxSimulation.test.js`
- Delete: `frontend/src/utils/reproduce_issue.test.js`
- Delete: `frontend/src/utils/verify_fix.test.js`

Note: Keep `narrativeParser.test.js` as it contains useful unit tests for the parser.

**Step 1: Delete the orphaned test files**

```bash
rm frontend/src/utils/magicBoxSimulation.test.js
rm frontend/src/utils/reproduce_issue.test.js
rm frontend/src/utils/verify_fix.test.js
```

**Step 2: Verify deletion**

```bash
ls frontend/src/utils/*.test.js
```

Expected: Only `narrativeParser.test.js` remains

**Step 3: Commit**

```bash
git add -A && git commit -m "chore: remove orphaned debug test files

These were one-off debugging scripts, not integrated tests.
Kept narrativeParser.test.js as it contains useful unit tests.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Remove Unused express-rate-limit Dependency

**Files:**
- Modify: `package.json:38` (remove express-rate-limit line)

**Step 1: Verify it's not used**

```bash
grep -r "rate-limit\|rateLimit" --include="*.js" .
```

Expected: No matches in application code (only package.json/package-lock.json)

**Step 2: Remove the dependency**

```bash
npm uninstall express-rate-limit
```

**Step 3: Verify package.json no longer contains it**

```bash
grep "express-rate-limit" package.json || echo "Successfully removed"
```

Expected: "Successfully removed"

**Step 4: Commit**

```bash
git add package.json package-lock.json && git commit -m "chore: remove unused express-rate-limit dependency

Dependency was never integrated into the application.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Remove Commented Debug Middleware from server.js

**Files:**
- Modify: `server.js:124-131`

**Step 1: Read current state to confirm lines**

Verify lines 124-131 contain the commented debug middleware.

**Step 2: Remove the commented block**

Delete these lines from `server.js`:

```javascript
// Remove debugging middleware after fixing the issue
// Debug middleware for session tracking (only in production for now)
// if (process.env.NODE_ENV === 'production') {
//   app.use((req, res, next) => {
//     console.log(`📊 ${req.method} ${req.path} - Session ID: ${req.sessionID} - User: ${req.session?.user?.username || 'None'}`);
//     next();
//   });
// }
```

**Step 3: Verify server still starts**

```bash
npm start &
sleep 3
curl http://localhost:3000/health
pkill -f "node server.js"
```

Expected: `{"status":"healthy",...}`

**Step 4: Commit**

```bash
git add server.js && git commit -m "chore: remove commented debug middleware

Debugging session tracking is no longer needed.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Remove Unused Database Junction Tables

**Files:**
- Modify: `db/database.js:150-164`

The `template_scenes` and `template_characters` tables are created but never used. The application stores IDs as JSON strings in the `templates` table instead.

**Step 1: Verify tables are unused**

```bash
grep -r "template_scenes\|template_characters" --include="*.js" . | grep -v "database.js"
```

Expected: No matches (tables only referenced in schema creation)

**Step 2: Remove the table creation statements**

Remove these lines from `db/database.js`:

```javascript
    // Template usage tracking
    `CREATE TABLE IF NOT EXISTS template_scenes (
      template_id INTEGER,
      scene_id INTEGER,
      PRIMARY KEY (template_id, scene_id),
      FOREIGN KEY (template_id) REFERENCES templates (id),
      FOREIGN KEY (scene_id) REFERENCES scenes (id)
    )`,

    `CREATE TABLE IF NOT EXISTS template_characters (
      template_id INTEGER,
      character_id INTEGER,
      PRIMARY KEY (template_id, character_id),
      FOREIGN KEY (template_id) REFERENCES templates (id),
      FOREIGN KEY (character_id) REFERENCES characters (id)
    )`
```

**Step 3: Verify database still initializes**

```bash
rm -f db/rpg.sqlite  # Remove existing DB to test fresh creation
npm run db:init
```

Expected: "All database tables created successfully"

**Step 4: Commit**

```bash
git add db/database.js && git commit -m "chore: remove unused junction tables from schema

template_scenes and template_characters were created but never used.
The app stores related IDs as JSON strings instead.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Organize Remaining Test File

**Files:**
- Create: `frontend/src/__tests__/` directory
- Move: `frontend/src/utils/narrativeParser.test.js` to `frontend/src/__tests__/narrativeParser.test.js`

**Step 1: Create test directory**

```bash
mkdir -p frontend/src/__tests__
```

**Step 2: Move test file**

```bash
mv frontend/src/utils/narrativeParser.test.js frontend/src/__tests__/narrativeParser.test.js
```

**Step 3: Update import path in test file**

Change the import from:
```javascript
import { parseNarrative } from './narrativeParser.js';
```

To:
```javascript
import { parseNarrative } from '../utils/narrativeParser.js';
```

**Step 4: Commit**

```bash
git add -A && git commit -m "chore: move test file to __tests__ directory

Standard test organization pattern for easier discovery.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Final Verification

**Step 1: Run the application**

```bash
npm run dev &
sleep 3
curl http://localhost:3000/health
curl http://localhost:3000/api/health
```

Expected: Both return healthy status

**Step 2: Build frontend**

```bash
cd frontend && npm run build
```

Expected: Build completes without errors

**Step 3: Stop dev server and commit any missed files**

```bash
pkill -f "nodemon"
git status
```

Expected: Clean working directory (or only untracked files like built artifacts)

---

## Summary

| Task | Description | Risk |
|------|-------------|------|
| 1 | Remove debug_db.js | Low |
| 2 | Remove orphaned test files | Low |
| 3 | Remove unused dependency | Low |
| 4 | Remove commented debug code | Low |
| 5 | Remove unused DB tables | Low |
| 6 | Organize test file | Low |
| 7 | Final verification | N/A |

Total: 7 tasks, all low risk. Each task is independently committable.
