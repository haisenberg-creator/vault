import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  formatShortPath,
  stripWorkspacePrefix,
} from "../../services/fileService";

export interface QuickSwitcherNote {
  path: string;
  name?: string;
  content?: string;
}

export interface QuickSwitcherProps {
  isOpen: boolean;
  notes: QuickSwitcherNote[];
  activeFilePath?: string;
  workspaceDir?: string;
  onSelectNote: (path: string) => void;
  onClose: () => void;
}

/**
 * Calculates a fuzzy match score between a search query and a note's name/path.
 * Returns a score > 0 if matched, or 0 if no match.
 */
export function calculateFuzzyScore(
  query: string,
  targetName: string,
  targetPath: string
): number {
  const q = query.trim().toLowerCase();
  if (!q) return 1;

  const name = targetName.toLowerCase();
  const path = targetPath.toLowerCase();

  // 1. Exact match on name (without .md) or full name
  const cleanName = name.replace(/\.md$/i, "");
  if (name === q || cleanName === q) {
    return 1000;
  }

  // 2. Name starts with query
  if (name.startsWith(q) || cleanName.startsWith(q)) {
    return 800 + (100 - Math.min(100, name.length));
  }

  // 3. Name contains query as a substring
  const nameIndex = name.indexOf(q);
  if (nameIndex !== -1) {
    return 600 - nameIndex * 10 + (50 - Math.min(50, name.length));
  }

  // 4. Path contains query as a substring
  const pathIndex = path.indexOf(q);
  if (pathIndex !== -1) {
    return 400 - pathIndex * 5;
  }

  // 5. Fuzzy character subsequence match in name
  let nameScore = 0;
  let qIdx = 0;
  let prevMatchIdx = -2;
  let matchGaps = 0;

  for (let i = 0; i < name.length && qIdx < q.length; i++) {
    if (name[i] === q[qIdx]) {
      nameScore += 10;
      // Consecutive character bonus
      if (i === prevMatchIdx + 1) {
        nameScore += 15;
      } else if (prevMatchIdx >= 0) {
        matchGaps += i - prevMatchIdx - 1;
      }
      // Word start bonus (after -, _, ., space)
      if (i === 0 || /[-_.\s]/.test(name[i - 1])) {
        nameScore += 20;
      }
      prevMatchIdx = i;
      qIdx++;
    }
  }

  // Only consider name subsequence if all query chars found and not excessively sparse
  if (qIdx === q.length && (matchGaps < name.length * 0.8 || q.length <= 3)) {
    return 200 + nameScore - matchGaps * 2;
  }

  // 6. Fuzzy character subsequence match in path (only if chars match at path/word boundaries or high density)
  let pathScore = 0;
  qIdx = 0;
  prevMatchIdx = -2;
  let boundaryMatches = 0;

  for (let i = 0; i < path.length && qIdx < q.length; i++) {
    if (path[i] === q[qIdx]) {
      const isBoundary = i === 0 || /[-_.\s/]/.test(path[i - 1]);
      if (isBoundary) {
        boundaryMatches++;
        pathScore += 25;
      } else {
        pathScore += 5;
      }
      if (i === prevMatchIdx + 1) {
        pathScore += 12;
      }
      prevMatchIdx = i;
      qIdx++;
    }
  }

  // If matching across path, require at least half of query characters to match word/folder boundaries or consecutive chunks
  if (
    qIdx === q.length &&
    (boundaryMatches >= Math.min(2, q.length) || pathScore >= 50)
  ) {
    return 100 + pathScore;
  }

  return 0;
}

