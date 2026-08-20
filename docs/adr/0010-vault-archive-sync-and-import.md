# Vault Archive for offline device sync and unified import

Vault uses plain-text Markdown files on the local filesystem. To enable seamless device-to-device synchronization and backups without requiring cloud accounts or remote server infrastructure, Vault provides a self-contained Vault Archive (`.zip`) export and import mechanism.

## Considered Options

- **Cloud / Remote Server Sync** — Requires centralized authentication, hosted databases, and network connectivity. Adds significant complexity and compromises the local-first philosophy.
- **Single JSON / Base64 text bundle** — Bloats binary attachments (images, GIFs) by ~33%, strips standard filesystem compatibility, and risks single-point-of-failure corruption.
- **Vault Archive `.zip` with smart extraction (chosen)** — Archives the entire active V-Folder (markdown notes, folder hierarchy, attachments, dashboards) bit-for-bit. Unpacks seamlessly via the "Import Note/Folder" action with Replace vs Merge strategies.

## Consequences

- Full offline capability and zero lock-in: archives can be opened directly with standard OS archive utilities, transferred over USB/AirDrop/Drive, or imported back into Vault on any platform.
- The "Import Note/Folder" action handles individual `.md`/`.txt` files, directories, and `.zip` archives uniformly.
