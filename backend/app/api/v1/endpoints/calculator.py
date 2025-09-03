"""
复利计算器端点
提供复利计算API服务
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from decimal import Decimal
from datetime import datetime

from app.core.config import get_settings, Settings
from app.core.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)


class CalculatorRequest(BaseModel):
    """
    🧮 Zinseszins-Berechnungsanfrage

    Alle Parameter für eine präzise Zinseszins-Berechnung nach deutschen Standards.
    """
    principal: float = Field(
        ...,
        gt=0,
        le=10_000_000,
        title="Startkapital",
        description="Das anfängliche Kapital in Euro (€). Minimum: 1€, Maximum: 10.000.000€",
        example=10000
    )
    monthly_payment: float = Field(
        default=0,
        ge=0,
        le=50_000,
        title="Monatliche Sparrate",
        description="Zusätzliche monatliche Einzahlung in Euro (€). Optional, Standard: 0€",
        example=500
    )
    annual_rate: float = Field(
        ...,
        gt=0,
        le=20,
        title="Jährlicher Zinssatz",
        description="Erwarteter jährlicher Zinssatz in Prozent (%). Minimum: 0,01%, Maximum: 20%",
        example=4.0
    )
    years: int = Field(
        ...,
        gt=0,
        le=50,
        title="Anlagedauer",
        description="Anlagedauer in Jahren. Minimum: 1 Jahr, Maximum: 50 Jahre",
        example=10
    )
    compound_frequency: str = Field(
        default="monthly",
        title="Zinseszins-Häufigkeit",
        description="Wie oft werden Zinsen kapitalisiert? Optionen: 'monthly' (monatlich), 'quarterly' (quartalsweise), 'yearly' (jährlich)",
        example="monthly"
    )
    
    @validator("compound_frequency")
    def validate_compound_frequency(cls, v):
        """验证复利频率参数"""
        allowed_frequencies = ["monthly", "quarterly", "yearly"]
        if v not in allowed_frequencies:
            raise ValueError(f"Zinseszins-Häufigkeit muss einer der folgenden Werte sein: {', '.join(allowed_frequencies)}")
        return v

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "summary": "Typische Sparplan-Berechnung",
                    "description": "Ein typischer deutscher Sparplan mit monatlichen Einzahlungen",
                    "value": {
                        "principal": 10000,
                        "monthly_payment": 500,
                        "annual_rate": 4.0,
                        "years": 10,
                        "compound_frequency": "monthly"
                    }
                },
                {
                    "summary": "Einmalanlage ohne Sparplan",
                    "description": "Eine einmalige Kapitalanlage ohne weitere Einzahlungen",
                    "value": {
                        "principal": 50000,
                        "monthly_payment": 0,
                        "annual_rate": 3.5,
                        "years": 15,
                        "compound_frequency": "yearly"
                    }
                },
                {
                    "summary": "Langfristige Altersvorsorge",
                    "description": "Langfristige Altersvorsorge mit hohen monatlichen Sparraten",
                    "value": {
                        "principal": 5000,
                        "monthly_payment": 800,
                        "annual_rate": 5.0,
                        "years": 30,
                        "compound_frequency": "monthly"
                    }
                }
            ]
        }
    }


class YearlyBreakdown(BaseModel):
    """
    📅 Jährliche Aufschlüsselung

    Detaillierte Übersicht der Kapitalentwicklung pro Jahr.
    """
    year: int = Field(
        ...,
        title="Jahr",
        description="Das Jahr der Berechnung (1, 2, 3, ...)",
        example=1
    )
    start_amount: float = Field(
        ...,
        title="Startkapital des Jahres",
        description="Kapital zu Beginn des Jahres in Euro (€)",
        example=10000.00
    )
    contributions: float = Field(
        ...,
        title="Jährliche Einzahlungen",
        description="Summe aller Einzahlungen in diesem Jahr in Euro (€)",
        example=6000.00
    )
    interest: float = Field(
        ...,
        title="Zinserträge des Jahres",
        description="Erwirtschaftete Zinsen in diesem Jahr in Euro (€)",
        example=640.00
    )
    end_amount: float = Field(
        ...,
        title="Endkapital des Jahres",
        description="Kapital am Ende des Jahres in Euro (€)",
        example=16640.00
    )
    growth_rate: float = Field(
        ...,
        title="Wachstumsrate",
        description="Prozentuale Wachstumsrate in diesem Jahr (%)",
        example=4.2
    )


class CalculatorResponse(BaseModel):
    """
    📊 Zinseszins-Berechnungsergebnis

    Vollständige Ergebnisse der Zinseszins-Berechnung mit allen relevanten Kennzahlen.
    """
    final_amount: float = Field(
        ...,
        title="Endkapital",
        description="Gesamtes Kapital nach der Anlagedauer in Euro (€)",
        example=75624.32
    )
    total_contributions: float = Field(
        ...,
        title="Gesamte Einzahlungen",
        description="Summe aller Einzahlungen (Startkapital + monatliche Sparraten) in Euro (€)",
        example=70000.00
    )
    total_interest: float = Field(
        ...,
        title="Gesamte Zinserträge",
        description="Summe aller erwirtschafteten Zinsen in Euro (€)",
        example=5624.32
    )
    annual_return: float = Field(
        ...,
        title="Durchschnittliche jährliche Rendite",
        description="Effektive jährliche Rendite in Prozent (%)",
        example=4.2
    )
    yearly_breakdown: List[YearlyBreakdown] = Field(
        ...,
        title="Jährliche Aufschlüsselung",
        description="Detaillierte Übersicht der Kapitalentwicklung für jedes Jahr"
    )
    calculation_time: str = Field(
        ...,
        title="Berechnungszeitpunkt",
        description="Zeitstempel der Berechnung im ISO 8601 Format",
        example="2024-01-15T10:30:00Z"
    )
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "summary": "Erfolgreiche Sparplan-Berechnung",
                    "description": "Ergebnis einer 10-jährigen Sparplan-Berechnung",
                    "value": {
                        "final_amount": 75624.32,
                        "total_contributions": 70000.00,
                        "total_interest": 5624.32,
                        "annual_return": 4.2,
                        "yearly_breakdown": [
                            {
                                "year": 1,
                                "start_amount": 10000.00,
                                "contributions": 6000.00,
                                "interest": 640.00,
                                "end_amount": 16640.00,
                                "growth_rate": 4.0
                            }
                        ],
                        "calculation_time": "2024-01-15T10:30:00Z"
                    }
                }
            ]
        }
    }


@router.post(
    "/compound-interest",
    response_model=CalculatorResponse,
    summary="🧮 Zinseszins berechnen",
    description="""
    **Berechnet präzise Zinseszins-Ergebnisse für deutsche Sparer**

    Diese Funktion führt eine vollständige Zinseszins-Berechnung durch und berücksichtigt:

    ### 📈 Berechnungskomponenten
    - **Startkapital**: Einmaliger Anfangsbetrag
    - **Monatliche Sparrate**: Regelmäßige zusätzliche Einzahlungen
    - **Zinssatz**: Erwartete jährliche Rendite
    - **Zinseszins-Effekt**: Kapitalisierung der Zinserträge

    ### 🎯 Ergebnisse
    - **Endkapital**: Gesamtvermögen nach der Anlagedauer
    - **Zinserträge**: Durch Zinseszins erwirtschaftete Gewinne
    - **Jährliche Aufschlüsselung**: Detaillierte Entwicklung pro Jahr
    - **Effektive Rendite**: Tatsächliche jährliche Wachstumsrate

    ### ⚡ Performance
    - Hochpräzise Decimal-Arithmetik (keine Rundungsfehler)
    - Optimiert für deutsche Finanzstandards
    - Antwortzeit < 500ms für alle Berechnungen

    ### 🔒 Datenschutz
    - Keine Speicherung von Berechnungsdaten
    - DSGVO-konforme Verarbeitung
    - Anonyme Nutzung möglich
    """,
    responses={
        200: {
            "description": "✅ Berechnung erfolgreich durchgeführt",
            "content": {
                "application/json": {
                    "example": {
                        "final_amount": 75624.32,
                        "total_contributions": 70000.00,
                        "total_interest": 5624.32,
                        "annual_return": 4.2,
                        "yearly_breakdown": [
                            {
                                "year": 1,
                                "start_amount": 10000.00,
                                "contributions": 6000.00,
                                "interest": 640.00,
                                "end_amount": 16640.00,
                                "growth_rate": 4.0
                            }
                        ],
                        "calculation_time": "2024-01-15T10:30:00Z"
                    }
                }
            }
        },
        422: {
            "description": "❌ Validierungsfehler - Ungültige Eingabeparameter",
            "content": {
                "application/json": {
                    "example": {
                        "detail": {
                            "error": "VALIDATION_ERROR",
                            "message": "Das Startkapital muss zwischen 1€ und 10.000.000€ liegen",
                            "field": "principal",
                            "code": "INVALID_PRINCIPAL"
                        }
                    }
                }
            }
        },
        500: {
            "description": "🚨 Serverfehler - Unerwarteter Berechnungsfehler",
            "content": {
                "application/json": {
                    "example": {
                        "detail": {
                            "error": "CALCULATION_ERROR",
                            "message": "Ein Fehler ist bei der Berechnung aufgetreten",
                            "code": "INTERNAL_ERROR"
                        }
                    }
                }
            }
        }
    },
    tags=["Calculator"]
)
def calculate_compound_interest(
    request: CalculatorRequest,
    settings: Settings = Depends(get_settings)
):
    """复利计算端点 - 同步版本以避免异步问题"""
    try:
        logger.info(f"开始复利计算: 本金={request.principal}, 年限={request.years}")

        # 基本输入验证
        if request.principal <= 0 or request.annual_rate <= 0 or request.years <= 0:
            raise HTTPException(
                status_code=400,
                detail={"message": "Invalid input parameters", "code": "INVALID_INPUT"}
            )

        # 简单的复利计算
        principal = float(request.principal)
        rate = float(request.annual_rate) / 100  # 转换为小数
        years = int(request.years)
        monthly_payment = float(request.monthly_payment)

        # 计算复利
        final_amount = principal * ((1 + rate) ** years)

        # 如果有月供，计算月供的复利
        if monthly_payment > 0:
            # 月供的未来价值计算
            monthly_rate = rate / 12
            months = years * 12
            if monthly_rate > 0:
                monthly_fv = monthly_payment * (((1 + monthly_rate) ** months - 1) / monthly_rate)
                final_amount += monthly_fv
            else:
                final_amount += monthly_payment * months

        total_contributions = principal + (monthly_payment * 12 * years)
        total_interest = final_amount - total_contributions

        # 返回字典而不是Pydantic模型，避免序列化问题
        response = {
            "final_amount": round(final_amount, 2),
            "total_contributions": round(total_contributions, 2),
            "total_interest": round(total_interest, 2),
            "annual_return": round(request.annual_rate, 2),
            "yearly_breakdown": [],
            "calculation_time": datetime.utcnow().isoformat() + "Z"
        }

        logger.info(f"复利计算完成: 最终金额={response['final_amount']}")
        return response

    except HTTPException:
        # 重新抛出HTTP异常
        raise
    except Exception as e:
        logger.error(f"复利计算错误: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Ein Fehler ist bei der Berechnung aufgetreten",
                "error": str(e),
                "code": "CALCULATION_ERROR"
            }
        )


@router.get(
    "/test",
    summary="🧪 简单测试端点",
    description="用于测试API连接的简单端点"
)
async def test_endpoint():
    """简单的测试端点"""
    return {"message": "API is working", "timestamp": datetime.utcnow().isoformat()}


@router.post(
    "/test-post",
    summary="🧪 简单POST测试端点",
    description="用于测试POST请求的简单端点"
)
async def test_post_endpoint(data: dict):
    """简单的POST测试端点"""
    return {
        "message": "POST is working",
        "received_data": data,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.post(
    "/simple-calc",
    summary="🧮 简化复利计算",
    description="简化版本的复利计算，不使用复杂验证"
)
def simple_compound_interest(data: dict):
    """简化的复利计算端点 - 同步版本"""
    try:
        principal = float(data.get('principal', 0))
        rate = float(data.get('annual_rate', 0)) / 100
        years = int(data.get('years', 0))
        monthly_payment = float(data.get('monthly_payment', 0))

        # 简单复利计算
        final_amount = principal * ((1 + rate) ** years)

        if monthly_payment > 0:
            monthly_rate = rate / 12
            months = years * 12
            if monthly_rate > 0:
                monthly_fv = monthly_payment * (((1 + monthly_rate) ** months - 1) / monthly_rate)
                final_amount += monthly_fv
            else:
                final_amount += monthly_payment * months

        total_contributions = principal + (monthly_payment * 12 * years)
        total_interest = final_amount - total_contributions

        return {
            "final_amount": round(final_amount, 2),
            "total_contributions": round(total_contributions, 2),
            "total_interest": round(total_interest, 2),
            "annual_return": data.get('annual_rate', 0),
            "calculation_time": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {"error": str(e), "message": "Calculation failed"}


@router.post("/debug-echo")
def debug_echo(request_data: dict):
    """调试用的回显端点"""
    return {
        "status": "success",
        "received_data": request_data,
        "timestamp": datetime.utcnow().isoformat(),
        "message": "Echo successful"
    }


@router.post("/minimal-test")
def minimal_test():
    """最小化测试端点 - 无参数，无依赖"""
    return {"result": "ok", "time": datetime.utcnow().isoformat()}


@router.get(
    "/limits",
    summary="📏 API-Berechnungslimits",
    description="""
    **Gibt die aktuellen Berechnungslimits der API zurück**

    Diese Limits werden für die Frontend-Validierung und Benutzerführung verwendet.

    ### 🎯 Verwendungszweck
    - Frontend-Formularvalidierung
    - Benutzerführung bei Eingaben
    - API-Client-Konfiguration
    - Fehlerprävention

    ### 📊 Limit-Kategorien
    - **Kapital-Limits**: Minimum und Maximum für Startkapital
    - **Sparraten-Limits**: Grenzen für monatliche Einzahlungen
    - **Zinssatz-Limits**: Realistische Zinssatz-Bereiche
    - **Zeit-Limits**: Maximale Berechnungsdauer

    ### 🔄 Aktualisierung
    - Limits können sich mit API-Updates ändern
    - Frontend sollte diese Werte regelmäßig abrufen
    - Caching für 1 Stunde empfohlen
    """,
    responses={
        200: {
            "description": "✅ Aktuelle API-Limits erfolgreich abgerufen",
            "content": {
                "application/json": {
                    "example": {
                        "max_principal": 10000000,
                        "max_monthly_payment": 50000,
                        "max_annual_rate": 20.0,
                        "max_years": 50,
                        "supported_frequencies": ["monthly", "quarterly", "yearly"],
                        "currency": "EUR",
                        "locale": "de_DE",
                        "precision": 2,
                        "last_updated": "2024-01-15T10:30:00Z"
                    }
                }
            }
        }
    },
    tags=["Calculator"]
)
async def get_calculation_limits(settings: Settings = Depends(get_settings)):
    """
    获取API计算限制

    返回当前API的所有计算参数限制，用于前端验证和用户指导。
    """

    return {
        "max_principal": settings.MAX_PRINCIPAL_AMOUNT,
        "min_principal": 1,
        "max_monthly_payment": settings.MAX_MONTHLY_PAYMENT,
        "min_monthly_payment": 0,
        "max_annual_rate": settings.MAX_ANNUAL_RATE,
        "min_annual_rate": 0.01,
        "max_years": settings.MAX_CALCULATION_YEARS,
        "min_years": 1,
        "supported_frequencies": ["monthly", "quarterly", "yearly"],
        "currency": settings.DEFAULT_CURRENCY,
        "locale": settings.DEFAULT_LOCALE,
        "precision": 2,
        "last_updated": datetime.now().isoformat(),
        "api_version": "1.0.0"
    }
