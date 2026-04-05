import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Income, Expense } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import { FileText, Download } from 'lucide-react';

interface ReportGeneratorProps {
  income: Income[];
  expenses: Expense[];
  month?: string;
  year?: string;
}

export default function ReportGenerator({ income, expenses, month, year }: ReportGeneratorProps) {
  const generatePDF = () => {
    const doc = new jsPDF();
    const title = `Financial Report - ${month || ''} ${year || ''}`;
    
    doc.setFontSize(20);
    doc.text('DP Shibir Organization', 105, 15, { align: 'center' });
    doc.setFontSize(16);
    doc.text(title, 105, 25, { align: 'center' });
    
    const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const balance = totalIncome - totalExpenses;

    doc.setFontSize(12);
    doc.text(`Total Income: ${totalIncome} BDT`, 20, 40);
    doc.text(`Total Expenses: ${totalExpenses} BDT`, 20, 50);
    doc.text(`Net Balance: ${balance} BDT`, 20, 60);

    // Income Table
    doc.text('Income Details', 20, 75);
    (doc as any).autoTable({
      startY: 80,
      head: [['Date', 'Donor', 'Category', 'Amount']],
      body: income.map(item => [
        item.date,
        item.donorName,
        item.category,
        `${item.amount} BDT`
      ]),
    });

    // Expense Table
    const finalY = (doc as any).lastAutoTable.finalY || 80;
    doc.text('Expense Details', 20, finalY + 15);
    (doc as any).autoTable({
      startY: finalY + 20,
      head: [['Date', 'Title', 'Category', 'Amount']],
      body: expenses.map(item => [
        item.date,
        item.title,
        item.category,
        `${item.amount} BDT`
      ]),
    });

    doc.save(`Report_${month || 'All'}_${year || 'All'}.pdf`);
  };

  return (
    <button
      onClick={generatePDF}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-blue-100"
    >
      <Download className="w-5 h-5" />
      PDF রিপোর্ট ডাউনলোড করুন
    </button>
  );
}
