import React, { useState, useEffect } from "react";

export type OperationMode =
  "create-note" | "create-folder" | "create-dashboard" | "rename";

export interface FileOperationModalProps {
  isOpen: boolean;
  mode: OperationMode | null;
  targetPath?: string;
  initialValue?: string;
  onSubmit: (name: string, mode: OperationMode, targetPath?: string) => void;
  onClose: () => void;
}

export const FileOperationModal: React.FC<FileOperationModalProps> = ({
  isOpen,
  mode,
  targetPath,
  initialValue = "",
  onSubmit,
  onClose,
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInputValue(initialValue);
    setError(null);
  }, [initialValue, isOpen, mode]);

  if (!isOpen || !mode) {
    return null;
  }

  const getTitle = () => {
    switch (mode) {
      case "create-note":
        return "Create New Note";
      case "create-folder":
        return "Create New Folder";
      case "create-dashboard":
        return "Create Task Dashboard";
      case "rename":
        return "Rename Item";
      default:
        return "";
    }
  };

  const getPlaceholder = () => {
    switch (mode) {
      case "create-note":
        return "e.g. project-notes.md";
      case "create-folder":
        return "e.g. Projects";
      case "create-dashboard":
        return "e.g. overview.dashboard.md";
      case "rename":
        return "Enter new name";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setError("Name cannot be empty");
      return;
    }
    onSubmit(trimmed, mode, targetPath);
    onClose();
  };

  return (
    <div
      data-testid="file-operation-modal"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 13, 22, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "360px",
          backgroundColor: "var(--rose-bg-surface)",
          border: "1px solid rgba(235, 111, 146, 0.3)",
          borderRadius: "var(--radius-md)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
          padding: "20px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontSize: "14px",
            fontFamily: "var(--font-pixel)",
            color: "var(--rose-pink)",
            letterSpacing: "0.5px",
            marginBottom: "12px",
          }}
        >
          {getTitle()}
        </h3>

        {targetPath && (
          <p
            style={{
              fontSize: "11px",
              color: "var(--rose-subtle)",
              fontFamily: "var(--font-mono)",
              marginBottom: "12px",
              wordBreak: "break-all",
            }}
          >
            Target: {targetPath}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <input
            data-testid="file-operation-input"
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (error) setError(null);
            }}
            placeholder={getPlaceholder()}
            autoFocus
            style={{
              width: "100%",
              padding: "8px 12px",
              backgroundColor: "var(--rose-bg-base)",
              border: error
                ? "1px solid var(--rose-pink)"
                : "1px solid rgba(110, 106, 134, 0.3)",
              borderRadius: "var(--radius-sm)",
              color: "var(--rose-text)",
              fontSize: "13px",
              fontFamily: "var(--font-mono)",
              outline: "none",
              marginBottom: error ? "6px" : "16px",
            }}
          />

          {error && (
            <p
              style={{
                fontSize: "11px",
                color: "var(--rose-pink)",
                marginBottom: "12px",
              }}
            >
              {error}
            </p>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
            }}
          >
            <button
              data-testid="modal-cancel-btn"
              type="button"
              onClick={onClose}
              className="tactile-btn"
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid rgba(110, 106, 134, 0.3)",
                backgroundColor: "transparent",
                color: "var(--rose-subtle)",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              data-testid="modal-submit-btn"
              type="submit"
              className="tactile-btn"
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                backgroundColor: "var(--rose-pink)",
                color: "#191724",
                fontWeight: 600,
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
