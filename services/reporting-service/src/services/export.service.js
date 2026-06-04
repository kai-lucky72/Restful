const { Parser } = require('@json2csv/plainjs');
const PDFDocument = require('pdfkit');
const { ApiError } = require('@fes/shared');
const reporting = require('./reporting.service');

// Build the flat dataset for a given report type (scoped to the caller).
async function buildDataset(type, auth) {
  switch (type) {
    case 'inventory': {
      const items = await reporting.loadExtinguishers(auth);
      return {
        title: 'Fire Extinguisher Inventory Report',
        rows: items.map((e) => ({
          serialNumber: e.serialNumber, location: e.location, type: e.type, size: e.size,
          installationDate: e.installationDate, expiryDate: e.expiryDate, status: e.status,
          compliant: e.compliant ? 'YES' : 'NO', daysUntilExpiry: e.daysUntilExpiry,
        })),
      };
    }
    case 'compliance': {
      const c = await reporting.compliance(auth);
      return {
        title: 'Compliance Report',
        rows: c.upcomingExpirations.list.map((e) => ({
          serialNumber: e.serialNumber, location: e.location, status: e.status,
          expiryDate: e.expiryDate, daysUntilExpiry: e.daysUntilExpiry,
        })),
        summary: { compliancePct: c.compliancePct, expiredCount: c.expiredCount, compliantCount: c.compliantCount },
      };
    }
    case 'inspections': {
      const i = await reporting.inspections(auth);
      return {
        title: 'Inspection Report',
        rows: [...i.overdueList, ...i.upcomingList].map((x) => ({
          extinguisherId: x.extinguisherId, scheduledDate: x.scheduledDate, scheduledTime: x.scheduledTime,
          performedDate: x.performedDate || '', result: x.result,
        })),
        summary: { total: i.total, completed: i.completed, pending: i.pending, overdue: i.overdue, passRate: i.passRate },
      };
    }
    case 'maintenance': {
      const m = await reporting.maintenance(auth);
      return {
        title: 'Maintenance Report',
        rows: m.recent.map((x) => ({
          extinguisherId: x.extinguisherId, actionTaken: x.actionTaken, maintenanceDate: x.maintenanceDate,
          issuesIdentified: x.issuesIdentified || '', notes: x.notes || '',
        })),
      };
    }
    default:
      throw ApiError.badRequest('Unknown report type. Use inventory|compliance|inspections|maintenance.', 'BAD_REPORT_TYPE');
  }
}

async function toCSV(type, auth) {
  const { rows } = await buildDataset(type, auth);
  if (!rows.length) return `No data available for ${type} report\n`;
  return new Parser().parse(rows);
}

// Returns a PDFDocument stream the controller pipes to the response.
async function toPDF(type, auth) {
  const { title, rows, summary } = await buildDataset(type, auth);
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  doc.fillColor('#DC2626').fontSize(20).text('TZW LTD — Fire Safety', { align: 'left' });
  doc.moveDown(0.2);
  doc.fillColor('#1F2937').fontSize(14).text(title);
  doc.fillColor('#6B7280').fontSize(9).text(`Generated: ${new Date().toLocaleString()}`);
  doc.moveDown(0.5);
  doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#E5E7EB').stroke();
  doc.moveDown(0.5);

  if (summary) {
    doc.fillColor('#374151').fontSize(10);
    Object.entries(summary).forEach(([k, v]) => doc.text(`${k}: ${v}`));
    doc.moveDown(0.5);
  }

  if (!rows.length) {
    doc.fillColor('#6B7280').fontSize(11).text('No data available.');
  } else {
    const headers = Object.keys(rows[0]);
    doc.fillColor('#111827').fontSize(8);
    doc.text(headers.join('  |  '));
    doc.moveDown(0.2);
    doc.strokeColor('#E5E7EB').moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.2);
    rows.forEach((r) => {
      doc.fillColor('#374151').text(headers.map((h) => String(r[h] ?? '')).join('  |  '));
    });
  }

  doc.end();
  return doc;
}

module.exports = { toCSV, toPDF, buildDataset };
