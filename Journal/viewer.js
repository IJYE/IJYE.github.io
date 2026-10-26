import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";

const canvas = document.querySelector("#pdf-canvas");
const context = canvas.getContext("2d");
const readingArea = document.querySelector("#reading-area");
const pageFrame = document.querySelector("#page-frame");
const emptyState = document.querySelector("#empty-state");
const fileInput = document.querySelector("#pdf-file");
const pageNumberInput = document.querySelector("#page-number");
const pageCount = document.querySelector("#page-count");
const previousButton = document.querySelector("#previous-page");
const nextButton = document.querySelector("#next-page");
const zoomOutButton = document.querySelector("#zoom-out");
const zoomInButton = document.querySelector("#zoom-in");
const fitButton = document.querySelector("#fit-page");
const zoomLevel = document.querySelector("#zoom-level");
const documentName = document.querySelector("#document-name");
const documentMeta = document.querySelector("#document-meta");
const downloadLink = document.querySelector("#download-link");
const emptyTitle = document.querySelector("#empty-title");
const emptyCopy = document.querySelector("#empty-copy");
const loadingNote = document.querySelector("#loading-note");

let pdfDocument = null;
let currentPage = 1;
let scale = 1;
let fitToWidth = true;
let renderTask = null;
let loadingTask = null;
let activeObjectUrl = null;
let resizeTimer = null;
let renderGeneration = 0;

function showMessage(title, message) {
  emptyTitle.textContent = title;
  emptyCopy.textContent = message;
  emptyState.hidden = false;
  pageFrame.hidden = true;
  loadingNote.hidden = true;
}

function setControlsEnabled(enabled) {
  pageNumberInput.disabled = !enabled;
  previousButton.disabled = !enabled || currentPage <= 1;
  nextButton.disabled = !enabled || currentPage >= pdfDocument.numPages;
  zoomOutButton.disabled = !enabled;
  zoomInButton.disabled = !enabled;
  fitButton.disabled = !enabled;
}

function updatePageControls() {
  pageNumberInput.value = String(currentPage);
  previousButton.disabled = currentPage <= 1;
  nextButton.disabled = currentPage >= pdfDocument.numPages;
}

async function renderPage() {
  if (!pdfDocument) return;

  const generation = ++renderGeneration;
  const documentToRender = pdfDocument;
  const pageToRender = currentPage;
  if (renderTask) {
    renderTask.cancel();
    renderTask = null;
  }

  const page = await documentToRender.getPage(pageToRender);
  if (generation !== renderGeneration || documentToRender !== pdfDocument) return;
  const baseViewport = page.getViewport({ scale: 1 });
  const availableWidth = Math.max(200, readingArea.clientWidth - 80);
  const pageScale = fitToWidth
    ? Math.min(availableWidth / baseViewport.width, 1.5)
    : scale;
  scale = pageScale;
  const viewport = page.getViewport({ scale: pageScale });
  const outputScale = window.devicePixelRatio || 1;

  canvas.width = Math.floor(viewport.width * outputScale);
  canvas.height = Math.floor(viewport.height * outputScale);
  canvas.style.width = `${Math.floor(viewport.width)}px`;
  canvas.style.height = `${Math.floor(viewport.height)}px`;
  context.setTransform(outputScale, 0, 0, outputScale, 0, 0);

  renderTask = page.render({ canvasContext: context, viewport });
  try {
    await renderTask.promise;
  } catch (error) {
    if (error.name !== "RenderingCancelledException") throw error;
  }

  if (generation !== renderGeneration || documentToRender !== pdfDocument) return;
  zoomLevel.textContent = fitToWidth ? "Fit" : `${Math.round(scale * 100)}%`;
  pageCount.textContent = String(documentToRender.numPages);
  updatePageControls();
  emptyState.hidden = true;
  pageFrame.hidden = false;
}

