const PLACEHOLDERS = {
  heading: "标题",
  bold: "粗体文本",
  italic: "斜体文本",
  link: "链接文本",
  "ordered-list": "列表项",
  "unordered-list": "列表项",
  quote: "引用内容",
  code: "代码"
};

function wrap(doc, from, to, before, after, placeholder) {
  const selected = doc.slice(from, to);
  const inner = selected || placeholder;
  return {
    from,
    to,
    insert: `${before}${inner}${after}`,
    selection: selected
      ? { anchor: from, head: from + before.length + inner.length + after.length }
      : { anchor: from + before.length, head: from + before.length + inner.length }
  };
}

function prefixLines(doc, from, to, prefixForIndex, placeholder) {
  const lineStart = doc.lastIndexOf("\n", Math.max(0, from - 1)) + 1;
  const nextBreak = doc.indexOf("\n", to);
  const lineEnd = nextBreak === -1 ? doc.length : nextBreak;
  let source = doc.slice(lineStart, lineEnd);
  if (!source && from === to) source = placeholder;
  const lines = source.split("\n");
  const insert = lines.map((line, index) => `${prefixForIndex(index)}${line}`).join("\n");
  return {
    from: lineStart,
    to: lineEnd,
    insert,
    selection: from === to
      ? { anchor: lineStart + prefixForIndex(0).length, head: lineStart + insert.length }
      : { anchor: lineStart, head: lineStart + insert.length }
  };
}

export function createFormatChange(id, doc, from, to) {
  if (from < 0 || to < from || to > doc.length) {
    throw new RangeError("Invalid editor selection");
  }

  switch (id) {
    case "heading":
      return prefixLines(doc, from, to, () => "# ", PLACEHOLDERS.heading);
    case "bold":
      return wrap(doc, from, to, "**", "**", PLACEHOLDERS.bold);
    case "italic":
      return wrap(doc, from, to, "*", "*", PLACEHOLDERS.italic);
    case "link": {
      const selected = doc.slice(from, to);
      const label = selected || PLACEHOLDERS.link;
      const suffix = "](https://example.com)";
      return {
        from,
        to,
        insert: `[${label}${suffix}`,
        selection: selected
          ? { anchor: from, head: from + label.length + suffix.length + 1 }
          : { anchor: from + 1, head: from + 1 + label.length }
      };
    }
    case "ordered-list":
      return prefixLines(doc, from, to, (index) => `${index + 1}. `, PLACEHOLDERS["ordered-list"]);
    case "unordered-list":
      return prefixLines(doc, from, to, () => "- ", PLACEHOLDERS["unordered-list"]);
    case "quote":
      return prefixLines(doc, from, to, () => "> ", PLACEHOLDERS.quote);
    case "code":
      return doc.slice(from, to).includes("\n")
        ? wrap(doc, from, to, "```\n", "\n```", PLACEHOLDERS.code)
        : wrap(doc, from, to, "`", "`", PLACEHOLDERS.code);
    default:
      throw new Error(`Unknown Markdown format command: ${id}`);
  }
}
