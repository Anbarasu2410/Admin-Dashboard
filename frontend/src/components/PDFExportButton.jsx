
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// import dayjs from "dayjs";

// const PDFExportButton = ({ summaryCards, progressData }) => {
//   const exportPDF = () => {
//     const doc = new jsPDF();
//     const projectPages = [];

//     // Title
//     doc.setFontSize(18);
//     doc.text("Daily/Weekly Progress Report", 14, 20);

//     // Summary cards
//     let summaryTextY = 30;
//     summaryCards.forEach((card) => {
//       doc.setFontSize(12);
//       doc.text(`${card.title}: ${card.value}`, 14, summaryTextY);
//       summaryTextY += 6;
//     });

//     let startY = summaryTextY + 4;

//     // TOC placeholder
//     const tocY = startY;
//     doc.setFontSize(14);
//     doc.text("Table of Contents", 14, tocY);
//     startY += 10;

//     progressData.forEach((project, index) => {
//       // Capture page number
//       const pageNumber = doc.internal.getNumberOfPages() || 1;
//       projectPages.push({ name: project.projectName, page: pageNumber });

//       // Project header
//       doc.setFontSize(14);
//       doc.text(`Project: ${project.projectName}`, 14, startY);
//       startY += 6;

//       // Project summary table
//       autoTable({
//         head: [["Supervisor", "Progress %", "Status"]],
//         body: [
//           [
//             project.supervisorName || "-",
//             `${project.overallProgress}%`,
//             project.status || "-",
//           ],
//         ],
//         startY,
//         theme: "grid",
//         headStyles: { fillColor: [41, 128, 185], textColor: 255 },
//         styles: { fontSize: 10 },
//         margin: { left: 14, right: 14 },
//         didDrawPage: (data) => {
//           startY = data.cursor.y + 4;
//         },
//       });

//       // Worker progress table
//       if (project.workerProgress?.length > 0) {
//         doc.setFontSize(12);
//         doc.text("Worker Progress:", 14, startY);
//         startY += 4;

//         const workerTable = project.workerProgress.map((w) => [
//           w.employeeName,
//           w.taskName || "-",
//           `${w.progressPercent || 0}%`,
//           w.notes || "-",
//         ]);

//         autoTable({
//           head: [["Worker", "Task Assigned", "Progress %", "Notes"]],
//           body: workerTable,
//           startY,
//           theme: "striped",
//           headStyles: { fillColor: [52, 152, 219], textColor: 255 },
//           styles: { fontSize: 9 },
//           margin: { left: 14, right: 14 },
//           didDrawPage: (data) => {
//             startY = data.cursor.y + 8;
//           },
//         });
//       }

//       if (index < progressData.length - 1) doc.addPage();
//       startY = 20;
//     });

//     // Fill TOC
//     doc.setPage(1);
//     let tocOffsetY = tocY + 10;
//     doc.setFontSize(12);
//     projectPages.forEach((p, idx) => {
//       doc.text(`${idx + 1}. ${p.name} ..................................... ${p.page}`, 14, tocOffsetY);
//       tocOffsetY += 6;
//     });

//     // Save PDF
//     doc.save(`progress_report_${dayjs().format("YYYYMMDD_HHmm")}.pdf`);
//   };

//   return (
//     <button
//       onClick={exportPDF}
//       className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
//     >
//       Export PDF
//     </button>
//   );
// };

// export default PDFExportButton;



import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";

const PDFExportButton = ({ summaryCards = [], progressData = [] }) => {
  const exportPDF = () => {
    const doc = new jsPDF();

    /* =========================
       PAGE 1 : TITLE + SUMMARY
    ========================= */

    doc.setFontSize(18);
    doc.text("Daily / Weekly Progress Report", 14, 20);

    doc.setFontSize(12);
    let y = 30;

    summaryCards.forEach((card) => {
      doc.text(`${card.title}: ${card.value}`, 14, y);
      y += 6;
    });

    /* =========================
       TABLE OF CONTENTS (PAGE 1)
    ========================= */

    const TOC_START_Y = y + 10;

    doc.setFontSize(14);
    doc.text("Table of Contents", 14, TOC_START_Y);

    // Reserve space only — DO NOT write TOC entries yet
    // Projects MUST start on a new page
    doc.addPage();

    /* =========================
       PROJECT PAGES
    ========================= */

    const projectPages = [];

    progressData.forEach((project, index) => {
      const currentPage = doc.internal.getNumberOfPages();

      projectPages.push({
        name: project.projectName || `Project ${index + 1}`,
        page: currentPage,
      });

      let startY = 20;

      doc.setFontSize(14);
      doc.text(`Project: ${project.projectName || "-"}`, 14, startY);
      startY += 6;

      /* ---- PROJECT SUMMARY TABLE ---- */
      autoTable(doc, {
        startY,
        head: [["Supervisor", "Overall Progress", "Status"]],
        body: [
          [
            project.supervisorName || "-",
            `${project.overallProgress ?? 0}%`,
            project.status || "-",
          ],
        ],
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        margin: { left: 14, right: 14 },
      });

      startY = doc.lastAutoTable.finalY + 8;

      /* ---- WORKER PROGRESS TABLE ---- */
      if (Array.isArray(project.workerProgress) && project.workerProgress.length) {
        doc.setFontSize(12);
        doc.text("Worker Progress", 14, startY);
        startY += 4;

        autoTable(doc, {
          startY,
          head: [["Worker", "Task", "Progress %", "Notes"]],
          body: project.workerProgress.map((w) => [
            w.employeeName || "-",
            w.taskName || "-",
            `${w.progressPercent ?? 0}%`,
            w.notes || "-",
          ]),
          theme: "striped",
          styles: { fontSize: 9 },
          headStyles: { fillColor: [52, 152, 219], textColor: 255 },
          margin: { left: 14, right: 14 },
        });
      }

      // New page for next project
      if (index < progressData.length - 1) {
        doc.addPage();
      }
    });

    /* =========================
       FILL TABLE OF CONTENTS
       (AFTER projects exist)
    ========================= */

    doc.setPage(1);
    doc.setFontSize(12);

    let tocY = TOC_START_Y + 10;

    projectPages.forEach((p, i) => {
      // Left column: index + project name
      doc.text(`${i + 1}. ${p.name}`, 14, tocY);

      // Right column: page number (RIGHT ALIGNED)
      doc.text(String(p.page), 200, tocY, { align: "right" });

      tocY += 6;
    });

    /* =========================
       SAVE FILE
    ========================= */

    doc.save(`progress_report_${dayjs().format("YYYYMMDD_HHmm")}.pdf`);
  };

  return (
    <button
      onClick={exportPDF}
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
    >
      Export PDF
    </button>
  );
};

export default PDFExportButton;
