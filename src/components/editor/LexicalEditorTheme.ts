import type { EditorThemeClasses } from "lexical";

export const theme: EditorThemeClasses = {
  paragraph: "lexical-paragraph",
  quote: "lexical-quote",
  hashtag: "lexical-hashtag",
  heading: {
    h1: "lexical-h1",
    h2: "lexical-h2",
    h3: "lexical-h3",
    h4: "lexical-h4",
    h5: "lexical-h5",
    h6: "lexical-h6",
  },
  list: {
    nested: {
      listitem: "lexical-nested-listitem",
    },
    ol: "lexical-list-ol",
    ul: "lexical-list-ul",
    listitem: "lexical-listitem",
    listitemChecked: "lexical-listitem-checked",
    listitemUnchecked: "lexical-listitem-unchecked",
  },
  link: "lexical-link",
  text: {
    bold: "lexical-text-bold",
    italic: "lexical-text-italic",
    underline: "lexical-text-underline",
    strikethrough: "lexical-text-strikethrough",
    underlineStrikethrough: "lexical-text-underline-strikethrough",
    code: "lexical-text-code",
    highlight: "lexical-text-highlight",
  },
  code: "lexical-code-block",
};

export default theme;
