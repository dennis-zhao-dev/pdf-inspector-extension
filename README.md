# 📄 PDF Inspector

A beautifully designed Chrome extension that intelligently converts PDFs to Markdown, powered by WASM-based PDF processing.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Manifest](https://img.shields.io/badge/manifest-v3-green)

---

## ✨ Features

### 🎯 Core Capabilities
- **Local PDF Upload** - Convert PDFs from your computer to Markdown
- **URL-Based Loading** - Process PDFs directly from HTTP/HTTPS URLs
- **Auto-Detection** - Automatically detect PDF links from your current browser tab
- **Adobe Plugin Support** - Extract and process PDFs from Adobe PDF viewer plugin format
- **Markdown Output** - Clean, structured Markdown conversion with page markers
- **Markdown Editor** - Edit results with syntax highlighting, formatting controls, and a safe preview
- **Bilingual UI** - Switch between Simplified Chinese and English with a remembered preference
- **One-Click Copy** - Copy results to clipboard with visual feedback
- **Direct Download** - Save Markdown output as `.md` files with automatic naming

### 🎨 Design
- **Fixed-Width Layout** - 800px-wide popup with vertically scrollable content when needed
- **Status Indicators** - Real-time textual feedback reinforced with status colors
- **Tab Navigation** - Clean interface for switching between input methods

### ⚡ Performance
- **Web Worker Processing** - Non-blocking background PDF conversion
- **WASM Integration** - Fast, efficient PDF processing via WebAssembly
- **Compact Profile** - Optimized markdown generation with page markers
- **Async Operations** - Smooth UI responsiveness during processing

---

## 🚀 Quick Start

### Installation

1. **Clone or download this repository**
   ```bash
   git clone https://github.com/dennis-zhao-dev/pdf-inspector-extension.git
   cd pdf-inspector-extension
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the generated `dist/` folder
   - The extension icon should appear in your toolbar

### Usage

#### Method 1: Local File Upload
1. Click the PDF Inspector extension icon
2. Go to **Local file**
3. Click **Choose PDF file** and select a PDF
4. Wait for processing to complete
5. Copy or download the Markdown result

#### Method 2: URL Input
1. Open the extension popup
2. Go to **URL link**
3. Paste a PDF URL (e.g., `https://example.com/document.pdf`)
4. Click **Load PDF**
5. View results and export

#### Method 3: Auto-Detection
1. Open a direct PDF URL, including a PDF displayed by Chrome's built-in viewer
2. Open the extension; it detects the current tab's PDF URL
3. The URL is automatically populated in the URL tab
4. Click **Load PDF / 加载 PDF** to process

---

## 📁 Project Structure

```
pdf-inspector-extension/
├── src/
│   ├── popup.html          # Extension popup UI
│   ├── popup.js            # Main business logic & event handlers
│   ├── editor.js           # CodeMirror editor controller
│   ├── markdown-format.js  # Markdown formatting transactions
│   ├── markdown-preview.js # Sanitized Markdown preview
│   ├── i18n.js             # Locale resolution and UI translation
│   ├── locales/            # English and Simplified Chinese catalogs
│   ├── worker.js           # Background PDF processing
│   └── styles.css          # Design system & styling
├── public/
│   └── manifest.json       # Chrome extension configuration
├── tests/                  # Unit, integration, and extension E2E tests
├── package.json            # Dependencies & build config
├── vite.config.js          # Vite bundler configuration
├── vitest.config.js        # Unit/integration test configuration
├── playwright.config.js    # Browser E2E test configuration
├── SPEC.md                 # Product requirements specification
├── AGENT.md                # Codex Agent configuration
└── README.md               # This file
```

---

## 🔧 Development

### Build & Test

**Development server** (useful for UI work; it is not the unpacked extension build):
```bash
npm run dev
```

**Production build**:
```bash
npm run build
```

**Automated tests**:
```bash
npm test
npm run test:e2e
```

The editor toolbar supports headings, bold, italic, links, ordered and unordered lists, quotes, and code. The preview is derived from the current Markdown source, blocks raw active content and remote embeds, and never replaces the source used by Copy or Download. Editor content is session-only and is discarded when the popup closes.

**Reload extension in Chrome**:
- Run `npm run build` after source changes
- After changes, go to `chrome://extensions/`
- Click the reload icon on the PDF Inspector card

### Development Tools

**View Extension Console**:
- Go to `chrome://extensions/`
- Find "PDF Inspector"
- Click **"Details"** → scroll down to "Errors"
- Console logs from popup.js and worker.js appear here

**Debug Popup**:
- Go to `chrome://extensions/`
- Find "PDF Inspector"
- Click **"Errors"** to see console output
- Or inspect the popup: Click the extension icon, right-click → "Inspect popup"

---

## 📚 Technical Details

### Architecture

```
┌─────────────────────────────────────────┐
│          Chrome Extension Popup         │
│ (popup + editor + i18n + local catalogs)│
├─────────────────────────────────────────┤
│       File/URL Input & Processing       │
│  (Local files, HTTP/HTTPS URLs)         │
├─────────────────────────────────────────┤
│       Background Web Worker             │
│  (worker.js - Non-blocking processing)  │
├─────────────────────────────────────────┤
│  @firecrawl/pdf-inspector-wasm (WASM)   │
│  (Core PDF → Markdown conversion)       │
└─────────────────────────────────────────┘
```

### Key Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Build** | Vite | Fast bundling and hot reload |
| **PDF Processing** | @firecrawl/pdf-inspector-wasm | WASM-based PDF conversion |
| **Architecture** | Manifest V3 | Modern Chrome extension standard |
| **Worker** | Web Workers | Background processing |
| **Editor** | CodeMirror 6 | Markdown editing and formatting |
| **Preview** | markdown-it + DOMPurify | Rendered and sanitized Markdown preview |
| **Localization** | Bundled JS catalogs | Runtime English/Chinese switching |
| **Styling** | CSS3 | Responsive, beautiful UI |

### Message Flow

1. **User uploads PDF** → popup.js processes file
2. **popup.js sends message** → `worker.postMessage({buffer, fileName})`
3. **Worker receives** → worker.js converts to Uint8Array
4. **WASM processes** → `processPdf(pdfBytes, {profile: "compact", ...})`
5. **Worker responds** → `postMessage({ok: true, result: {...}})`
6. **popup.js receives** → Updates UI with Markdown output

---

## 🔒 Security & Permissions

### Required Permissions

- **`activeTab`** - Access current browser tab (for auto-detection)
- **`downloads`** - Save Markdown files
- **Host access: `http://*/*`, `https://*/*`** - Load PDFs from HTTP(S) URLs
- **CSP: `wasm-unsafe-eval`** - Permit the bundled WebAssembly module to execute

### Security Features

✅ **URL Validation** - Validates PDF URLs before fetching  
✅ **Content-Type Check** - Verifies downloaded files are PDFs  
✅ **Error Handling** - Graceful error messages, no data leaks  
✅ **Local Processing** - All PDFs processed locally, no external servers  
✅ **No Data Collection** - No telemetry or user tracking  

---

## 🎯 Feature Status & Roadmap

### Current (v0.1.0)
- ✅ Local file upload with validation
- ✅ HTTP/HTTPS URL loading
- ✅ PDF auto-detection from browser tab
- ✅ Adobe PDF plugin URL extraction
- ✅ Markdown conversion with page markers
- ✅ Copy to clipboard
- ✅ Download as .md file
- ✅ Markdown editing, formatting, and sanitized preview
- ✅ Simplified Chinese and English UI with persistent selection
- ✅ Real-time status feedback
- ✅ Error handling & validation

### Planned (Future Enhancements)
- 🔜 OCR support for image-based PDFs
- 🔜 Batch processing multiple PDFs
- 🔜 Page range selection
- 🔜 Custom output formats (HTML, JSON, etc.)
- 🔜 Processing history
- 🔜 Custom styling options
- 🔜 Cloud integration
- 🔜 Advanced text extraction

---

## 📖 Documentation

### In This Repository
- **[SPEC.md](SPEC.md)** - Product Requirements Specification
  - Product goals and supported user flows
  - Functional requirements and data contracts
  - Security, reliability, and testability requirements
  - Acceptance criteria and candidate roadmap

- **[AGENT.md](AGENT.md)** - Codex Agent Configuration
  - Codex-assisted development guidance
  - Quick reference for common tasks
  - Expertise areas and debugging patterns

---

## 🐛 Troubleshooting

### Extension Not Loading?
1. Check `chrome://extensions/` → Enable "Developer mode"
2. Run `npm run build` and verify the loaded `dist/` folder contains `manifest.json`
3. Check DevTools console for WASM loading errors

### PDF Not Processing?
1. Verify PDF file is valid (try online PDF viewer)
2. For URLs: Check network tab in DevTools
3. View extension errors: `chrome://extensions/` → Details → Errors
4. Check console logs: Right-click popup → "Inspect popup"

### Copy/Download Not Working?
1. Check browser permissions for the extension
2. For downloads: Verify browser download settings
3. For clipboard: Some extensions block clipboard access

### Auto-Detection Not Working?
1. Ensure PDF link is direct (`*.pdf`) or Adobe plugin format
2. Check if tab is actually active (extension requires activeTab permission)
3. Try manually entering URL in URL tab

---

## 🤝 Contributing

Contributions welcome! Areas for help:

- 🎨 **UI/UX Improvements** - Design enhancements
- 🐛 **Bug Fixes** - Report issues via GitHub
- ✨ **Features** - New capabilities & optimizations
- 📝 **Documentation** - Docs and examples

See [SPEC.md](SPEC.md) Sections 7.5 and 8 for testability requirements and acceptance criteria.

---

## 📋 API Reference

### popup.js Functions

| Function | Purpose |
|----------|---------|
| `initializePopup()` | Auto-detect PDFs on popup open |
| `updateStatus(key, type, params)` | Render a localized semantic status |
| `processPdfBuffer(buffer, fileName)` | Send PDF to worker |

### worker.js Message Protocol

**Incoming Message**:
```javascript
{ buffer: ArrayBuffer, fileName: string }
// or direct ArrayBuffer
```

**Outgoing Response**:
```javascript
{
  ok: true,
  result: {
    pdfType: string,
    markdown: string
  }
}
// or on error:
{ ok: false, error: string }
```

---

## 🔗 Links

- **GitHub**: [dennis-zhao-dev/pdf-inspector-extension](https://github.com/dennis-zhao-dev/pdf-inspector-extension)
- **Chrome Web Store**: [Coming soon](#)
- **Bug Reports**: [GitHub Issues](https://github.com/dennis-zhao-dev/pdf-inspector-extension/issues)

---

## 🙋 Support

Need help? Check our documentation:

1. **Quick Issues** → [Troubleshooting](#-troubleshooting) section above
2. **Product Requirements** → [SPEC.md](SPEC.md) (requirements and acceptance criteria)
3. **Development** → [AGENT.md](AGENT.md) (dev reference)
4. **GitHub** → [Create an issue](https://github.com/dennis-zhao-dev/pdf-inspector-extension/issues)

---

**Made with ❤️ for PDF lovers**
