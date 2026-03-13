# GetRDone — App Implementation Plan

## Context
Greenfield Angular v20 app for tracking productivity tasks completed in 25-minute increments (Pomodoro-style). The user needs two pages: a **Setup** page to manage task types, and a **Log** page with a calendar + daily log view. Data persists in `localStorage`. No backend required.

---

## Tech Stack
- Angular v20, standalone components (no NgModules)
- Angular Signals for reactive state
- Angular CDK Dialog for the "Add Task Done" modal
- ng2-charts / Chart.js for the Reports page
- localStorage for persistence
- Plain CSS (CSS custom properties for theming)

---

## Step 1 — Project Scaffolding

Run from `C:\Users\ameli\source\repos\`:
```
ng new GetRDone --directory GetRDone --routing true --style css --standalone true --skip-git true
ng add @angular/cdk   (inside GetRDone/)
npm install ng2-charts chart.js
ng serve              (verify dev server runs)
```

---

## Pages Overview
1. **Log** (`/log`) — default: calendar + daily task log + add task modal
2. **Setup** (`/setup`) — manage task types
3. **Reports** (`/reports`) — date range picker + charts

---

## Step 2 — Data Models

**`src/app/core/models/task-type.model.ts`**
```ts
export interface TaskType {
  id: string;       // crypto.randomUUID()
  name: string;
  color: string;    // CSS hex, e.g. "#4f86c6"
}
```

**`src/app/core/models/task-log-entry.model.ts`**
```ts
export interface TaskLogEntry {
  id: string;
  taskTypeId: string;
  date: string;       // full ISO timestamp; date portion used for filtering
  increments: number; // 1–8 (each = 25 min)
  summary: string;
}
```

---

## Step 3 — Services

### StorageService (`src/app/core/services/storage.service.ts`)
Thin localStorage wrapper. Methods: `get<T>(key): T | null`, `set<T>(key, value): void`.
Keys: `'getrddone_task_types'`, `'getrddone_task_log_entries'`.

### TaskTypeService (`src/app/core/services/task-type.service.ts`)
- `private _taskTypes = signal<TaskType[]>([])` — loaded from localStorage on construction
- `taskTypes = this._taskTypes.asReadonly()`
- `addTaskType(name, color)` — UUID, update signal, persist
- `deleteTaskType(id)` — filter signal, persist (log entries keep orphan entries showing "Unknown Task")

### TaskLogService (`src/app/core/services/task-log.service.ts`)
- `private _entries = signal<TaskLogEntry[]>([])` — loaded on construction
- `addEntry(entry: Omit<TaskLogEntry, 'id'>)` — UUID, push, persist
- `entriesForDate(dateSignal: Signal<string>)` — returns `computed()` filtering by same-day comparison via `new Date(a).toDateString() === new Date(b).toDateString()`
- `datesWithEntries = computed(() => new Set(entries.map(e => new Date(e.date).toDateString())))`

---

## Step 4 — File Structure

```
src/app/
  core/
    models/  (task-type.model.ts, task-log-entry.model.ts)
    services/ (storage.service.ts, task-type.service.ts, task-log.service.ts)
  features/
    setup/
      setup.component.ts/html/css
    log/
      log.component.ts/html/css
      components/
        calendar/          (calendar.component.ts/html/css)
        task-log-list/     (task-log-list.component.ts/html/css)
        add-task-dialog/   (add-task-dialog.component.ts/html/css)
    reports/
      reports.component.ts/html/css
  shared/
    components/
      nav/  (nav.component.ts/html/css)
  app.component.ts/html/css
  app.routes.ts
  app.config.ts
```

---

## Step 5 — Routing (`src/app/app.routes.ts`)

```ts
[
  { path: 'log',     loadComponent: () => import('./features/log/log.component').then(m => m.LogComponent) },
  { path: 'setup',   loadComponent: () => import('./features/setup/setup.component').then(m => m.SetupComponent) },
  { path: 'reports', loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent) },
  { path: '',        redirectTo: 'log', pathMatch: 'full' },
  { path: '**',      redirectTo: 'log' }
]
```

`app.config.ts`: `provideRouter(routes)` + `provideAnimations()` (required for CDK Dialog).

---

## Step 6 — Components

### NavComponent
Three `RouterLink` items ("Log" → `/log`, "Setup" → `/setup`, "Reports" → `/reports`) with `RouterLinkActive`.

### SetupComponent
- List: `@for (type of taskTypeService.taskTypes(); track type.id)` — color swatch + name + Delete button
- Form: `ReactiveFormsModule` with `name` (required) and `color` (`<input type="color">`, default `#4f86c6`) controls
- On submit: `addTaskType(...)`, reset form

