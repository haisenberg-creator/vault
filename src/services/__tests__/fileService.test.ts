import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  readMarkdownFile,
  writeMarkdownFile,
  setMockFileContent,
  getMockFileContent,
  clearMockStorage,
} from "../fileService";

describe("fileService", () => {
  beforeEach(() => {
    clearMockStorage();
    vi.restoreAllMocks();
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
});
