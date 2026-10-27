"use client";

// Client-only PDF.js integration helper
let pdfjsLib: any = null;

export async function getPdfjs() {
  if (typeof window === "undefined") {
    throw new Error("PDF.js can only be loaded on the client");
  }

  if (!pdfjsLib) {
    pdfjsLib = await import("pdfjs-dist");
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    }
  }

  return pdfjsLib;
}

export async function loadPdf(data: ArrayBuffer | Blob): Promise<any> {
  const pdfjs = await getPdfjs();
  let buffer: ArrayBuffer;

  if (data instanceof Blob) {
    buffer = await data.arrayBuffer();
  } else {
    buffer = data;
  }

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    cMapUrl: "https://unpkg.com/pdfjs-dist@4.10.38/cmaps/",
    cMapPacked: true,
  });

  return loadingTask.promise;
}

export async function renderPdfPage(
  page: any,
  canvas: HTMLCanvasElement,
  scale: number = 1.0
): Promise<{ width: number; height: number; viewport: any }> {
  const pixelRatio = window.devicePixelRatio || 1;
  const viewport = page.getViewport({ scale });

  canvas.width = Math.floor(viewport.width * pixelRatio);
  canvas.height = Math.floor(viewport.height * pixelRatio);
  canvas.style.width = `${Math.floor(viewport.width)}px`;
  canvas.style.height = `${Math.floor(viewport.height)}px`;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not get 2d context for canvas");

  context.save();
  context.scale(pixelRatio, pixelRatio);

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext).promise;
  context.restore();

  return {
    width: viewport.width,
    height: viewport.height,
    viewport,
  };
}

export async function renderPdfTextLayer(
  page: any,
  container: HTMLElement,
  scale: number = 1.0
): Promise<void> {
  const viewport = page.getViewport({ scale });
  container.innerHTML = "";
  container.style.width = `${Math.floor(viewport.width)}px`;
  container.style.height = `${Math.floor(viewport.height)}px`;

  const pdfjs = await getPdfjs();
  const textContent = await page.getTextContent();

  if (pdfjs.TextLayer) {
    const textLayer = new pdfjs.TextLayer({
      textContentSource: textContent,
      container,
      viewport,
    });
    await textLayer.render();
  }
}

export async function generateThumbnailUrl(
  pdfDoc: any,
  pageNumber: number = 1,
  maxWidth: number = 150
): Promise<string> {
  try {
    const page = await pdfDoc.getPage(pageNumber);
    const initialViewport = page.getViewport({ scale: 1.0 });
    const scale = maxWidth / initialViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext("2d");

    if (!context) return "";

    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    return canvas.toDataURL("image/webp", 0.8) || canvas.toDataURL("image/png");
  } catch (err) {
    console.error("Error generating thumbnail:", err);
    return "";
  }
}
