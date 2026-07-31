# Research: React Rich-Text Editor Frameworks

We need an editor framework for a Notepad++ replacement desktop app (Tauri + React). The core requirements are:

1. Support for custom React components inside the editor (for stateful checklists).
2. Support for custom metadata stored inside the document model (task state: open, in progress, blocked, completed).
3. High performance, even for large documents.

I investigated three major frameworks: **Tiptap**, **Lexical**, and **Slate.js**.

## 1. Tiptap

Tiptap (built on ProseMirror) supports custom React components via the `@tiptap/react` package's `ReactNodeViewRenderer` [1].

- **Embedding:** You define a custom node extension and use `addNodeView()` to return your React component wrapped in `<NodeViewWrapper>`.
- **Metadata:** Tiptap passes a `node` prop to your component, allowing you to access and `updateAttributes` to store task states directly in the document model.
- **Performance:** Tiptap renders Node Views synchronously. The official docs warn that a large number of React Node Views can impact performance and recommend falling back to plain HTML if performance degrades [2].

## 2. Lexical (by Meta)

Lexical uses `DecoratorNodes` to inject arbitrary views like React components into the editor [3].

- **Embedding:** You subclass `DecoratorNode` and implement a `decorate()` method returning the React component. Lexical handles the DOM placeholder, and React renders into it via a portal [4].
- **Metadata:** Lexical strongly encourages keeping the state (like our task status) inside the Lexical node itself (using `getWritable()`) rather than the React component. This ensures clean serialization and synchronization [5].
- **Performance:** Lexical manages decorator nodes efficiently via React portals and separates the DOM management from React, making it highly optimized for large documents and complex state structures.

## 3. Slate.js

Slate is inherently built with React, making it very native to the React ecosystem [6].

- **Embedding:** You use a `renderElement` prop on the `<Editable>` component to switch based on node `type` and return a React component [7].
- **Metadata:** Custom metadata is simply stored as properties on the JSON node object, which are passed as props to your React component.
- **Performance:** Because everything is a React component, rendering very large documents can sometimes hit performance bottlenecks if the `renderElement` isn't aggressively memoized [8].

## Conclusion

For a Notepad++ replacement where documents might grow very large and performance is critical, **Lexical** appears to be the strongest choice.
While Slate and Tiptap are easier to set up initially, Tiptap explicitly warns about the performance of too many React Node Views, and Slate's deep coupling with React's render cycle can struggle with massive plain-text-heavy files. Lexical's architecture separating the model from the React Decorator portals, plus its enforcement of storing state in the Node rather than the Component, makes it the most robust choice for our stateful checklists.

---

### Sources

[1] Tiptap Node Views: https://tiptap.dev/docs/editor/guide/node-views/react
[2] Tiptap Performance Warnings: https://tiptap.dev/docs/editor/guide/node-views/react#performance
[3] Lexical Decorator Nodes: https://lexical.dev/docs/concepts/nodes#decorator-nodes
[4] Lexical React Integration: https://lexical.dev/docs/react/plugins
[5] Lexical Serialization & State: https://lexical.dev/docs/concepts/serialization
[6] Slate custom nodes: https://docs.slatejs.org/walkthroughs/03-defining-custom-elements
[7] Slate renderElement: https://docs.slatejs.org/concepts/09-rendering
[8] Slate Performance considerations: https://docs.slatejs.org/general/performance
