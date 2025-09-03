"""
导出API端点
提供CSV、Excel、PDF格式的计算结果导出
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import Dict, Any

from app.models.calculator import CalculatorRequest
from app.services.calculator_service import CalculatorService
from app.services.export_service import export_service
from app.core.validation import validate_calculation_input

router = APIRouter(tags=["export"])


@router.post("/csv")
async def export_csv(
    request_data: Dict[str, Any]
) -> StreamingResponse:
    """
    导出计算结果为CSV格式
    
    Args:
        request_data: 计算请求数据
        
    Returns:
        CSV文件流响应
    """
    try:
        # 验证输入数据
        validated_request = validate_calculation_input(request_data)
        
        # 执行计算
        calculator = CalculatorService()
        result = calculator.calculate_compound_interest(validated_request)
        
        # 导出CSV
        return await export_service.export_to_csv(result, validated_request)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "EXPORT_FAILED",
                "message": f"CSV导出失败: {str(e)}",
                "code": "CSV_EXPORT_ERROR"
            }
        )


@router.post("/excel")
async def export_excel(
    request_data: Dict[str, Any]
) -> StreamingResponse:
    """
    导出计算结果为Excel格式
    
    Args:
        request_data: 计算请求数据
        
    Returns:
        Excel文件流响应
    """
    try:
        # 验证输入数据
        validated_request = validate_calculation_input(request_data)
        
        # 执行计算
        calculator = CalculatorService()
        result = calculator.calculate_compound_interest(validated_request)
        
        # 导出Excel
        return await export_service.export_to_excel(result, validated_request)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "EXPORT_FAILED",
                "message": f"Excel导出失败: {str(e)}",
                "code": "EXCEL_EXPORT_ERROR"
            }
        )


@router.post("/pdf")
async def export_pdf(
    request_data: Dict[str, Any]
) -> StreamingResponse:
    """
    导出计算结果为PDF格式
    
    Args:
        request_data: 计算请求数据
        
    Returns:
        PDF文件流响应
    """
    try:
        # 验证输入数据
        validated_request = validate_calculation_input(request_data)
        
        # 执行计算
        calculator = CalculatorService()
        result = calculator.calculate_compound_interest(validated_request)
        
        # 导出PDF
        return await export_service.export_to_pdf(result, validated_request)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "EXPORT_FAILED",
                "message": f"PDF导出失败: {str(e)}",
                "code": "PDF_EXPORT_ERROR"
            }
        )


@router.get("/formats")
async def get_supported_formats():
    """
    获取支持的导出格式列表
    
    Returns:
        支持的导出格式信息
    """
    return {
        "supported_formats": [
            {
                "format": "csv",
                "name": "CSV-Datei",
                "description": "Komma-getrennte Werte für Tabellenkalkulationen",
                "mime_type": "text/csv",
                "extension": ".csv",
                "features": ["summary", "yearly_breakdown"]
            },
            {
                "format": "excel",
                "name": "Excel-Arbeitsmappe",
                "description": "Microsoft Excel-Datei mit mehreren Arbeitsblättern",
                "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "extension": ".xlsx",
                "features": ["summary", "yearly_breakdown", "formulas", "formatting"]
            },
            {
                "format": "pdf",
                "name": "PDF-Bericht",
                "description": "Professioneller PDF-Bericht für Präsentationen",
                "mime_type": "application/pdf",
                "extension": ".pdf",
                "features": ["summary", "yearly_breakdown", "formatting", "disclaimer"]
            }
        ],
        "max_years_in_breakdown": 15,
        "supported_languages": ["de"],
        "filename_pattern": "Zinseszins-Berechnung_{principal}k-EUR_{years}Jahre_{date}.{extension}"
    }


@router.post("/preview")
async def preview_export_data(
    request_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    预览导出数据结构（不生成文件）
    
    Args:
        request_data: 计算请求数据
        
    Returns:
        导出数据预览
    """
    try:
        # 验证输入数据
        validated_request = validate_calculation_input(request_data)
        
        # 执行计算
        calculator = CalculatorService()
        result = calculator.calculate_compound_interest(validated_request)
        
        # 准备导出数据
        export_data = export_service.prepare_export_data(result, validated_request)
        
        return {
            "preview": export_data,
            "metadata": {
                "total_years": len(export_data["yearly_data"]),
                "summary_fields": len(export_data["summary"]),
                "estimated_file_sizes": {
                    "csv": f"~{len(str(export_data)) // 10} KB",
                    "excel": f"~{len(str(export_data)) // 5} KB", 
                    "pdf": f"~{len(str(export_data)) // 2} KB"
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "PREVIEW_FAILED",
                "message": f"数据预览失败: {str(e)}",
                "code": "PREVIEW_ERROR"
            }
        )


@router.get("/health")
async def export_health_check():
    """
    导出服务健康检查
    
    Returns:
        服务状态信息
    """
    try:
        # 检查必要的依赖
        import pandas
        import openpyxl
        import reportlab
        
        return {
            "status": "healthy",
            "service": "export",
            "dependencies": {
                "pandas": pandas.__version__,
                "openpyxl": openpyxl.__version__,
                "reportlab": reportlab.Version
            },
            "supported_formats": ["csv", "excel", "pdf"],
            "timestamp": "2024-01-20T10:00:00Z"
        }
        
    except ImportError as e:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "DEPENDENCY_MISSING",
                "message": f"导出服务依赖缺失: {str(e)}",
                "code": "DEPENDENCY_ERROR"
            }
        )
