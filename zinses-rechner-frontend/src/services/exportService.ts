/**
 * 导出服务
 * 支持CSV、Excel、PDF三种格式的数据导出
 */

import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { saveAs } from '../utils/file-saver-mock'
import type { CalculationResult, CalculatorForm } from '@/types/calculator'
import { formatCurrency, formatPercentage, formatDate } from '@/utils/formatters'

export interface ExportOptions {
  includeChart?: boolean
  includeFormula?: boolean
  language?: 'de' | 'en'
}

export class ExportService {
  private static instance: ExportService

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService()
    }
    return ExportService.instance
  }

  /**
   * 生成文件名
   */
  private generateFileName(type: 'csv' | 'xlsx' | 'pdf', form: CalculatorForm): string {
    const timestamp = new Date().toISOString().slice(0, 10)
    const principal = Math.round(form.principal / 1000)
    const years = form.years

    return `Zinseszins-Berechnung_${principal}k-EUR_${years}Jahre_${timestamp}.${type}`
  }

  /**
   * 准备导出数据
   */
  private prepareExportData(result: CalculationResult, form: CalculatorForm) {
    const summary = {
      'Startkapital': formatCurrency(form.principal),
      'Monatliche Sparrate': formatCurrency(form.monthlyPayment),
      'Zinssatz': formatPercentage(form.annualRate),
      'Laufzeit': `${form.years} Jahre`,
      'Zinszahlungsfrequenz': this.formatCompoundFrequency(form.compoundFrequency),
      'Endkapital': formatCurrency(result.finalAmount || 0),
      'Eingezahlt gesamt': formatCurrency(result.totalContributions || 0),
      'Zinserträge': formatCurrency(result.totalInterest || 0),
      'Gesamtrendite': formatPercentage((((result.finalAmount || 0) - (result.totalContributions || 0)) / Math.max(result.totalContributions || 1, 1)) * 100),
      'Jährliche Rendite': formatPercentage(result.annualReturn || 0),
      'Berechnet am': formatDate(new Date())
    }

    const yearlyData = (result.yearlyBreakdown || []).map(year => ({
      'Jahr': year.year,
      'Startbetrag': formatCurrency(year.start_amount),
      'Einzahlungen': formatCurrency(year.contributions),
      'Zinserträge': formatCurrency(year.interest),
      'Endbetrag': formatCurrency(year.end_amount),
      'Wachstum': formatPercentage(year.growth_rate || 0)
    }))

    return { summary, yearlyData }
  }

  private formatCompoundFrequency(frequency: string): string {
    const map: Record<string, string> = {
      'monthly': 'Monatlich',
      'quarterly': 'Vierteljährlich',
      'yearly': 'Jährlich'
    }
    return map[frequency] || frequency
  }

  /**
   * CSV导出
   */
  async exportToCSV(result: CalculationResult, form: CalculatorForm, options: ExportOptions = {}): Promise<void> {
    try {
      const { summary, yearlyData } = this.prepareExportData(result, form)

      // 创建CSV内容
      let csvContent = '\uFEFF' // BOM for UTF-8

      // 添加摘要信息
      csvContent += 'ZINSESZINS-BERECHNUNG ÜBERSICHT\n\n'
      Object.entries(summary).forEach(([key, value]) => {
        csvContent += `"${key}","${value}"\n`
      })

      csvContent += '\n\nJÄHRLICHE ENTWICKLUNG\n\n'

      // 添加表头
      const headers = Object.keys(yearlyData[0] || {})
      csvContent += headers.map(h => `"${h}"`).join(',') + '\n'

      // 添加数据行
      yearlyData.forEach(row => {
        const values = Object.values(row).map(v => `"${v}"`)
        csvContent += values.join(',') + '\n'
      })

      // 下载文件
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
      const fileName = this.generateFileName('csv', form)
      saveAs(blob, fileName)

    } catch (error) {
      console.error('CSV导出失败:', error)
      throw new Error('CSV导出失败。请重试。')
    }
  }

  /**
   * Excel导出
   */
  async exportToExcel(result: CalculationResult, form: CalculatorForm, options: ExportOptions = {}): Promise<void> {
    try {
      const { summary, yearlyData } = this.prepareExportData(result, form)

      // 创建工作簿
      const workbook = XLSX.utils.book_new()

      // 工作表1: 概览
      const summaryData = Object.entries(summary).map(([key, value]) => ({
        'Parameter': key,
        'Wert': value
      }))
      const summarySheet = XLSX.utils.json_to_sheet(summaryData)

      // 设置列宽
      summarySheet['!cols'] = [
        { width: 25 },
        { width: 20 }
      ]

      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Übersicht')

      // 工作表2: 年度明细
      const yearlySheet = XLSX.utils.json_to_sheet(yearlyData)
      yearlySheet['!cols'] = [
        { width: 8 },   // Jahr
        { width: 15 },  // Startbetrag
        { width: 15 },  // Einzahlungen
        { width: 15 },  // Zinserträge
        { width: 15 },  // Endbetrag
        { width: 12 }   // Wachstum
      ]

      XLSX.utils.book_append_sheet(workbook, yearlySheet, 'Jährliche Entwicklung')

      // 工作表3: 计算公式说明
      if (options.includeFormula) {
        const formulaData = [
          { 'Formel': 'Zinseszins-Formel', 'Beschreibung': 'A = P(1 + r/n)^(nt)' },
          { 'Formel': 'A', 'Beschreibung': 'Endkapital' },
          { 'Formel': 'P', 'Beschreibung': 'Startkapital' },
          { 'Formel': 'r', 'Beschreibung': 'Zinssatz (dezimal)' },
          { 'Formel': 'n', 'Beschreibung': 'Zinszahlungen pro Jahr' },
          { 'Formel': 't', 'Beschreibung': 'Anzahl Jahre' }
        ]
        const formulaSheet = XLSX.utils.json_to_sheet(formulaData)
        formulaSheet['!cols'] = [{ width: 20 }, { width: 30 }]
        XLSX.utils.book_append_sheet(workbook, formulaSheet, 'Formeln')
      }

      // 导出文件
      const fileName = this.generateFileName('xlsx', form)
      XLSX.writeFile(workbook, fileName)

    } catch (error) {
      console.error('Excel导出失败:', error)
      throw new Error('Excel导出失败。请重试。')
    }
  }

  /**
   * PDF报告导出
   */
  async exportToPDF(
    result: CalculationResult,
    form: CalculatorForm,
    chartElement?: HTMLElement,
    options: ExportOptions = {}
  ): Promise<void> {
    try {
      const { summary } = this.prepareExportData(result, form)

      // 创建PDF文档
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      let yPosition = 20

      // 标题
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Zinseszins-Berechnung', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 15

      // 副标题
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Erstellt am ${formatDate(new Date())}`, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 20

      // 摘要表格
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Berechnungsübersicht', 20, yPosition)
      yPosition += 10

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')

      Object.entries(summary).forEach(([key, value]) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage()
          yPosition = 20
        }

        pdf.text(key + ':', 20, yPosition)
        pdf.setFont('helvetica', 'bold')
        pdf.text(value, 100, yPosition)
        pdf.setFont('helvetica', 'normal')
        yPosition += 7
      })

      // 添加图表（如果提供）
      if (chartElement && options.includeChart) {
        try {
          const canvas = await html2canvas(chartElement, {
            backgroundColor: '#ffffff',
            scale: 2
          })

          const imgData = canvas.toDataURL('image/png')
          const imgWidth = pageWidth - 40
          const imgHeight = (canvas.height * imgWidth) / canvas.width

          if (yPosition + imgHeight > pageHeight - 20) {
            pdf.addPage()
            yPosition = 20
          }

          yPosition += 10
          pdf.setFontSize(14)
          pdf.setFont('helvetica', 'bold')
          pdf.text('Kapitalentwicklung', 20, yPosition)
          yPosition += 10

          pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight)
          yPosition += imgHeight + 10

        } catch (chartError) {
          console.warn('图表添加失败:', chartError)
        }
      }

      // 年度明细表格
      if ((result.yearlyBreakdown || []).length > 0) {
        if (yPosition > pageHeight - 100) {
          pdf.addPage()
          yPosition = 20
        }

        yPosition += 10
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Jährliche Entwicklung', 20, yPosition)
        yPosition += 10

        // 表头
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'bold')
        const headers = ['Jahr', 'Startbetrag', 'Einzahlungen', 'Zinsen', 'Endbetrag']
        const colWidths = [20, 30, 30, 30, 30]
        let xPos = 20

        headers.forEach((header, i) => {
          pdf.text(header, xPos, yPosition)
          xPos += colWidths[i]
        })
        yPosition += 7

        // 数据行
        ;(pdf as any).setFont('helvetica', 'normal')
        (result.yearlyBreakdown || []).slice(0, 20).forEach((year: any) => { // 限制显示前20年
          if (yPosition > pageHeight - 20) {
            pdf.addPage()
            yPosition = 20
          }

          xPos = 20
          const values = [
            year.year.toString(),
            formatCurrency(year.start_amount),
            formatCurrency(year.contributions),
            formatCurrency(year.interest),
            formatCurrency(year.end_amount)
          ]

          values.forEach((value, i) => {
            pdf.text(value, xPos, yPosition)
            xPos += colWidths[i]
          })
          yPosition += 6
        })
      }

      // 免责声明
      if (yPosition > pageHeight - 40) {
        pdf.addPage()
        yPosition = 20
      }

      yPosition += 15
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'italic')
      const disclaimer = 'Haftungsausschluss: Diese Berechnung dient nur zu Informationszwecken. ' +
        'Tatsächliche Ergebnisse können aufgrund von Marktbedingungen, Gebühren und Steuern abweichen. ' +
        'Konsultieren Sie einen Finanzberater für professionelle Beratung.'

      const disclaimerLines = pdf.splitTextToSize(disclaimer, pageWidth - 40)
      pdf.text(disclaimerLines, 20, yPosition)

      // 保存PDF
      const fileName = this.generateFileName('pdf', form)
      pdf.save(fileName)

    } catch (error) {
      console.error('PDF导出失败:', error)
      throw new Error('PDF导出失败。请重试。')
    }
  }
}
