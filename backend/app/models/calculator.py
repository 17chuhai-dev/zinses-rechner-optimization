"""
计算器数据模型
定义复利计算相关的Pydantic模型
"""

from pydantic import BaseModel, Field, validator
from typing import List
from datetime import datetime


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


class ValidationError(BaseModel):
    """API验证错误响应"""
    error: str = Field(..., example="VALIDATION_ERROR")
    message: str = Field(..., example="Das Startkapital muss zwischen 1€ und 10.000.000€ liegen")
    field: str = Field(..., example="principal")
    code: str = Field(..., example="INVALID_PRINCIPAL")


class APIError(BaseModel):
    """通用API错误响应"""
    error: str = Field(..., example="CALCULATION_ERROR")
    message: str = Field(..., example="Ein Fehler ist bei der Berechnung aufgetreten")
    code: str = Field(..., example="INTERNAL_ERROR")
    timestamp: str = Field(..., example="2024-01-15T10:30:00Z")


class HealthResponse(BaseModel):
    """健康检查响应"""
    status: str = Field(..., example="healthy")
    service: str = Field(..., example="zinseszins-rechner-api")
    timestamp: str = Field(..., example="2024-01-15T10:30:00Z")
    version: str = Field(..., example="1.0.0")
    uptime: int = Field(..., example=86400)


class LimitsResponse(BaseModel):
    """API限制响应"""
    max_principal: int = Field(..., example=10000000)
    min_principal: int = Field(..., example=1)
    max_monthly_payment: int = Field(..., example=50000)
    min_monthly_payment: int = Field(..., example=0)
    max_annual_rate: float = Field(..., example=20.0)
    min_annual_rate: float = Field(..., example=0.01)
    max_years: int = Field(..., example=50)
    min_years: int = Field(..., example=1)
    supported_frequencies: List[str] = Field(..., example=["monthly", "quarterly", "yearly"])
    currency: str = Field(..., example="EUR")
    locale: str = Field(..., example="de_DE")
    precision: int = Field(..., example=2)
    last_updated: str = Field(..., example="2024-01-15T10:30:00Z")
    api_version: str = Field(..., example="1.0.0")
