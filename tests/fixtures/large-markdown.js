import { createHash } from "node:crypto";

export function createLargeMarkdown(length = 500_000) {
  const block = "# Heading\n\n- item one\n- item two\n\n```js\nconst x = 1;\n```\n\n";
  return block.repeat(Math.ceil(length / block.length)).slice(0, length);
}

export function contentHash(content) {
  return createHash("sha256").update(content).digest("hex");
}
