---
status: accepted
---

# Implicit Task Priority via Markdown Headers

We decided that a Task's priority level is determined implicitly by the nearest preceding Markdown heading (e.g., `## Urgent`, `## High`, `## Low`), rather than via inline metadata tags on the task itself (like `#urgent`).

We chose this to keep the Markdown text clean and human-readable, as users naturally group tasks under headers to organize their notes visually. While this introduces a structural dependency where a Task can lose its priority if manually copy-pasted out from under its header, it allows us to build smart drag-and-drop behaviors (e.g., dropping a Task from a Dashboard into a Note automatically places it under the correct Priority Header).
