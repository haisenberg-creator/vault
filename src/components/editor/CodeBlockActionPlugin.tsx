import React, { useState, useEffect, useCallback } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $nodesOfType, $getNodeByKey } from "lexical";
import { CodeNode, $isCodeNode } from "@lexical/code-core";
import { Copy, Check } from "lucide-react";
import { copyToClipboard } from "../../services/fileService";

interface CodeBlockOverlay {
  key: string;
  language: string;
  top: number;
  left: number;
  width: number;
}

export const CodeBlockHeader: React.FC<{
  nodeKey: string;
  language: string;
  top: number;
  left: number;
  width: number;
}> = ({ nodeKey, language, top, left, width }) => {
  const [editor] = useLexicalComposerContext();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      let text = "";
      editor.getEditorState().read(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isCodeNode(node)) {
          text = node.getTextContent();
        }
      });

      if (text) {
        await copyToClipboard(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    },
    [editor, nodeKey]
  );

  return (
    <div
      contentEditable={false}
      className="lexical-code-header"
      data-testid="lexical-code-header"
      style={{
        position: "absolute",
        top: `${top + 6}px`,
        left: `${left + 12}px`,
        width: width ? `${width - 24}px` : "calc(100% - 24px)",
        maxWidth: "calc(100% - 24px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        userSelect: "none",
        pointerEvents: "auto",
        zIndex: 5,
      }}
    >
      <span className="lexical-code-lang" data-testid="lexical-code-lang">
        {language ? language.toUpperCase() : "CODE"}
      </span>
      <button
        type="button"
        className="lexical-code-copy-btn tactile-btn"
        data-testid="lexical-code-copy-btn"
        onClick={handleCopy}
        title="Copy code to clipboard"
      >
        {copied ? (
          <>
            <Check size={12} color="var(--rose-pine, #31748f)" />
            <span style={{ color: "var(--rose-pine, #31748f)" }}>Copied!</span>
          </>
        ) : (
          <>
            <Copy size={12} />
            <span>Copy</span>
          </>
        )}
      </button>
    </div>
  );
};

export const CodeBlockActionPlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const [overlays, setOverlays] = useState<CodeBlockOverlay[]>([]);

  const updateOverlays = useCallback(() => {
    editor.getEditorState().read(() => {
      const nodes = $nodesOfType(CodeNode);
      const items: CodeBlockOverlay[] = [];

      for (const node of nodes) {
        const key = node.getKey();
        const element = editor.getElementByKey(key);
        if (element) {
          items.push({
            key,
            language: node.getLanguage() || "",
            top: element.offsetTop || 0,
            left: element.offsetLeft || 0,
            width: element.offsetWidth || 0,
          });
        }
      }

      setOverlays(items);
    });
  }, [editor]);

  useEffect(() => {
    updateOverlays();
    const unregisterListener = editor.registerUpdateListener(() => {
      updateOverlays();
    });

    const rootElement = editor.getRootElement();
    const scrollContainer = rootElement?.parentElement;

    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", updateOverlays, {
        passive: true,
      });
    }
    window.addEventListener("resize", updateOverlays);

    return () => {
      unregisterListener();
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", updateOverlays);
      }
      window.removeEventListener("resize", updateOverlays);
    };
  }, [editor, updateOverlays]);

  return (
    <>
      {overlays.map((overlay) => (
        <CodeBlockHeader
          key={overlay.key}
          nodeKey={overlay.key}
          language={overlay.language}
          top={overlay.top}
          left={overlay.left}
          width={overlay.width}
        />
      ))}
    </>
  );
};
