import { cadPreview } from "../../../src/core/cad-preview";
self.onmessage = (event: MessageEvent<string>) => {
  try {
    self.postMessage({ result: cadPreview(event.data) });
  } catch (error) {
    self.postMessage({
      error:
        error instanceof Error ? error.message : "Nie udało się odczytać DXF.",
    });
  }
};
