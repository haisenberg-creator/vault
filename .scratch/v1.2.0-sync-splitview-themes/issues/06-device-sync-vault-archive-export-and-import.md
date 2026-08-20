# 06 — Device-to-Device Sync via Vault Archive Export & Import

**What to build:** Enable offline device-to-device synchronization by exporting the active V-Folder into a self-contained `.zip` Vault Archive. Importing a `.zip` archive on any device automatically extracts all contained notes, dashboards, folder hierarchies, and attachments into the V-Folder with a prompt to Replace or Merge conflicting files.

**Blocked by:** 05 — "Import Note/Folder" Mini-Menu, Text-to-MD Conversion & Drag-and-Drop

**Status:** Done

- [x] A "Sync / Export Vault Archive" option is available in the sidebar/settings to export the active V-Folder as a `.zip` archive.
- [x] Selecting or dropping a `.zip` file into the "Import Note/Folder" action extracts all contained notes, folders, and dashboards.
- [x] The user is prompted with Replace vs. Merge conflict resolution when importing into a non-empty workspace.
- [x] All `.md` notes, subfolder structures, and attachments are preserved bit-for-bit.
- [x] Automated tests in `fileService.test.ts` and `ImportFolder.test.tsx` pass.
