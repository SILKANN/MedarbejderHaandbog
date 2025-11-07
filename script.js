// Importer PDF.js som et ES-modul
import * as pdfjsLib from './pdf/pdf.mjs';

// Konfigurer worker-fil
pdfjsLib.GlobalWorkerOptions.workerSrc = './pdf/pdf.worker.mjs';

// Definer globale variabler
let pdfDoc = null;
let currentPage = 1;
let currentPageIndex = 0;
const url = "./pdf/TDSmedarbejderhåndbog.pdf";
let selectedPages = [];
let selectedPage = 1;

// Hent index.json og generér indholdsfortegnelse
fetch("index.json")
    .then(response => response.json())
    .then(data => {
        let tocList = document.getElementById("tocList");
        data.forEach(entry => {
            let li = document.createElement("li");
            li.innerText = entry.title;
            li.onclick = () => openPopup(entry.title, entry.page);
            tocList.appendChild(li);
        });
    });
// Hent build-timestamp.json og vis opdateringsdato
fetch("build-timestamp.json")
    .then((res) => res.json())
    .then((data) => {
        document.getElementById("lastUpdated").innerText =
            `Opdateret den: ${data.updated}`;
    });

// Åbn pop-up med overskrift
function openPopup(title, pages) {
    selectedPages = Array.isArray(pages) ? pages : [pages]; // Gem alle sider
    currentPageIndex = 0; // Start på første side

    let popup = document.getElementById("popup");
    let popupTitle = document.getElementById("popupTitle");
    let pdfButton = document.getElementById("openPdfBtn");
    let nextPageBtn = document.getElementById("nextPageBtn");

    if (!popup || !popupTitle || !pdfButton || !nextPageBtn) return;

    popupTitle.innerText = title;
    popup.style.display = "block";
    pdfButton.innerText = "Åben PDF";

    // Vælg den første side fra listen
    selectedPage = selectedPages[0];

    // Hvis der er flere sider, vis "Næste side"-knappen
    if (selectedPages.length > 1) {
        nextPageBtn.classList.remove("hidden");
    } else {
        nextPageBtn.classList.add("hidden");
    }
}

// Luk pop-up
function closePopup() {
    document.getElementById("popup").style.display = "none";
}

// Åbn PDF-viseren og vis den valgte side
async function openPDF() {
    closePopup();
    let pdfViewer = document.getElementById("pdfViewer");

    console.log("📄 Bruger har åbnet PDF på side:", selectedPage);

    pdfViewer.classList.remove("hidden");
    pdfViewer.style.display = "block"; // Sikrer, at viseren er synlig

    if (!pdfDoc) {
        console.log("⚠ PDF ikke indlæst endnu... Indlæser nu.");
        await loadPDF();
    }

    console.log("✅ PDF er klar! Kalder `loadPage(" + selectedPage + ")`");
    loadPage(selectedPage);
}

// Luk PDF-viseren
function closePDF() {
    document.getElementById("pdfViewer").style.display = "none";
}

// Load PDF og vis første side
async function loadPDF() {
    console.log("🔄 Forsøger at indlæse PDF...");

    try {
        pdfDoc = await pdfjsLib.getDocument(url).promise;
        console.log("✅ PDF indlæst korrekt!");

        if (pdfDoc) {
            console.log("📄 PDF har", pdfDoc.numPages, "sider.");
            renderPage(1); // Start på side 1
        } else {
            console.error("❌ FEJL: `pdfDoc` blev aldrig oprettet!");
        }
    } catch (error) {
        console.error("❌ Fejl ved indlæsning af PDF:", error);
    }
}

// Vis en bestemt side fra PDF
async function renderPage(num) {
    console.log("🖼️ Forsøger at vise side:", num);

    try {
        let page = await pdfDoc.getPage(num);
        console.log("✅ Side fundet i PDF:", num);

        let pdfViewer = document.getElementById("pdfViewer");
        let oldCanvas = document.getElementById("pdfCanvas");

        if (!pdfViewer) {
            console.error("❌ FEJL: `pdfViewer` findes ikke i HTML!");
            return;
        }

        // Hvis der ikke er et canvas, opret et nyt
        if (!oldCanvas) {
            console.log("⚠ Ingen eksisterende canvas fundet. Opretter nyt...");
            let newCanvas = document.createElement("canvas");
            newCanvas.id = "pdfCanvas";
            pdfViewer.appendChild(newCanvas);
        }

        let canvas = document.getElementById("pdfCanvas");
        let ctx = canvas.getContext("2d");
        let viewport = page.getViewport({ scale: 1.5 });

        // Opdater størrelsen på canvas
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Tøm canvas for at undgå gamle billeder
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let renderContext = { canvasContext: ctx, viewport: viewport };

        console.log("🔄 Tegner PDF på canvas...");
        await page.render(renderContext);
        console.log("✅ PDF er nu tegnet!");

    } catch (error) {
        console.error("❌ Kunne ikke vise siden:", error);
    }
}

// Hop til en bestemt side
function loadPage(num) {
    if (Array.isArray(num)) {
        renderPage(num[0]); // Start med første side
    } else if (num > 0 && num <= pdfDoc.numPages) {
        renderPage(num);
    }
}

function nextPage() {
    if (currentPageIndex < selectedPages.length - 1) {
        currentPageIndex++; // Gå til næste side
        loadPage(selectedPages[currentPageIndex]); // Indlæs den nye side
        console.log("🔄 Læs næste side ->");
    } else {
        console.log("✅ Ingen flere sider i denne overskrift.");
    }
}

// Sørg for, at funktionerne kaldes korrekt efter DOM er indlæst
document.addEventListener("DOMContentLoaded", () => {
    console.log("📄 DOM er indlæst. Forsøger at hente PDF...");
    loadPDF();

    document.getElementById("openPdfBtn").addEventListener("click", openPDF);
    document.getElementById("closePdfBtn").addEventListener("click", closePDF);
    document.getElementById("nextPageBtn").addEventListener("click", nextPage);
    document.querySelector(".close-btn").addEventListener("click", closePopup);
});

// Gør `renderPage()` synlig i Console for debugging
window.renderPage = renderPage;