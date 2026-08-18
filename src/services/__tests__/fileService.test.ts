import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  readMarkdownFile,
  writeMarkdownFile,
  readWorkspaceFiles,
  readWorkspaceTree,
  createFolder,
  createFile,
  deletePath,
  renamePath,
  movePath,
  importFolder,
  setMockFileContent,
  getMockFileContent,
  clearMockStorage,
  normalizePath,
  stripWorkspacePrefix,
  formatShortPath,
  resolveAbsolutePath,
  copyToClipboard,
  revealFileInExplorer,
} from "../fileService";

describe("fileService", () => {
  beforeEach(() => {
    clearMockStorage();
    vi.restoreAllMocks();
  });

  it("normalizes paths consistently", () => {
    expect(normalizePath("Projects\\Client-A\\note.md")).toBe(
      "Projects/Client-A/note.md"
    );
    expect(normalizePath("./Projects/Client-A/")).toBe("Projects/Client-A");
  });

  it("strips workspace prefix from absolute and relative paths", () => {
    expect(
      stripWorkspacePrefix(
        "C:/Users/ANH-NTP/AppData/Local/com.user.vault-app/workspace/Projects/Eucerin.md",
        "C:/Users/ANH-NTP/AppData/Local/com.user.vault-app/workspace"
      )
    ).toBe("Projects/Eucerin.md");
    expect(
      stripWorkspacePrefix(
        "C:/Users/ANH-NTP/AppData/Local/com.user.vault-app/workspace/Projects/Eucerin.md"
      )
    ).toBe("Projects/Eucerin.md");
    expect(stripWorkspacePrefix("workspace/Projects/Eucerin.md")).toBe(
      "Projects/Eucerin.md"
    );
    expect(stripWorkspacePrefix("Projects/Eucerin.md")).toBe(
      "Projects/Eucerin.md"
    );
  });

  it("formats short paths displaying at most the last two path segments", () => {
    expect(formatShortPath("")).toBe("");
    expect(formatShortPath("test-note.md")).toBe("test-note.md");
    expect(formatShortPath("/test-note.md")).toBe("test-note.md");
    expect(formatShortPath("Projects/Vault.md")).toBe("Projects/Vault.md");
    expect(
      formatShortPath("workspace/Projects/Subfolder/DeepNote.md", "workspace")
    ).toBe("Subfolder/DeepNote.md");
    expect(
      formatShortPath(
        "C:/Users/ANH-NTP/AppData/Local/com.user.vault-app/workspace/Projects/Nested/Deep/Task.md",
        "C:/Users/ANH-NTP/AppData/Local/com.user.vault-app/workspace"
      )
    ).toBe("Deep/Task.md");
    expect(formatShortPath("a/b/c/d/e.md")).toBe("d/e.md");
  });

  it("reads mock content when in browser mode", async () => {
    setMockFileContent("test.md", "# Hello World\n- [ ] Task 1");

    const content = await readMarkdownFile("test.md");
    expect(content).toBe("# Hello World\n- [ ] Task 1");
  });

  it("provides default template when reading a non-existent file path in browser mode", async () => {
    const content = await readMarkdownFile("new-doc.md");
    expect(content).toContain("# New Note (new-doc.md)");
  });

  it("writes markdown content and persists in mock storage", async () => {
    const initialPath = "my-notes.md";
    const initialContent = "# Note Title\nInitial body text";

    await writeMarkdownFile(initialPath, initialContent);

    const retrieved = await readMarkdownFile(initialPath);
    expect(retrieved).toBe(initialContent);
    expect(getMockFileContent(initialPath)).toBe(initialContent);
  });

  it("overwrites existing content when writing", async () => {
    const filePath = "workspace.md";
    setMockFileContent(filePath, "Old Content");

    await writeMarkdownFile(filePath, "New Content Updated");

    const updated = await readMarkdownFile(filePath);
    expect(updated).toBe("New Content Updated");
  });

  it("constructs a nested workspace tree identifying folders, notes, and dashboards", async () => {
    setMockFileContent("root-note.md", "# Root Note");
    setMockFileContent("Projects/Client-A/spec.md", "# Client A Spec");
    setMockFileContent(
      "Projects/Client-A/overview.dashboard.md",
      "---\ntype: dashboard\n---"
    );
    await createFolder("Archive/2026");

    const tree = await readWorkspaceTree();

    expect(tree).toHaveLength(3);

    // Root elements sorted: Archive (folder), Projects (folder), root-note.md (file)
    expect(tree[0].name).toBe("Archive");
    expect(tree[0].kind).toBe("folder");
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children![0].name).toBe("2026");

    expect(tree[1].name).toBe("Projects");
    expect(tree[1].kind).toBe("folder");
    expect(tree[1].children).toHaveLength(1);

    const clientA = tree[1].children![0];
    expect(clientA.name).toBe("Client-A");
    expect(clientA.kind).toBe("folder");
    expect(clientA.children).toHaveLength(2);

    expect(clientA.children![0].name).toBe("overview.dashboard.md");
    expect(clientA.children![0].kind).toBe("dashboard");
    expect(clientA.children![0].isDashboard).toBe(true);

    expect(clientA.children![1].name).toBe("spec.md");
    expect(clientA.children![1].kind).toBe("file");

    expect(tree[2].name).toBe("root-note.md");
    expect(tree[2].kind).toBe("file");
  });

  it("creates new folders and files inside nested paths", async () => {
    await createFolder("Work/Sprint1");
    await createFile("Work/Sprint1/tasks.md", "# Sprint 1 Tasks");

    const tree = await readWorkspaceTree();
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe("Work");
    expect(tree[0].children![0].name).toBe("Sprint1");
    expect(tree[0].children![0].children![0].name).toBe("tasks.md");

    const content = await readMarkdownFile("Work/Sprint1/tasks.md");
    expect(content).toBe("# Sprint 1 Tasks");
  });

  it("renames single files and entire folder hierarchies", async () => {
    setMockFileContent("OldFolder/sub/note1.md", "# Note 1");
    setMockFileContent("OldFolder/sub/note2.md", "# Note 2");

    await renamePath("OldFolder", "NewFolder");

    expect(getMockFileContent("OldFolder/sub/note1.md")).toBeUndefined();
    expect(getMockFileContent("NewFolder/sub/note1.md")).toBe("# Note 1");
    expect(getMockFileContent("NewFolder/sub/note2.md")).toBe("# Note 2");

    const tree = await readWorkspaceTree();
    expect(tree[0].name).toBe("NewFolder");
  });

  it("deletes single files and entire folder hierarchies", async () => {
    setMockFileContent("DeleteMe/note.md", "# Note");
    setMockFileContent("KeepMe/note.md", "# Keep");

    await deletePath("DeleteMe");

    expect(getMockFileContent("DeleteMe/note.md")).toBeUndefined();
    expect(getMockFileContent("KeepMe/note.md")).toBe("# Keep");

    const tree = await readWorkspaceTree();
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe("KeepMe");
  });

  it("moves files and folders into destination target directories", async () => {
    setMockFileContent("Drafts/spec.md", "# Draft Spec");
    await createFolder("Projects/Client");

    await movePath("Drafts/spec.md", "Projects/Client");

    expect(getMockFileContent("Drafts/spec.md")).toBeUndefined();
    expect(getMockFileContent("Projects/Client/spec.md")).toBe("# Draft Spec");
  });

  it("reads workspace files recursively across all nested folders", async () => {
    setMockFileContent("note1.md", "# Note 1");
    setMockFileContent("Sub/note2.md", "# Note 2");

    const files = await readWorkspaceFiles();
    expect(files).toHaveLength(2);
    expect(files.map((f) => f.path)).toContain("note1.md");
    expect(files.map((f) => f.path)).toContain("Sub/note2.md");
  });

  it("imports folders and automatically converts .txt files to .md format", async () => {
    const res = await importFolder({
      mockFiles: [
        { path: "Imported/notes.txt", content: "# Text note" },
        { path: "Imported/readme.md", content: "# Markdown readme" },
        { path: "Imported/sub/details.TXT", content: "Sub details" },
      ],
    });

    expect(res.success).toBe(true);
    expect(res.count).toBe(3);

    expect(getMockFileContent("Imported/notes.md")).toBe("# Text note");
    expect(getMockFileContent("Imported/notes.txt")).toBeUndefined();

    expect(getMockFileContent("Imported/readme.md")).toBe("# Markdown readme");

    expect(getMockFileContent("Imported/sub/details.md")).toBe("Sub details");
    expect(getMockFileContent("Imported/sub/details.TXT")).toBeUndefined();
  });

  describe("resolveAbsolutePath", () => {
    it("returns empty string if given empty input", () => {
      expect(resolveAbsolutePath("")).toBe("");
    });

    it("returns Windows absolute paths as-is (normalized)", () => {
      expect(
        resolveAbsolutePath("C:\\Users\\ANH-NTP\\workspace\\Projects\\Note.md")
      ).toBe("C:/Users/ANH-NTP/workspace/Projects/Note.md");
    });

    it("returns Unix absolute paths as-is (normalized)", () => {
      expect(resolveAbsolutePath("/home/user/workspace/Projects/Note.md")).toBe(
        "/home/user/workspace/Projects/Note.md"
      );
    });

    it("resolves relative path against workspaceDir", () => {
      expect(
        resolveAbsolutePath(
          "Projects/Note.md",
          "C:/Users/ANH-NTP/AppData/Local/com.user.vault-app/workspace"
        )
      ).toBe(
        "C:/Users/ANH-NTP/AppData/Local/com.user.vault-app/workspace/Projects/Note.md"
      );
    });

    it("handles relative path that starts with workspace prefix", () => {
      expect(
        resolveAbsolutePath(
          "workspace/Projects/Note.md",
          "C:/Users/ANH-NTP/AppData/Local/com.user.vault-app/workspace"
        )
      ).toBe(
        "C:/Users/ANH-NTP/AppData/Local/com.user.vault-app/workspace/Projects/Note.md"
      );
    });
  });

  describe("copyToClipboard", () => {
    it("copies text using navigator.clipboard.writeText when available", async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      const success = await copyToClipboard("sample text");
      expect(success).toBe(true);
      expect(writeTextMock).toHaveBeenCalledWith("sample text");
    });

    it("returns false and catches error if clipboard API rejects", async () => {
      const writeTextMock = vi
        .fn()
        .mockRejectedValue(new Error("Permission denied"));
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      const success = await copyToClipboard("sample text");
      expect(success).toBe(false);
    });
  });

  describe("revealFileInExplorer", () => {
    it("logs message in browser/non-Tauri mode without erroring", async () => {
      const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      await revealFileInExplorer(
        "Projects/Note.md",
        "C:/Users/ANH-NTP/workspace"
      );
      expect(infoSpy).toHaveBeenCalled();
      infoSpy.mockRestore();
    });

    it("calls revealItemInDir in Tauri environment", async () => {
      const revealMock = vi.fn().mockResolvedValue(undefined);
      vi.doMock("@tauri-apps/plugin-opener", () => ({
        revealItemInDir: revealMock,
      }));

      // Simulate Tauri environment
      Object.assign(window, { __TAURI_INTERNALS__: {} });

      await revealFileInExplorer(
        "Projects/Note.md",
        "C:/Users/ANH-NTP/workspace"
      );

      expect(revealMock).toHaveBeenCalledWith(
        "C:/Users/ANH-NTP/workspace/Projects/Note.md"
      );

      delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
    });
  });
});
