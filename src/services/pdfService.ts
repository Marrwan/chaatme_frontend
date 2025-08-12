import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface PDFGenerationOptions {
  filename?: string;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  quality?: number;
}

export class PDFService {
  /**
   * Generate PDF from HTML element
   */
  static async generatePDFFromElement(
    element: HTMLElement,
    options: PDFGenerationOptions = {}
  ): Promise<void> {
    const {
      filename = 'document.pdf',
      format = 'a4',
      orientation = 'portrait',
      quality = 1
    } = options;

    try {
      // Create canvas from HTML element
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });

      // Convert canvas to image
      const imgData = canvas.toDataURL('image/png', quality);

      // Calculate PDF dimensions
      const pdf = new jsPDF(orientation, 'mm', format);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Calculate image dimensions to fit PDF
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      // Download PDF
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  /**
   * Generate PDF from multiple elements (for pagination)
   */
  static async generateMultiPagePDF(
    elements: HTMLElement[],
    options: PDFGenerationOptions = {}
  ): Promise<void> {
    const {
      filename = 'document.pdf',
      format = 'a4',
      orientation = 'portrait',
      quality = 1
    } = options;

    try {
      const pdf = new jsPDF(orientation, 'mm', format);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < elements.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        const canvas = await html2canvas(elements[i], {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: elements[i].scrollWidth,
          height: elements[i].scrollHeight,
          scrollX: 0,
          scrollY: 0
        });

        const imgData = canvas.toDataURL('image/png', quality);
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 0;

        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      }

      pdf.save(filename);
    } catch (error) {
      console.error('Error generating multi-page PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  /**
   * Generate PDF from URL (for server-side rendering)
   */
  static async generatePDFFromURL(
    url: string,
    options: PDFGenerationOptions = {}
  ): Promise<void> {
    const {
      filename = 'document.pdf',
      format = 'a4',
      orientation = 'portrait',
      quality = 1
    } = options;

    try {
      // This would require server-side implementation
      // For now, we'll use the element-based approach
      throw new Error('URL-based PDF generation not implemented');
    } catch (error) {
      console.error('Error generating PDF from URL:', error);
      throw new Error('Failed to generate PDF from URL');
    }
  }


}

export default PDFService; 