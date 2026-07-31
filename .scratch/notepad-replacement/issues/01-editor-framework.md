Status: resolved
Type: research

## Question

Which React rich-text editor framework (e.g., TipTap, Lexical, Slate, ProseMirror) is the best choice for building a single rich document that supports custom, stateful checklist blocks (with states: open, in progress, blocked, completed)?

Requirements for the editor:

- Easy to embed custom React components for the checklist items.
- Extensible enough to store custom metadata (the task state) in the document model.
- Good performance for a desktop app.

## Answer

Based on our [research](./../research-editor-frameworks.md), **Lexical** is the recommended choice. While Tiptap and Slate both support custom React nodes easily, Tiptap warns about performance issues with many React Node Views, and Slate can struggle on massive documents. Lexical's `DecoratorNode` architecture with React portals is highly optimized for performance and cleanly separates document state from the React view, making it ideal for our custom stateful checklists.
