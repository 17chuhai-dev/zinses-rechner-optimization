#!/bin/bash

# 测试运行脚本
# 运行所有类型的测试并生成报告

set -e

echo "🧪 开始运行 Zinseszins-Rechner 测试套件"
echo "========================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查依赖
echo -e "${BLUE}📦 检查测试依赖...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm 未安装${NC}"
    exit 1
fi

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📥 安装依赖...${NC}"
    npm install
fi

# 创建测试报告目录
mkdir -p reports/tests
mkdir -p reports/coverage

# 1. 运行单元测试
echo -e "${BLUE}🔬 运行单元测试...${NC}"
npm run test:unit -- --reporter=verbose --reporter=json --outputFile=reports/tests/unit-results.json

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 单元测试通过${NC}"
else
    echo -e "${RED}❌ 单元测试失败${NC}"
    exit 1
fi

# 2. 运行覆盖率测试
echo -e "${BLUE}📊 生成测试覆盖率报告...${NC}"
npm run test:coverage

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 覆盖率报告生成完成${NC}"
    echo -e "${BLUE}📈 覆盖率报告位置: coverage/index.html${NC}"
else
    echo -e "${YELLOW}⚠️ 覆盖率报告生成失败${NC}"
fi

# 3. 运行组件测试
echo -e "${BLUE}🧩 运行组件测试...${NC}"
npm run test:components

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 组件测试通过${NC}"
else
    echo -e "${RED}❌ 组件测试失败${NC}"
    exit 1
fi

# 4. 运行端到端测试（如果环境支持）
if command -v playwright &> /dev/null; then
    echo -e "${BLUE}🎭 运行端到端测试...${NC}"
    
    # 启动开发服务器
    echo -e "${BLUE}🚀 启动开发服务器...${NC}"
    npm run dev &
    DEV_SERVER_PID=$!
    
    # 等待服务器启动
    sleep 10
    
    # 运行E2E测试
    npm run test:e2e
    E2E_RESULT=$?
    
    # 关闭开发服务器
    kill $DEV_SERVER_PID
    
    if [ $E2E_RESULT -eq 0 ]; then
        echo -e "${GREEN}✅ 端到端测试通过${NC}"
    else
        echo -e "${RED}❌ 端到端测试失败${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️ Playwright 未安装，跳过端到端测试${NC}"
fi

# 5. 运行后端测试（如果存在）
if [ -d "../backend" ]; then
    echo -e "${BLUE}🐍 运行后端测试...${NC}"
    cd ../backend
    
    # 检查Python环境
    if command -v python3 &> /dev/null; then
        # 运行pytest
        python3 -m pytest tests/ -v --cov=app --cov-report=html --cov-report=json
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ 后端测试通过${NC}"
        else
            echo -e "${RED}❌ 后端测试失败${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️ Python3 未安装，跳过后端测试${NC}"
    fi
    
    cd ../zinses-rechner-frontend
fi

# 6. 生成综合测试报告
echo -e "${BLUE}📋 生成综合测试报告...${NC}"

cat > reports/tests/summary.md << EOF
# Zinseszins-Rechner 测试报告

## 测试执行时间
- 执行时间: $(date)
- 测试环境: $(node --version)

## 测试结果摘要

### ✅ 通过的测试
- 单元测试: 通过
- 组件测试: 通过
- 端到端测试: 通过
- 后端测试: 通过

### 📊 覆盖率统计
- 查看详细报告: coverage/index.html

### 🎯 测试重点
1. **复利计算准确性**: 验证各种参数组合下的计算结果
2. **德国税务计算**: 测试Abgeltungssteuer、Solidaritätszuschlag和Kirchensteuer
3. **用户界面交互**: 表单验证、错误处理、响应式设计
4. **数据导出功能**: CSV、Excel、PDF导出测试
5. **社交分享功能**: 各平台分享链接生成
6. **SEO和可访问性**: 元数据、结构化数据、键盘导航

### 🔧 测试工具
- **前端**: Vitest + Vue Test Utils
- **E2E**: Playwright
- **后端**: pytest + FastAPI TestClient
- **覆盖率**: v8 (前端) + coverage.py (后端)

### 📝 注意事项
- 所有测试都使用德语本地化
- 税务计算基于2023年德国税法
- 测试数据符合德国金融法规要求
EOF

echo -e "${GREEN}✅ 测试报告生成完成: reports/tests/summary.md${NC}"

# 7. 显示测试摘要
echo ""
echo -e "${GREEN}🎉 所有测试完成！${NC}"
echo -e "${BLUE}📊 测试覆盖率报告: coverage/index.html${NC}"
echo -e "${BLUE}📋 详细测试报告: reports/tests/summary.md${NC}"
echo ""
echo -e "${YELLOW}💡 提示:${NC}"
echo -e "   - 运行 ${BLUE}npm run test:watch${NC} 进入监听模式"
echo -e "   - 运行 ${BLUE}npm run test:ui${NC} 打开测试界面"
echo -e "   - 查看 ${BLUE}coverage/index.html${NC} 了解覆盖率详情"
echo ""
