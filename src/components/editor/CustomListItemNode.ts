import { ListItemNode, SerializedListItemNode } from "@lexical/list";
import { EditorConfig, LexicalNode, NodeKey, Spread } from "lexical";

export type SerializedCustomListItemNode = Spread<
  {
    marker?: string;
  },
  SerializedListItemNode
>;

export class CustomListItemNode extends ListItemNode {
  __marker?: string;

  static getType(): string {
    return "custom-listitem";
  }

  static clone(node: CustomListItemNode): CustomListItemNode {
    const cloneNode = new CustomListItemNode(
      node.__value,
      node.__checked,
      node.__marker,
      node.__key
    );
    return cloneNode;
  }

  constructor(
    value?: number,
    checked?: boolean,
    marker?: string,
    key?: NodeKey
  ) {
    super(value, checked, key);
    this.__marker = marker;
  }

  getMarker(): string | undefined {
    return this.__marker;
  }

  setMarker(marker: string | undefined): void {
    const writable = this.getWritable();
    writable.__marker = marker;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    if (this.__marker) {
      dom.setAttribute("data-marker", this.__marker);
    }
    return dom;
  }

  updateDOM(
    prevNode: CustomListItemNode,
    dom: HTMLElement,
    config: EditorConfig
  ): boolean {
    const updated = super.updateDOM(prevNode, dom, config);
    if (this.__marker !== prevNode.__marker) {
      if (this.__marker) {
        dom.setAttribute("data-marker", this.__marker);
      } else {
        dom.removeAttribute("data-marker");
      }
    }
    return updated;
  }

  static importJSON(
    serializedNode: SerializedCustomListItemNode
  ): CustomListItemNode {
    const node = $createCustomListItemNode(
      serializedNode.value,
      serializedNode.checked,
      serializedNode.marker
    );
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }

  exportJSON(): SerializedCustomListItemNode {
    return {
      ...super.exportJSON(),
      marker: this.__marker,
      type: "custom-listitem",
      version: 1,
    };
  }
}

export function $createCustomListItemNode(
  value?: number,
  checked?: boolean,
  marker?: string
): CustomListItemNode {
  return new CustomListItemNode(value, checked, marker);
}

export function $isCustomListItemNode(
  node: LexicalNode | null | undefined
): node is CustomListItemNode {
  return node instanceof CustomListItemNode;
}
