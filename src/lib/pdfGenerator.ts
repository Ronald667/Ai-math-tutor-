import jsPDF from 'jspdf';
import { MathProblem } from '../types';

export function generateProblemPDF(problem: MathProblem, studentName = 'Student'): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const checkPageBreak = (spaceNeeded: number) => {
    if (cursorY + spaceNeeded > pageHeight - margin - 12) {
      doc.addPage();
      cursorY = margin;
      drawHeaderMini();
    }
  };

  const drawHeaderMini = () => {
    doc.setFontSize(8);
    doc.setTextColor(130, 140, 160);
    doc.setFont('helvetica', 'normal');
    doc.text('AI Math Tutor - Step-by-Step Study Document', margin, cursorY);
    doc.text(`Topic: ${problem.topic.toUpperCase()} - ${problem.subtopic}`, pageWidth - margin, cursorY, { align: 'right' });
    cursorY += 4;
    doc.setDrawColor(220, 225, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, cursorY, pageWidth - margin, cursorY);
    cursorY += 6;
  };

  // 1. Document Title Header
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.roundedRect(margin, cursorY, contentWidth, 22, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('AI MATH TUTOR - STEP-BY-STEP STUDY GUIDE', margin + 6, cursorY + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // Slate 300
  const dateStr = new Date(problem.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  doc.text(`Student: ${studentName}  |  Date: ${dateStr}  |  Difficulty: ${problem.difficulty}`, margin + 6, cursorY + 16);

  // Topic Badge
  const topicLabel = problem.topic.toUpperCase();
  const badgeWidth = 26;
  doc.setFillColor(59, 130, 246); // Blue 500
  doc.roundedRect(pageWidth - margin - badgeWidth - 4, cursorY + 5, badgeWidth, 6, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(topicLabel, pageWidth - margin - badgeWidth / 2 - 4, cursorY + 9.2, { align: 'center' });

  cursorY += 28;

  // 2. Problem Statement Box
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.5);

  const titleLines = doc.splitTextToSize(problem.title, contentWidth - 12);
  const titleBoxHeight = 16 + titleLines.length * 5;
  doc.roundedRect(margin, cursorY, contentWidth, titleBoxHeight, 2, 2, 'FD');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('PROBLEM STATEMENT:', margin + 6, cursorY + 6);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138); // Blue 900
  doc.text(titleLines, margin + 6, cursorY + 12);

  cursorY += titleBoxHeight + 6;

  // Math Expression Display Box
  doc.setFillColor(238, 242, 255); // Indigo 50
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(margin, cursorY, contentWidth, 14, 2, 2, 'FD');
  doc.setFontSize(12);
  doc.setFont('courier', 'bold');
  doc.setTextColor(67, 56, 202);
  doc.text(problem.problemLatex || problem.problemRawText || '', pageWidth / 2, cursorY + 9, { align: 'center' });

  cursorY += 20;

  // 3. Key Formulas & Theorems
  if (problem.keyFormulas && problem.keyFormulas.length > 0) {
    checkPageBreak(30);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('KEY THEOREMS & FORMULAS USED', margin, cursorY);
    cursorY += 4;

    for (const formula of problem.keyFormulas) {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, cursorY, contentWidth, 9, 1, 1, 'FD');

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text(`• ${formula.name}:`, margin + 4, cursorY + 6);

      doc.setFont('courier', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text(formula.formula, margin + 52, cursorY + 6);
      cursorY += 11;
    }
    cursorY += 4;
  }

  // 4. Step-by-Step Solution
  checkPageBreak(20);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('STEP-BY-STEP WORKED SOLUTION', margin, cursorY);
  cursorY += 5;

  problem.steps.forEach((step, idx) => {
    checkPageBreak(32);

    // Step Header with Number Circle
    doc.setFillColor(59, 130, 246);
    doc.circle(margin + 4, cursorY + 3, 3.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(String(step.number || idx + 1), margin + 4, cursorY + 4.2, { align: 'center' });

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`Step ${step.number || idx + 1}: ${step.title}`, margin + 11, cursorY + 4.2);

    if (step.keyRule) {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`[Rule: ${step.keyRule}]`, pageWidth - margin, cursorY + 4.2, { align: 'right' });
    }
    cursorY += 7;

    // Step Math Formula Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin + 10, cursorY, contentWidth - 10, 8, 1, 1, 'FD');
    doc.setFontSize(9.5);
    doc.setFont('courier', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text(step.mathLatex, margin + 14, cursorY + 5.5);
    cursorY += 11;

    // Step Explanation
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const expLines = doc.splitTextToSize(step.explanation, contentWidth - 12);
    doc.text(expLines, margin + 10, cursorY);
    cursorY += expLines.length * 4.2 + 2;

    if (step.hint) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(120, 53, 15); // Amber 900
      doc.text(`Tip: ${step.hint}`, margin + 10, cursorY);
      cursorY += 5;
    }
    cursorY += 3;
  });

  // 5. Final Answer Highlight Box
  checkPageBreak(24);
  cursorY += 2;
  doc.setFillColor(236, 253, 245); // Emerald 50
  doc.setDrawColor(16, 185, 129); // Emerald 500
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, cursorY, contentWidth, 16, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70); // Emerald 800
  doc.text('FINAL ANSWER:', margin + 6, cursorY + 6);

  doc.setFontSize(12);
  doc.setFont('courier', 'bold');
  doc.setTextColor(4, 120, 87);
  doc.text(problem.finalAnswer, margin + 6, cursorY + 12);

  cursorY += 22;

  // 6. Verification
  if (problem.verification) {
    checkPageBreak(22);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('MATHEMATICAL VERIFICATION / CHECK:', margin, cursorY);
    cursorY += 4.5;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const verLines = doc.splitTextToSize(problem.verification, contentWidth);
    doc.text(verLines, margin, cursorY);
    cursorY += verLines.length * 4 + 4;
  }

  // 7. Common Pitfalls
  if (problem.commonPitfalls && problem.commonPitfalls.length > 0) {
    checkPageBreak(26);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(153, 27, 27); // Red 800
    doc.text('COMMON PITFALLS TO WATCH FOR:', margin, cursorY);
    cursorY += 4.5;

    for (const pitfall of problem.commonPitfalls) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(185, 28, 28);
      const pitfallLines = doc.splitTextToSize(`⚠ ${pitfall}`, contentWidth);
      doc.text(pitfallLines, margin, cursorY);
      cursorY += pitfallLines.length * 3.8 + 1.5;
    }
    cursorY += 4;
  }

  // 8. Follow-up Challenge Question
  if (problem.followUpChallenge) {
    checkPageBreak(30);
    doc.setFillColor(254, 242, 242); // Rose 50
    doc.setDrawColor(254, 205, 211);
    doc.roundedRect(margin, cursorY, contentWidth, 24, 2, 2, 'FD');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(159, 18, 57);
    doc.text('STUDENT FOLLOW-UP PRACTICE EXERCISE:', margin + 4, cursorY + 5);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(88, 28, 135);
    const qLines = doc.splitTextToSize(problem.followUpChallenge.question, contentWidth - 8);
    doc.text(qLines, margin + 4, cursorY + 10);

    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const optsStr = problem.followUpChallenge.options.map((opt, i) => `(${String.fromCharCode(65 + i)}) ${opt}`).join('   ');
    doc.text(optsStr, margin + 4, cursorY + 16);

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`[Key: Option ${String.fromCharCode(65 + problem.followUpChallenge.correctIndex)}] ${problem.followUpChallenge.explanation.substring(0, 90)}...`, margin + 4, cursorY + 21);
    cursorY += 28;
  }

  // Footer for each page
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text(`AI Math Tutor  •  Cloud Sync ID: ${problem.id}  •  Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
  }

  return doc;
}

export function downloadProblemPDF(problem: MathProblem, studentName = 'Student'): void {
  const doc = generateProblemPDF(problem, studentName);
  const cleanTitle = (problem.title || 'Math_Solution').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${cleanTitle}_Worksheet.pdf`);
}
