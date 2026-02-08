import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function ExportReport({ enabled }) {
  async function generate() {
    const element = document.getElementById("report-root");
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: "#ffffff"
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    pdf.setFontSize(18);
    pdf.text("AI Media Forensics Report", 14, 18);

    pdf.addImage(imgData, "PNG", 0, 25, pageWidth, imgHeight);

    pdf.save("forensic-report.pdf");
  }

  return (
    <button
      onClick={generate}
      disabled={!enabled}
      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-semibold shadow disabled:opacity-40"
    >
      📄 Download Forensic Report
    </button>
  );
}
