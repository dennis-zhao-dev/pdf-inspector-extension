import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";

const markdown = new MarkdownIt({
  html: false,
  linkify: false,
  typographer: false
});

const ALLOWED_TAGS = [
  "p", "br", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li",
  "strong", "em", "s", "blockquote", "code", "pre", "hr", "table", "thead",
  "tbody", "tr", "th", "td", "a"
];
const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

export function renderMarkdownPreview(source) {
  const dirty = markdown.render(String(source ?? ""));
  const fragment = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["href", "title"],
    FORBID_TAGS: ["img", "style", "script", "iframe", "object", "embed", "form", "audio", "video", "svg", "math"],
    FORBID_ATTR: ["style", "id", "name"],
    RETURN_DOM_FRAGMENT: true
  });

  fragment.querySelectorAll("a").forEach((link) => {
    try {
      const url = new URL(link.getAttribute("href"), "https://extension.invalid/");
      if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
        link.removeAttribute("href");
        return;
      }
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    } catch {
      link.removeAttribute("href");
    }
  });
  return fragment;
}
