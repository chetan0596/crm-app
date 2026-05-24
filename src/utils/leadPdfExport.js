import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Generate a professional PDF document for a lead.
 * @param {Object} lead - The lead object with all details.
 * @param {Object} options - Additional options.
 */
export function generateLeadPdf(lead, options = {}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  // --- Header ---
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 80, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Lead Documentation", margin, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 70);
  doc.text(`Document ID: LD-${lead.id}-${Date.now().toString().slice(-6)}`, pageWidth - margin - 140, 70, { align: "right" });

  y = 100;

  // --- Lead Overview Box ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 90, 6, 6, "FD");

  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(lead.name || "Unnamed Lead", margin + 12, y + 28);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);

  const overviewItems = [
    { label: "ID", value: `#${lead.id}` },
    { label: "Phone", value: lead.phone || "N/A" },
    { label: "Email", value: lead.email || "N/A" },
    { label: "Source", value: lead.source?.name || lead.source || "N/A" },
    { label: "Stage", value: lead.stage?.name || lead.stage || "N/A" },
    { label: "Status", value: lead.status || "New" },
  ];

  let xPos = margin + 12;
  overviewItems.forEach((item, idx) => {
    if (idx > 0 && idx % 3 === 0) {
      y += 22;
      xPos = margin + 12;
    }
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text(`${item.label}:`, xPos, y + 50);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);
    const labelWidth = doc.getTextWidth(`${item.label}:`);
    doc.text(item.value, xPos + labelWidth + 4, y + 50);
    xPos += 170;
  });

  y += 110;

  // --- Contact Details Section ---
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Contact Information", margin, y);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 6, pageWidth - margin, y + 6);

  y += 20;

  const contactData = [
    ["Field", "Value"],
    ["Full Name", lead.name || "N/A"],
    ["Phone", lead.phone || "N/A"],
    ["Email", lead.email || "N/A"],
    ["Alternate Phone", lead.alternate_phone || "N/A"],
    ["City", lead.city?.name || lead.city || "N/A"],
    ["Address", lead.address || "N/A"],
    ["Company", lead.company || "N/A"],
    ["Designation", lead.designation || "N/A"],
  ];

  autoTable(doc, {
    startY: y,
    head: [contactData[0]],
    body: contactData.slice(1),
    theme: "grid",
    headStyles: { fillColor: [248, 250, 252], textColor: [30, 41, 59], fontStyle: "bold", fontSize: 10 },
    bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
    columnStyles: {
      0: { cellWidth: 140, fontStyle: "bold", textColor: [100, 116, 139] },
      1: { cellWidth: "auto" },
    },
    margin: { left: margin, right: margin },
    styles: { lineColor: [226, 232, 240], lineWidth: 0.5 },
  });

  y = doc.lastAutoTable.finalY + 20;

  // --- Lead Details Section ---
  if (y > pageHeight - 200) {
    doc.addPage();
    y = margin;
  }

  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Lead Details", margin, y);
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y + 6, pageWidth - margin, y + 6);

  y += 20;

  const detailsData = [
    ["Field", "Value"],
    ["Category", lead.category?.name || lead.category || "N/A"],
    ["Subcategory", lead.subcategory?.name || lead.subcategory || "N/A"],
    ["Tags", lead.tags?.map((t) => t.name).join(", ") || lead.tags?.join(", ") || "N/A"],
    ["Assigned To", lead.assignee?.name || lead.assignee || "Unassigned"],
    ["Created By", lead.created_by?.name || lead.created_by || "N/A"],
    ["Created At", lead.created_at ? new Date(lead.created_at).toLocaleString() : "N/A"],
    ["Updated At", lead.updated_at ? new Date(lead.updated_at).toLocaleString() : "N/A"],
    ["Expected Value", lead.expected_value ? `₹${lead.expected_value}` : "N/A"],
    ["Priority", lead.priority || "Normal"],
  ];

  autoTable(doc, {
    startY: y,
    head: [detailsData[0]],
    body: detailsData.slice(1),
    theme: "grid",
    headStyles: { fillColor: [248, 250, 252], textColor: [30, 41, 59], fontStyle: "bold", fontSize: 10 },
    bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
    columnStyles: {
      0: { cellWidth: 140, fontStyle: "bold", textColor: [100, 116, 139] },
      1: { cellWidth: "auto" },
    },
    margin: { left: margin, right: margin },
    styles: { lineColor: [226, 232, 240], lineWidth: 0.5 },
  });

  y = doc.lastAutoTable.finalY + 20;

  // --- Description / Notes ---
  if (lead.description || lead.notes) {
    if (y > pageHeight - 150) {
      doc.addPage();
      y = margin;
    }

    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Notes & Description", margin, y);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 6, pageWidth - margin, y + 6);

    y += 20;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);

    const notesText = lead.description || lead.notes || "";
    const splitNotes = doc.splitTextToSize(notesText, pageWidth - margin * 2);
    doc.text(splitNotes, margin, y);
  }

  // --- Footer on every page ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `CRM System — Lead Documentation — Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 20,
      { align: "center" }
    );
  }

  // Save
  const fileName = options.fileName || `Lead_${lead.id}_${lead.name?.replace(/\s+/g, "_") || "documentation"}.pdf`;
  doc.save(fileName);
}

/**
 * Generate a bulk PDF for multiple leads (summary report).
 * @param {Array} leads - Array of lead objects.
 * @param {Object} options - Additional options.
 */
export function generateLeadsSummaryPdf(leads, options = {}) {
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 60, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(options.title || "Leads Summary Report", margin, 38);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin - 140, 38, { align: "right" });

  const tableData = leads.map((lead) => [
    lead.id,
    lead.name || "N/A",
    lead.phone || "N/A",
    lead.email || "N/A",
    lead.source?.name || lead.source || "N/A",
    lead.stage?.name || lead.stage || "N/A",
    lead.assignee?.name || lead.assignee || "Unassigned",
    lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "N/A",
  ]);

  autoTable(doc, {
    startY: 75,
    head: [["ID", "Name", "Phone", "Email", "Source", "Stage", "Assigned To", "Created"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 10 },
    bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: margin, right: margin },
    styles: { lineColor: [226, 232, 240], lineWidth: 0.5 },
  });

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `CRM System — Leads Summary — Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 20,
      { align: "center" }
    );
  }

  doc.save(options.fileName || `Leads_Summary_${Date.now()}.pdf`);
}

export default { generateLeadPdf, generateLeadsSummaryPdf };
