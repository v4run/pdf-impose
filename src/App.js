import React, { useEffect } from "react";
import { useState } from "react";
import "./App.css";
import { PDFDocument } from "pdf-lib";

function PDFPreview({ processing, src }) {
  if (processing) {
    return <div>Loading</div>;
  }
  if (src) {
    return (
      <iframe
        title="PDFPreview"
        src={src}
        style={{ width: "100%", height: "100%" }}
      ></iframe>
    );
  }
  return null;
}

function App() {
  const [pdfFile, setPDFFile] = useState(null);
  const [pagesPerSheet, setPagesPerSheet] = useState(1);
  const [src, setSrc] = useState(null);
  const [processing, setProcessing] = useState(false);

  const multipliers = new Map([
    [1, [1, 1]],
    [2, [2, 1]],
    [4, [2, 2]],
  ]);
  const layouts = new Map([
    [
      1,
      function (width, height) {
        return [{ x: 0, y: 0, width: width, height: height }];
      },
    ],
    [
      2,
      function (width, height) {
        return [
          { x: 0, y: 0, width: width, height: height },
          { x: width, y: 0, width: width, height: height },
        ];
      },
    ],
    [
      4,
      function (width, height) {
        return [
          { x: 0, y: height, width: width, height: height },
          { x: width, y: height, width: width, height: height },
          { x: 0, y: 0, width: width, height: height },
          { x: width, y: 0, width: width, height: height },
        ];
      },
    ],
  ]);

  useEffect(() => {
    regeneratePDF();
  }, [pagesPerSheet]);
  useEffect(() => {
    regeneratePDF();
  }, [pdfFile]);

  async function updatePagesPerSheet(e) {
    setPagesPerSheet(parseInt(e.target.value));
  }

  async function regeneratePDF() {
    if (!pdfFile) {
      return;
    }
    const pages = pdfFile.getPages();
    const updatedDocument = await PDFDocument.create();
    const embeddedPages = await updatedDocument.embedPages(pages);
    const oldHeight = pages[0].getHeight();
    const oldWidth = pages[0].getWidth();
    const layout = layouts.get(pagesPerSheet)(oldWidth, oldHeight);
    let j = 0;
    let page = null;
    const multiplier = multipliers.get(pagesPerSheet);
    for (let i = 0; i < embeddedPages.length; i++) {
      if (j % pagesPerSheet === 0) {
        page = updatedDocument.addPage([
          oldWidth * multiplier[0],
          oldHeight * multiplier[1],
        ]);
      }
      page.drawPage(embeddedPages[i], layout[j]);
      j = (j + 1) % pagesPerSheet;
    }
    const modifiedPdfBytes = await updatedDocument.save();
    const blob = new Blob([modifiedPdfBytes], {
      type: "application/pdf",
    });
    const url = URL.createObjectURL(blob);
    const src = url;
    setSrc(src);
  }

  async function selectFile(e) {
    setProcessing(true);
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = async function (e) {
        const arrayBuffer = e.target.result;
        setProcessing(false);
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        setPDFFile(pdfDoc);
      };
      reader.readAsArrayBuffer(file);
    }
  }

  return (
    <div className="App">
      <div className="mx-auto grid grid-cols-1 h-screen md:grid-cols-2">
        <div className="pdf_preview w-full h-full bg-black">
          <PDFPreview
            processing={processing}
            src={src}
            className="pdf_viewer"
          ></PDFPreview>
        </div>
        <div className="pdf_selector flex flex-auto w-full h-full bg-black">
          <div className="m-auto max-w-xs">
            <label className="flex w-full cursor-pointer appearance-none items-center justify-center rounded-md border-2 border-dashed border-gray-200 p-6 transition-all hover:border-primary-300">
              <div className="space-y-1 text-center">
                <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="h-6 w-6 text-gray-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                    />
                  </svg>
                </div>
                <div className="text-gray-600">
                  <span className="font-medium text-primary-500 hover:text-primary-700">
                    Click to select a PDF file
                  </span>
                </div>
              </div>
              <input
                id="pdf_selector"
                type="file"
                className="sr-only"
                accept="application/pdf"
                onChange={selectFile}
              />
            </label>
            <div className="flex items-center justify-center p-4">
              <a
                className="w-full h-full text-black bg-white rounded"
                href={src}
              >
                Download
              </a>
            </div>
            <div className="flex items-center justify-center">
              <div className="flex w-full flex-auto text-white text-xs">
                Choose pages per sheet
              </div>
              <div className="flex h-full w-full text-white">
                <div className="flex h-full w-full m-2 items-center justify-center">
                  <input
                    type="radio"
                    name="pages_per_sheet"
                    id="pages_per_sheet_1"
                    value="1"
                    className="hidden peer"
                    onChange={updatePagesPerSheet}
                    checked={pagesPerSheet === 1}
                  />
                  <label
                    htmlFor="pages_per_sheet_1"
                    className="flex h-full w-full flex-auto items-center border border-dashed justify-center peer-checked:text-black peer-checked:bg-white cursor-pointer rounded"
                  >
                    1
                  </label>
                </div>
                <div className="flex h-full w-full m-2">
                  <input
                    type="radio"
                    name="pages_per_sheet"
                    id="pages_per_sheet_2"
                    value="2"
                    className="hidden peer"
                    onChange={updatePagesPerSheet}
                    checked={pagesPerSheet === 2}
                  />
                  <label
                    htmlFor="pages_per_sheet_2"
                    className="flex h-full w-full flex-auto items-center border border-dashed justify-center peer-checked:text-black peer-checked:bg-white cursor-pointer rounded"
                  >
                    2
                  </label>
                </div>
                <div className="flex h-full w-full m-2">
                  <input
                    type="radio"
                    name="pages_per_sheet"
                    id="pages_per_sheet_4"
                    value="4"
                    className="hidden peer"
                    onChange={updatePagesPerSheet}
                    checked={pagesPerSheet === 4}
                  />
                  <label
                    htmlFor="pages_per_sheet_4"
                    className="flex h-full w-full flex-auto items-center border border-dashed justify-center peer-checked:text-black peer-checked:bg-white cursor-pointer rounded"
                  >
                    4
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
