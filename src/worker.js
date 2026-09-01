// src/worker.js
import init, {
  processPdf
} from "@firecrawl/pdf-inspector-wasm";

let initialized = false;

self.onmessage = async (event) => {
  try {
    if (!initialized) {
      await init();
      initialized = true;
    }

    // Handle both formats: direct ArrayBuffer and object with buffer property
    let pdfBuffer = event.data;
    if (event.data && typeof event.data === 'object' && event.data.buffer instanceof ArrayBuffer) {
      pdfBuffer = event.data.buffer;
    }

    const pdfBytes = new Uint8Array(pdfBuffer);

    const result = processPdf(pdfBytes, {
      profile: "compact",
      includePageMarkers: true
    });

    self.postMessage({
      ok: true,
      result
    });
  } catch (error) {
    self.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
};