import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generarPDFPresupuesto = (detalle: any) => {
  try {
    const doc = new jsPDF();

    // Configuración de colores (Rojo oscuro/carmesí)
    const colorPrimario: [number, number, number] = [220, 38, 38];
    const colorTextoBase: [number, number, number] = [60, 60, 60];

    // Variables iniciales
    const marginX = 15;
    let currentY = 20;

    // --- ENCABEZADO ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(...colorPrimario);
    doc.text('Presupuesto', marginX, currentY);

    doc.setFontSize(22);
    doc.text('ALE MOTOS', 195 - marginX, currentY, { align: 'right' });

    currentY += 15;

    // Fechas e info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...colorTextoBase);
    doc.text('Fecha:', marginX, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString('es-AR'), marginX + 15, currentY);

    currentY += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Nº Presupuesto:', marginX, currentY);
    doc.setFont('helvetica', 'normal');
    const nroRef = detalle.id ? detalle.id.substring(detalle.id.length - 6).toUpperCase() : '000001';
    doc.text(nroRef, marginX + 30, currentY);

    currentY += 15;

    // --- DATOS CLIENTE Y VEHÍCULO (2 Columnas) ---
    const moto = detalle.moto || {};
    const cliente = moto.cliente || {};

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colorPrimario);
    doc.text('Datos del Cliente', marginX, currentY);
    doc.text('Datos del Vehículo', 105, currentY);

    currentY += 2;
    doc.setDrawColor(...colorPrimario);
    doc.setLineWidth(0.5);
    doc.line(marginX, currentY, 95, currentY);
    doc.line(105, currentY, 195 - marginX + 15, currentY);

    currentY += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...colorTextoBase);

    doc.text('Nombre:', marginX, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(cliente.nombre || 'Consumidor Final', marginX + 18, currentY);

    if (cliente.dni) {
      doc.setFont('helvetica', 'bold');
      doc.text('DNI:', marginX, currentY + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(cliente.dni, marginX + 18, currentY + 5);
    }

    doc.setFont('helvetica', 'bold');
    doc.text('Vehículo:', 105, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${moto.marca || ''} ${moto.modelo || ''}`, 105 + 20, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text('Patente:', 105, currentY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(moto.dominio || 'Sin patente', 105 + 20, currentY + 5);

    currentY += 20;

    // --- TABLA DE REPUESTOS Y MANO DE OBRA ---
    const tableData: any[] = [];

    if (detalle.repuestosUsados && detalle.repuestosUsados.length > 0) {
      detalle.repuestosUsados.forEach((r: any) => {
        tableData.push([
          r.producto?.nombre || 'Repuesto',
          r.cantidad.toString(),
          `$${r.precioUnitarioCongelado.toLocaleString('es-AR')}`,
          `$${(r.cantidad * r.precioUnitarioCongelado).toLocaleString('es-AR')}`
        ]);
      });
    }

    if (detalle.totalManoObra && detalle.totalManoObra > 0) {
      tableData.push([
        'Mano de Obra',
        '1',
        `$${detalle.totalManoObra.toLocaleString('es-AR')}`,
        `$${detalle.totalManoObra.toLocaleString('es-AR')}`
      ]);
    }

    autoTable(doc, {
      startY: currentY,
      head: [['Descripción', 'Unidades', 'Precio Unitario', 'Precio Total']],
      body: tableData,
      theme: 'plain',
      headStyles: {
        textColor: colorPrimario,
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'left',
        lineWidth: { top: 0.5, bottom: 0.5 },
        lineColor: colorPrimario
      },
      bodyStyles: {
        textColor: colorTextoBase,
        fontSize: 10
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 80 },
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      },
      margin: { left: marginX, right: marginX }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // --- TOTALES ---
    const totalRepuestos = detalle.totalRepuestos || 0;
    const totalManoObra = detalle.totalManoObra || 0;
    const totalGeneral = totalRepuestos + totalManoObra;

    const totX = 140;
    const valX = 195 - marginX;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colorPrimario);
    doc.setFontSize(10);
    doc.text('TOTAL REPUESTOS:', totX, currentY, { align: 'right' });
    doc.setTextColor(...colorTextoBase);
    doc.text(`$${totalRepuestos.toLocaleString('es-AR')}`, valX, currentY, { align: 'right' });

    currentY += 6;

    doc.setTextColor(...colorPrimario);
    doc.text('MANO DE OBRA:', totX, currentY, { align: 'right' });
    doc.setTextColor(...colorTextoBase);
    doc.text(`$${totalManoObra.toLocaleString('es-AR')}`, valX, currentY, { align: 'right' });

    currentY += 10;

    doc.setFontSize(14);
    doc.setTextColor(...colorPrimario);
    doc.text('TOTAL:', totX, currentY, { align: 'right' });
    doc.setTextColor(...colorTextoBase);
    doc.text(`$${totalGeneral.toLocaleString('es-AR')}`, valX, currentY, { align: 'right' });

    currentY += 15;

    // --- COMENTARIOS ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...colorPrimario);
    doc.text('Problema Reportado / Comentarios:', marginX, currentY);

    currentY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...colorTextoBase);
    const textLines = doc.splitTextToSize(detalle.descripcionProblema || 'Sin comentarios.', 180);
    doc.text(textLines, marginX, currentY);

    // Guardar PDF
    const filename = `Presupuesto_${moto.marca || 'Moto'}_${moto.modelo || ''}.pdf`;
    doc.save(filename.replace(/\s+/g, '_'));

  } catch (error) {
    console.error('Error al generar PDF:', error);
    alert('Ocurrió un error al generar el PDF. Revisa la consola para más detalles.');
  }
};
