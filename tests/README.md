# Test layout

- `unit/`: deterministic formatting, editor state, and preview security.
- `integration/`: Popup/editor plus unchanged Manifest and Worker contracts.
- `e2e/`: built Manifest V3 extension behavior in Playwright Chromium.
- `fixtures/`: representative, hostile, and generated large Markdown.

## Bilingual UI architecture

- `src/locales/en.js` is the canonical fallback catalog; `src/locales/zh-CN.js` must keep exact key and named-placeholder parity.
- `src/i18n.js` normalizes locale tags, resolves saved/browser/navigator preference order, interpolates named parameters, and applies declarative `data-i18n*` DOM markers as plain text or safe attributes.
- Popup business state stores semantic message keys and parameters. PDF text, Markdown, filenames, URLs, and export bytes are never translated.
- The manual choice is stored at `pdfInspector.uiLanguage` in extension-origin `localStorage`; storage failures must not break the active session.

## Bilingual validation

- Unit tests cover locale normalization, fallback, interpolation, preference failures, and editor reconfiguration.
- Integration tests enforce catalog parity, semantic dynamic values, unchanged Manifest/Worker contracts, and locale-independent Markdown bytes.
- E2E tests cover switching, persistence, copy-feedback timing, keyboard access, `<html lang>`, 800/600 px layout, PDF parsing, and export.
- When adding UI copy, add the English key first, add its Chinese counterpart with the same placeholders, mark the relevant HTML attribute or render it through semantic state, and run all three commands below.

Run `npm test`, `npm run test:e2e`, and `npm run build`. Record large-document timing with the browser and machine used because the two-second target depends on a reference environment.
