# 01 — Priority Parsing & Dashboard Filtering

**What to build:** The core read-path. If you manually type a `## Urgent` header and put tasks under it, you can configure a Dashboard section with `priority: ["urgent"]` and it will successfully filter and display those tasks.

**Blocked by:** None — can start immediately

**Status:** done

- [x] Parsing logic reads tasks and correctly assigns a priority based on the nearest preceding Priority Header (`## Urgent`, `## High`, `## Low`).
- [x] Priority context resets when encountering a new header.
- [x] Dashboards can be configured with a `priority` filter array.
- [x] Dashboards successfully filter out tasks that do not match the specified priority.
