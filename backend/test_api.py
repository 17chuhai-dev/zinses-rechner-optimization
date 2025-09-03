#!/usr/bin/env python3
"""
简化的FastAPI测试应用
用于诊断POST请求挂起问题
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime

# 创建最简单的FastAPI应用
app = FastAPI(title="Test API", version="1.0.0")

# 只添加必要的CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Test API is running", "timestamp": datetime.utcnow().isoformat()}

@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

@app.post("/test-post")
def test_post(data: dict = None):
    """最简单的POST端点"""
    return {
        "status": "success",
        "received": data,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/calculate")
def simple_calculate(data: dict):
    """简化的计算端点"""
    try:
        principal = float(data.get('principal', 10000))
        rate = float(data.get('annual_rate', 4.0)) / 100
        years = int(data.get('years', 10))
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
            "annual_return": data.get('annual_rate', 4.0),
            "calculation_time": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {"error": str(e), "message": "Calculation failed"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=False)
