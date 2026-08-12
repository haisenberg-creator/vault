# 04 — Implement Editor Task Ergonomics

**What to build:** Clicking "New Task" immediately focuses the cursor on the new task line. Pressing `Enter` on a task line automatically spawns a new task, and pressing `Enter` on an empty task line escapes the list.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Clicking the "New Task" button in the toolbar automatically moves the editor cursor focus to the newly created task line.
- [ ] Pressing `Enter` at the end of a non-empty task line automatically inserts a new uncompleted task (`- [ ] `) on the next line.
- [ ] Pressing `Enter` on a completely empty task line removes the task syntax and converts it into a normal paragraph (escaping the list).
