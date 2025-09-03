"""
导出服务
支持CSV、Excel、PDF格式的后端数据导出
"""

import io
import csv
from datetime import datetime
from typing import Dict, List, Any, Optional
from decimal import Decimal

import pandas as pd
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from fastapi import HTTPException
from fastapi.responses import StreamingResponse

from app.models.calculator import CalculatorRequest


class ExportService:
    """导出服务类"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            alignment=1  # 居中
        )
    
    def format_currency(self, amount: float) -> str:
        """格式化货币为德语格式"""
        return f"{amount:,.2f} €".replace(",", "X").replace(".", ",").replace("X", ".")
    
    def format_percentage(self, value: float) -> str:
        """格式化百分比为德语格式"""
        return f"{value:.1f}%".replace(".", ",")
    
    def generate_filename(self, format_type: str, request: CalculatorRequest) -> str:
        """生成文件名"""
        timestamp = datetime.now().strftime("%Y-%m-%d")
        principal_k = int(request.principal / 1000)
        return f"Zinseszins-Berechnung_{principal_k}k-EUR_{request.years}Jahre_{timestamp}.{format_type}"
    
    def prepare_export_data(self, result, request: CalculatorRequest) -> Dict[str, Any]:
        """准备导出数据"""
        # 处理CalculatorResponse对象或字典
        if hasattr(result, 'final_amount'):
            # Pydantic模型对象
            final_amount = result.final_amount
            total_contributions = result.total_contributions
            total_interest = result.total_interest
            annual_return = result.annual_return
            yearly_breakdown = result.yearly_breakdown
        else:
            # 字典格式
            final_amount = result['final_amount']
            total_contributions = result['total_contributions']
            total_interest = result['total_interest']
            annual_return = result['annual_return']
            yearly_breakdown = result.get('yearly_breakdown', [])

        summary = {
            'Startkapital': self.format_currency(request.principal),
            'Monatliche Sparrate': self.format_currency(request.monthly_payment),
            'Zinssatz': self.format_percentage(request.annual_rate),
            'Laufzeit': f"{request.years} Jahre",
            'Zinszahlungsfrequenz': self._format_compound_frequency(request.compound_frequency),
            'Endkapital': self.format_currency(final_amount),
            'Eingezahlt gesamt': self.format_currency(total_contributions),
            'Zinserträge': self.format_currency(total_interest),
            'Gesamtrendite': self.format_percentage(
                ((final_amount - total_contributions) / total_contributions) * 100
            ),
            'Jährliche Rendite': self.format_percentage(annual_return),
            'Berechnet am': datetime.now().strftime("%d.%m.%Y")
        }

        yearly_data = []
        for year in yearly_breakdown:
            # 处理YearlyBreakdown对象或字典
            if hasattr(year, 'year'):
                yearly_data.append({
                    'Jahr': year.year,
                    'Startbetrag': self.format_currency(year.start_amount),
                    'Einzahlungen': self.format_currency(year.contributions),
                    'Zinserträge': self.format_currency(year.interest),
                    'Endbetrag': self.format_currency(year.end_amount),
                    'Wachstum': self.format_percentage(getattr(year, 'growth_rate', 0))
                })
            else:
                yearly_data.append({
                    'Jahr': year['year'],
                    'Startbetrag': self.format_currency(year['start_amount']),
                    'Einzahlungen': self.format_currency(year['contributions']),
                    'Zinserträge': self.format_currency(year['interest']),
                    'Endbetrag': self.format_currency(year['end_amount']),
                    'Wachstum': self.format_percentage(year.get('growth_rate', 0))
                })

        return {'summary': summary, 'yearly_data': yearly_data}
    
    def _format_compound_frequency(self, frequency: str) -> str:
        """格式化复利频率"""
        frequency_map = {
            'monthly': 'Monatlich',
            'quarterly': 'Vierteljährlich',
            'yearly': 'Jährlich'
        }
        return frequency_map.get(frequency, frequency)
    
    async def export_to_csv(
        self, 
        result: Dict[str, Any], 
        request: CalculatorRequest
    ) -> StreamingResponse:
        """导出为CSV格式"""
        try:
            data = self.prepare_export_data(result, request)
            
            # 创建CSV内容
            output = io.StringIO()
            output.write('\ufeff')  # BOM for UTF-8
            
            # 写入摘要信息
            output.write('ZINSESZINS-BERECHNUNG ÜBERSICHT\n\n')
            for key, value in data['summary'].items():
                output.write(f'"{key}","{value}"\n')
            
            output.write('\n\nJÄHRLICHE ENTWICKLUNG\n\n')
            
            # 写入年度明细
            if data['yearly_data']:
                fieldnames = list(data['yearly_data'][0].keys())
                writer = csv.DictWriter(output, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
                writer.writeheader()
                writer.writerows(data['yearly_data'])
            
            # 创建响应
            csv_content = output.getvalue()
            output.close()
            
            filename = self.generate_filename('csv', request)
            
            return StreamingResponse(
                io.StringIO(csv_content),
                media_type='text/csv',
                headers={
                    'Content-Disposition': f'attachment; filename="{filename}"',
                    'Content-Type': 'text/csv; charset=utf-8'
                }
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"CSV导出失败: {str(e)}")
    
    async def export_to_excel(
        self, 
        result: Dict[str, Any], 
        request: CalculatorRequest
    ) -> StreamingResponse:
        """导出为Excel格式"""
        try:
            data = self.prepare_export_data(result, request)
            
            # 创建Excel文件
            output = io.BytesIO()
            
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                # 工作表1: 概览
                summary_df = pd.DataFrame(
                    list(data['summary'].items()),
                    columns=['Parameter', 'Wert']
                )
                summary_df.to_excel(writer, sheet_name='Übersicht', index=False)
                
                # 工作表2: 年度明细
                if data['yearly_data']:
                    yearly_df = pd.DataFrame(data['yearly_data'])
                    yearly_df.to_excel(writer, sheet_name='Jährliche Entwicklung', index=False)
                
                # 工作表3: 公式说明
                formula_data = [
                    ['Formel', 'Beschreibung'],
                    ['Zinseszins-Formel', 'A = P(1 + r/n)^(nt)'],
                    ['A', 'Endkapital'],
                    ['P', 'Startkapital'],
                    ['r', 'Zinssatz (dezimal)'],
                    ['n', 'Zinszahlungen pro Jahr'],
                    ['t', 'Anzahl Jahre']
                ]
                formula_df = pd.DataFrame(formula_data[1:], columns=formula_data[0])
                formula_df.to_excel(writer, sheet_name='Formeln', index=False)
            
            output.seek(0)
            filename = self.generate_filename('xlsx', request)
            
            return StreamingResponse(
                io.BytesIO(output.read()),
                media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                headers={
                    'Content-Disposition': f'attachment; filename="{filename}"'
                }
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Excel导出失败: {str(e)}")
    
    async def export_to_pdf(
        self, 
        result: Dict[str, Any], 
        request: CalculatorRequest
    ) -> StreamingResponse:
        """导出为PDF格式"""
        try:
            data = self.prepare_export_data(result, request)
            
            # 创建PDF
            output = io.BytesIO()
            doc = SimpleDocTemplate(output, pagesize=A4)
            story = []
            
            # 标题
            title = Paragraph("Zinseszins-Berechnung", self.title_style)
            story.append(title)
            story.append(Spacer(1, 12))
            
            # 副标题
            subtitle = Paragraph(
                f"Erstellt am {datetime.now().strftime('%d.%m.%Y')}",
                self.styles['Normal']
            )
            story.append(subtitle)
            story.append(Spacer(1, 20))
            
            # 摘要表格
            summary_title = Paragraph("Berechnungsübersicht", self.styles['Heading2'])
            story.append(summary_title)
            story.append(Spacer(1, 12))
            
            summary_table_data = [['Parameter', 'Wert']]
            for key, value in data['summary'].items():
                summary_table_data.append([key, value])
            
            summary_table = Table(summary_table_data, colWidths=[3*inch, 2*inch])
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(summary_table)
            story.append(Spacer(1, 20))
            
            # 年度明细表格
            if data['yearly_data']:
                yearly_title = Paragraph("Jährliche Entwicklung", self.styles['Heading2'])
                story.append(yearly_title)
                story.append(Spacer(1, 12))
                
                yearly_table_data = [list(data['yearly_data'][0].keys())]
                for row in data['yearly_data'][:15]:  # 限制显示前15年
                    yearly_table_data.append(list(row.values()))
                
                yearly_table = Table(yearly_table_data, colWidths=[0.8*inch, 1.2*inch, 1.2*inch, 1.2*inch, 1.2*inch, 1*inch])
                yearly_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('FONTSIZE', (0, 1), (-1, -1), 8),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                
                story.append(yearly_table)
                story.append(Spacer(1, 20))
            
            # 免责声明
            disclaimer_text = """
            <b>Haftungsausschluss:</b> Diese Berechnung dient nur zu Informationszwecken. 
            Tatsächliche Ergebnisse können aufgrund von Marktbedingungen, Gebühren und Steuern abweichen. 
            Konsultieren Sie einen Finanzberater für professionelle Beratung.
            """
            disclaimer = Paragraph(disclaimer_text, self.styles['Normal'])
            story.append(disclaimer)
            
            # 构建PDF
            doc.build(story)
            output.seek(0)
            
            filename = self.generate_filename('pdf', request)
            
            return StreamingResponse(
                io.BytesIO(output.read()),
                media_type='application/pdf',
                headers={
                    'Content-Disposition': f'attachment; filename="{filename}"'
                }
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PDF导出失败: {str(e)}")


# 单例实例
export_service = ExportService()