### LogComponent
- `selectedDate = signal<string>(new Date().toISOString())`
- `entriesForSelectedDate = taskLogService.entriesForDate(this.selectedDate)`
- Template: `<app-calendar>` on top, "Add Task Done" button + `<app-task-log-list>` below
- `openAddTaskDialog()` opens CDK Dialog with `{ taskTypes, selectedDate: selectedDate() }` as data; on `closed` emits result → calls `taskLogService.addEntry(result)`

### CalendarComponent
**Inputs:** `selectedDate: string`, `datesWithEntries: Set<string>`
**Output:** `daySelected: EventEmitter<string>`
- Internal signals: `viewMonth`, `viewYear`
- Computed `calendarDays` — array of `{ date: Date, inCurrentMonth: boolean }` (35 or 42 cells)
- CSS Grid: `repeat(7, 1fr)` — day cells with `.selected`, `.has-entries` (dot via `::after`), `.other-month` CSS classes
- Prev/Next month buttons update `viewMonth`/`viewYear` signals

### TaskLogListComponent
**Inputs:** `entries: TaskLogEntry[]`, `taskTypes: TaskType[]`
- Look up task type by `taskTypeId` for name + color (fallback: "Unknown Task", grey)
- `formatIncrements(n)`: `n*25 < 60` → `"Xmin"`, else `"Xh Ymin"`
- Entry card: left border colored by task type color, shows name + duration + summary
- Empty state message when `entries.length === 0`

### AddTaskDialogComponent
**CDK Dialog** — receives `DIALOG_DATA: { taskTypes, selectedDate }`, injects `DialogRef`
- ReactiveForm: `taskTypeId` (required select), `increments` (number 1–8, or range slider), `summary` (textarea, optional)
- Shows "Logging for: [formatted date]" (read-only)
- Submit → `dialogRef.close({ taskTypeId, increments, summary, date: DIALOG_DATA.selectedDate })`
- Cancel → `dialogRef.close()` (no arg)

### ReportsComponent (`src/app/features/reports/reports.component.ts/html/css`)

**Date Range Picker:**
- Two `<input type="date">` fields: "From" and "To"
- Defaults: "From" = 7 days ago, "To" = today
- A computed signal `filteredEntries` derives entries between the two dates from `TaskLogService`

**Charts (rendered vertically):**

1. **Stacked Bar Chart — Increments by Task Type per Day**
   - X-axis: each day in the selected range (formatted as "Mar 9")
   - Y-axis: total 25-min increments
   - Each bar is stacked segments colored by task type (using each `TaskType.color`)
   - Dataset per task type: for each day, sum `increments` for that type
   - Uses Chart.js `type: 'bar'` with `stacked: true` option

2. **Line Chart — Tasks Completed per Day**
   - X-axis: same date range
   - Y-axis: count of log entries (distinct tasks logged, not increments)
   - Single line, no stacking
   - Uses Chart.js `type: 'line'`

**ng2-charts integration:**
- Import `NgChartsModule` into `ReportsComponent` imports array
- Use `<canvas baseChart [datasets]="..." [labels]="..." [type]="'bar'" [options]="...">` template syntax
- Chart data recomputed via `computed()` signals whenever date range or entries change

---

## Step 7 — Global Styling

`src/styles.css` — CSS custom properties at `:root`:
- `--color-primary`, `--color-bg`, `--color-surface`, `--color-border`, `--color-text`, `--color-text-muted`, `--radius`, `--shadow`
- `box-sizing: border-box` globally, system font stack
- CDK overlay backdrop: semi-transparent dark background

---

## Step 8 — Implementation Order

1. Scaffold project + install dependencies
2. Models (no dependencies)
3. StorageService
4. TaskTypeService + TaskLogService (verify with console)
5. NavComponent + AppComponent shell + routing (all 3 routes)
6. SetupComponent (full CRUD, verify persistence)
7. CalendarComponent (test navigation + dot indicators with mock data)
8. TaskLogListComponent (test display with mock entries)
9. AddTaskDialogComponent (verify CDK Dialog + form)
10. LogComponent integration (wire everything together)
11. ReportsComponent (date range picker + ng2-charts stacked bar + line chart)
12. Styling pass (CSS variables, responsive layout)

---

## Verification Checklist

- `/` redirects to `/log`; all 3 nav links work
- Setup: create task type → appears immediately (signal reactivity); reload → persists
- Log: today selected by default; click different day → list updates
- "Add Task Done" → modal opens with task type dropdown populated
- Submit entry → appears in list; calendar shows dot for that day; reload → entry persists
- Delete task type on Setup → log entries show "Unknown Task" gracefully
- DevTools → Application → localStorage: both keys contain valid JSON
- Reports: date range defaults to last 7 days; both charts render with correct data
- Reports: change date range → charts update reactively
- Reports: stacked bar colors match task type colors from Setup