export const QuickSwitcher: React.FC<QuickSwitcherProps> = ({
  isOpen,
  notes,
  activeFilePath,
  workspaceDir = "workspace",
  onSelectNote,
  onClose,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    // Deduplicate notes by path
    const seen = new Set<string>();
    const uniqueNotes = notes.filter((n) => {
      if (!n.path || seen.has(n.path)) return false;
      seen.add(n.path);
      return true;
    });

    if (!query.trim()) {
      return uniqueNotes;
    }

    const scored = uniqueNotes
      .map((note) => {
        const name =
          note.name ||
          note.path.split("/").pop() ||
          note.path.split("\\").pop() ||
          note.path;
        const score = calculateFuzzyScore(query, name, note.path);
        return { note, score };
      })
      .filter((item) => item.score > 0);

    scored.sort((a, b) => b.score - a.score);
    return scored.map((item) => item.note);
  }, [notes, query]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  // Keep selected index within bounds
  useEffect(() => {
    if (selectedIndex >= filteredNotes.length) {
      setSelectedIndex(Math.max(0, filteredNotes.length - 1));
    }
  }, [filteredNotes.length, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedEl = listRef.current.querySelector(
      `[data-item-index="${selectedIndex}"]`
    );
    if (selectedEl && typeof selectedEl.scrollIntoView === "function") {
      selectedEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Handle global Escape key when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filteredNotes.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % filteredNotes.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filteredNotes.length > 0) {
        setSelectedIndex((prev) =>
          prev - 1 < 0 ? filteredNotes.length - 1 : prev - 1
        );
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredNotes[selectedIndex]) {
        onSelectNote(filteredNotes[selectedIndex].path);
        onClose();
      }
    }
  };

  return (
    <div
      data-testid="quick-switcher-modal"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 13, 22, 0.75)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "15vh",
        zIndex: 10000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "560px",
          maxWidth: "92vw",
          backgroundColor: "var(--rose-bg-surface, #1f1d2e)",
          border: "1px solid rgba(235, 111, 146, 0.35)",
          borderRadius: "8px",
          boxShadow:
            "0 16px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(235, 111, 146, 0.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderBottom: "1px solid rgba(110, 106, 134, 0.2)",
            backgroundColor: "rgba(38, 35, 58, 0.5)",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--rose-pink, #eb6f92)", flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            ref={inputRef}
            data-testid="quick-switcher-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search notes by name or path... (↑↓ to navigate, Enter to select, Esc to dismiss)"
            autoFocus
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--rose-text, #e0def4)",
              fontSize: "14px",
              fontFamily: "var(--font-sans, inherit)",
            }}
          />

          <span
            style={{
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              color: "var(--rose-subtle, #908caa)",
              backgroundColor: "rgba(110, 106, 134, 0.2)",
              padding: "2px 6px",
              borderRadius: "4px",
              flexShrink: 0,
            }}
          >
            ESC to close
          </span>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          data-testid="quick-switcher-results"
          style={{
            maxHeight: "360px",
            overflowY: "auto",
            padding: "6px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {filteredNotes.length === 0 ? (
            <div
              data-testid="quick-switcher-empty"
              style={{
                padding: "24px 16px",
                textAlign: "center",
                color: "var(--rose-subtle, #908caa)",
                fontSize: "13px",
                fontFamily: "var(--font-sans, inherit)",
              }}
            >
              No matching notes found for "{query}"
            </div>
          ) : (
            filteredNotes.map((note, index) => {
              const isSelected = index === selectedIndex;
              const fileName =
                note.name ||
                note.path.split("/").pop() ||
                note.path.split("\\").pop() ||
                note.path;
              const relativePath = stripWorkspacePrefix(
                note.path,
                workspaceDir
              );
              const dirPath = relativePath.includes("/")
                ? relativePath.substring(0, relativePath.lastIndexOf("/"))
                : "";
              const isActive =
                activeFilePath &&
                (note.path === activeFilePath ||
                  formatShortPath(note.path, workspaceDir) ===
                    formatShortPath(activeFilePath, workspaceDir));

              return (
                <div
                  key={note.path}
                  data-testid={`quick-switcher-item-${note.path}`}
                  data-item-index={index}
                  data-selected={isSelected ? "true" : "false"}
                  onClick={() => {
                    onSelectNote(note.path);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    backgroundColor: isSelected
                      ? "rgba(235, 111, 146, 0.15)"
                      : "transparent",
                    borderLeft: isSelected
                      ? "3px solid var(--rose-pink, #eb6f92)"
                      : "3px solid transparent",
                    transition: "all 100ms ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      minWidth: 0,
                    }}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        color: isSelected
                          ? "var(--rose-pink, #eb6f92)"
                          : "var(--rose-subtle, #908caa)",
                        flexShrink: 0,
                      }}
                    >
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>

                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: isSelected ? 600 : 500,
                        color: isSelected
                          ? "var(--rose-text, #e0def4)"
                          : "var(--rose-subtle, #908caa)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fileName}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexShrink: 0,
                      marginLeft: "12px",
                    }}
                  >
                    {dirPath && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontFamily: "var(--font-mono)",
                          color: "var(--rose-muted, #6e6a86)",
                        }}
                      >
                        {dirPath}
                      </span>
                    )}

                    {isActive && (
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "1px 5px",
                          borderRadius: "3px",
                          backgroundColor: "rgba(156, 207, 216, 0.15)",
                          color: "var(--rose-foam, #9ccfd8)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        active
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: "8px 16px",
            borderTop: "1px solid rgba(110, 106, 134, 0.15)",
            backgroundColor: "rgba(25, 23, 36, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "11px",
            color: "var(--rose-muted, #6e6a86)",
          }}
        >
          <span>
            {filteredNotes.length} note{filteredNotes.length === 1 ? "" : "s"}
          </span>
          <div style={{ display: "flex", gap: "12px" }}>
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Dismiss</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickSwitcher;
