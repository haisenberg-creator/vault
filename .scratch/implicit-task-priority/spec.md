Status: ready-for-agent

## Problem Statement

Users need a way to assign Priority to Tasks in their Vault, but do not want to pollute their Markdown files with inline tags (e.g., `#urgent`). They want a clean visual representation of task priority while still enabling Task Dashboards to aggregate and filter tasks by Priority.

## Solution

We will introduce Implicit Task Priority via Markdown Headers (Priority Headers). A Task inherits its priority from the nearest preceding Priority Header (e.g., `## Urgent`, `## High`, `## Low`). This keeps the Markdown text human-readable and clean. A "Priority Template" button will be added to the Editor Toolbar to quickly generate these sections. When dragging and dropping tasks from Dashboards into Notes, the system will intelligently append the task under the corresponding Priority Header.

## User Stories

1. As a user, I want to assign priority to tasks by placing them under specific Markdown headings (e.g. `## Urgent`), so that my notes stay visually clean and organized.
2. As a user, I want Task Dashboards to filter tasks by priority (e.g. show only 'urgent' tasks), so that I can see all my most important tasks across my Vault.
3. As a user, I want a "Priority Template" button on the note editor toolbar, so that I can easily insert the priority header structure into my current note without typing it manually.
4. As a user, I want to drag a high-priority task from a Dashboard and drop it into a Note, so that the task is automatically placed under a `## High` priority header in that Note.

## Implementation Decisions

- **Architecture:** We are standardizing on Implicit Task Priority via Markdown Headers rather than inline tags. This is recorded in `docs/adr/0007-implicit-task-priority-via-markdown-headers.md`.
- **Domain Service Parsing:** `parseTasksFromMarkdown` in `workspaceService.ts` will track the current heading level 2 or 3 (`## Priority` or `### Priority`) as it iterates through lines. When it finds a task, it assigns the tracked priority to the `TaskItem`.
- **Domain Service Mutation:** A new function `appendTaskToPriorityHeader` will be created in `workspaceService.ts` to locate existing Priority Headers and insert dragged tasks beneath them (or append a new header if missing).
- **Dashboard API:** Dashboards will gain `priority?: string[]` on `DashboardFilter`.
- **Drag Payload:** `TaskDashboardSidebar.tsx` will serialize the task's `priority` into the JSON payload during `onDragStart`.
- **Drag Target (App.tsx):** `handleMoveTaskToNote` will extract `priority` from the JSON payload and pass it to the file mutator to use the smart priority append logic.
- **Toolbar Component:** `NoteActionBar.tsx` will gain a "Priority Template" button. `EditorPane.tsx` will wire this button to append the template string.

## Testing Decisions

- **Domain Logic Seam:** The primary seam is `workspaceService.ts` (tested in `src/services/__tests__/workspaceService.test.ts`). We will write unit tests for `parseTasksFromMarkdown` to ensure priority is correctly extracted from parent headers. We will also test `appendTaskToPriorityHeader` to ensure it safely appends or creates headers correctly without mangling existing text.
- **Dashboard Logic Seam:** We will test `dashboardService.ts` to ensure that priority filtering works accurately on a collection of `TaskItem`s.
- **UI Seam:** `TaskDashboardSidebar` and `NoteActionBar` can be integration-tested via React Testing Library to ensure the payload includes `priority` and the button calls the callback.

## Out of Scope

- Implicit assignment of priority across multiple nested folders (priority is strictly per-file heading based).
- Complex custom mapping of header text to priority (we strictly look for "Urgent", "High", "Low" for now).
- Backward scanning to magically apply priority if a task is pasted above a header.

## Further Notes

- None.