async function loadPdf(source, name, { localFile = false } = {}) {
  renderGeneration += 1;
  if (loadingTask) await loadingTask.destroy();
  if (renderTask) {
    renderTask.cancel();
    renderTask = null;
  }

  pdfDocument = null;
  setControlsEnabled(false);
  downloadLink.hidden = true;
  loadingNote.hidden = false;
  emptyTitle.textContent = "Opening journal…";
  emptyCopy.textContent = "Preparing the PDF for reading in your browser.";
  emptyState.hidden = false;
  pageFrame.hidden = true;
  documentName.textContent = name;
  documentMeta.textContent = localFile
    ? "Opened from your device"
    : "International Journal of Youth Engineering";

  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = null;
  }

  try {
    const data = localFile ? new Uint8Array(await source.arrayBuffer()) : source;
    loadingTask = pdfjsLib.getDocument(localFile ? { data } : { url: data });
    pdfDocument = await loadingTask.promise;
    currentPage = 1;
    scale = 1;
    fitToWidth = true;

    if (localFile) {
      activeObjectUrl = URL.createObjectURL(source);
      downloadLink.href = activeObjectUrl;
      downloadLink.download = name;
    } else {
      downloadLink.href = data;
      downloadLink.target = "_blank";
      downloadLink.rel = "noopener";
      downloadLink.removeAttribute("download");
    }
    downloadLink.hidden = false;
    setControlsEnabled(true);
    await renderPage();
  } catch (error) {
    console.error("Unable to open the journal PDF:", error);
    showMessage(
      "Couldn’t open this PDF",
      "The file may be unavailable or invalid. Choose another PDF, or check that the journal file is a readable PDF."
    );
    documentMeta.textContent = "PDF unavailable";
    setControlsEnabled(false);
  }
}

previousButton.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage -= 1;
    renderPage().catch((error) => console.error("Unable to render PDF page:", error));
  }
});

nextButton.addEventListener("click", () => {
  if (pdfDocument && currentPage < pdfDocument.numPages) {
    currentPage += 1;
    renderPage().catch((error) => console.error("Unable to render PDF page:", error));
  }
});

pageNumberInput.addEventListener("change", () => {
  if (!pdfDocument) return;
  const requestedPage = Number.parseInt(pageNumberInput.value, 10);
  if (!Number.isFinite(requestedPage)) {
    pageNumberInput.value = String(currentPage);
    return;
  }
  currentPage = Math.min(Math.max(requestedPage, 1), pdfDocument.numPages);
  renderPage().catch((error) => console.error("Unable to render PDF page:", error));
});

zoomOutButton.addEventListener("click", () => {
  fitToWidth = false;
  scale = Math.max(.5, scale / 1.2);
  renderPage().catch((error) => console.error("Unable to zoom PDF page:", error));
});

zoomInButton.addEventListener("click", () => {
  fitToWidth = false;
  scale = Math.min(3, scale * 1.2);
  renderPage().catch((error) => console.error("Unable to zoom PDF page:", error));
});

fitButton.addEventListener("click", () => {
  fitToWidth = true;
  renderPage().catch((error) => console.error("Unable to fit PDF page:", error));
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    showMessage("That file isn’t a PDF", "Select a PDF file to read it in the IJYE journal viewer.");
    return;
  }
  loadPdf(file, file.name, { localFile: true });
  fileInput.value = "";
});

window.addEventListener("resize", () => {
  if (!pdfDocument || !fitToWidth) return;
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    renderPage().catch((error) => console.error("Unable to resize PDF page:", error));
  }, 120);
});

const fileFromQuery = new URLSearchParams(window.location.search).get("file");
const defaultPdf = fileFromQuery || new URL("./journal.pdf", import.meta.url).href;
const defaultName = fileFromQuery
  ? fileFromQuery.split("/").pop() || "IJYE Journal"
  : "IJYE Journal";

loadPdf(defaultPdf, defaultName);
