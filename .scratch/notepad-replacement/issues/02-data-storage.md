Status: resolved
Type: grilling

## Question

How should we persist the user's data locally?

Options to consider:

1. **Plain Markdown files:** Users can open any folder and edit `.md` files. We use custom markdown syntax (e.g., `[ ]`, `[-]`, `[x]`, `[>]`) for the task states. Maximum portability, but harder to store complex metadata.
2. **Local JSON / SQLite DB:** The app manages its own internal storage. Easier to build complex features (like querying all "blocked" tasks across all notes), but users can't easily open the files in other text editors.

## Answer

We will use **Plain Markdown files (.md)**. To support the stateful checklists, we will define custom Markdown syntax (e.g. `[ ]`, `[-]`, `[x]`, `[>]`). This preserves the Notepad++ ethos of opening and editing raw text files anywhere on the user's hard drive while still providing rich UI when opened in our app.
