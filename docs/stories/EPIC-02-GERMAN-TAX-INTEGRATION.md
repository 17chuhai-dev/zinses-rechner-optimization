# Epic 2: 德国税收集成

## 📋 Epic概述

**Epic ID**: EPIC-02  
**标题**: 德国税收集成  
**优先级**: P0 (最高)  
**预估工作量**: 35 Story Points  
**目标Sprint**: Sprint 2-3  

**Epic目标**: 完善德国税法集成，实现Abgeltungssteuer、Freistellungsauftrag、ETF Teilfreistellung等核心税收功能，为德国用户提供准确的税后计算结果。

**商业价值**: 这是产品的核心差异化功能，直接影响德国用户的使用决策和产品竞争力。

## 🎯 用户故事详细规范

### US-006: 税收设置界面优化

**作为** 德国投资者  
**我希望** 有一个简单直观的税收设置界面  
**以便** 我能够轻松配置我的税收情况，获得准确的计算结果  

#### 验收标准
- [ ] 税收设置界面简洁易懂
- [ ] 支持Freistellungsauftrag金额设置
- [ ] 支持教会税开关设置
- [ ] 支持婚姻状况选择 (影响免税额度)
- [ ] 提供税收影响实时预览

#### 技术任务
1. **创建TaxSettings组件**
   ```vue
   // 创建 src/components/calculator/TaxSettings.vue
   // 德国税收设置专用组件
   ```

2. **实现税收配置逻辑**
   ```typescript
   // 创建 src/composables/useTaxSettings.ts
   // 税收设置状态管理
   ```

3. **添加税收帮助信息**
   ```vue
   // 创建 src/components/ui/TaxHelpTooltip.vue
   // 税收概念解释组件
   ```

**工作量估算**: 8 Story Points

---

### US-007: Abgeltungssteuer计算

**作为** 德国投资者  
**我希望** 系统能够准确计算Abgeltungssteuer (25%资本利得税)  
**以便** 我了解投资的实际税后收益  

#### 验收标准
- [ ] 正确计算25%的Abgeltungssteuer
- [ ] 正确计算5.5%的Solidaritätszuschlag
- [ ] 支持教会税计算 (8%)
- [ ] 扣除Freistellungsauftrag免税额度
- [ ] 显示详细的税收明细

#### 技术任务
1. **创建德国税收计算引擎**
   ```typescript
   // 创建 src/utils/germanTaxCalculator.ts
   export class GermanTaxCalculator {
     calculateCapitalGainsTax(
       gains: number,
       freistellungsauftrag: number,
       churchTax: boolean
     ): TaxCalculationResult
   }
   ```

2. **集成税收计算到计算器**
   ```typescript
   // 更新所有计算器的calculate方法
   // 添加税后收益计算
   ```

3. **创建税收结果显示组件**
   ```vue
   // 创建 src/components/calculator/TaxResults.vue
   // 显示税收明细和影响
   ```

**工作量估算**: 13 Story Points

---

### US-008: Freistellungsauftrag管理

**作为** 德国投资者  
**我希望** 能够管理我的Freistellungsauftrag (免税委托)  
**以便** 我能够最大化利用我的免税额度  

#### 验收标准
- [ ] 支持单身1000€和已婚2000€免税额度
- [ ] 显示已使用和剩余免税额度
- [ ] 提供免税额度优化建议
- [ ] 支持多个投资产品的免税额度分配
- [ ] 实时计算免税额度的税收节省

#### 技术任务
1. **创建免税额度管理组件**
   ```vue
   // 创建 src/components/calculator/FreistellungsauftragManager.vue
   // 免税额度分配和管理
   ```

2. **实现免税额度计算逻辑**
   ```typescript
   // 创建 src/utils/freistellungsauftragCalculator.ts
   // 免税额度优化算法
   ```

3. **添加免税额度可视化**
   ```vue
   // 创建 src/components/charts/FreistellungsauftragChart.vue
   // 免税额度使用情况图表
   ```

**工作量估算**: 8 Story Points

---

### US-009: ETF Teilfreistellung

**作为** ETF投资者  
**我希望** 系统能够计算ETF的Teilfreistellung (部分免税)  
**以便** 我了解不同类型ETF的税收优势  

#### 验收标准
- [ ] 支持股票ETF 30%部分免税
- [ ] 支持混合ETF 15%部分免税
- [ ] 支持房地产ETF 60%部分免税
- [ ] 支持债券ETF 0%部分免税
- [ ] 显示部分免税带来的税收节省

#### 技术任务
1. **创建ETF类型选择器**
   ```vue
   // 更新 src/components/calculator/TaxSettings.vue
   // 添加ETF类型选择
   ```

2. **实现Teilfreistellung计算**
   ```typescript
   // 更新 src/utils/germanTaxCalculator.ts
   // 添加ETF部分免税计算
   ```

3. **创建ETF税收对比工具**
   ```vue
   // 创建 src/components/calculator/ETFTaxComparison.vue
   // 不同ETF类型税收对比
   ```

**工作量估算**: 6 Story Points

## 📊 Epic成功指标

### 功能完整性指标
- **税收计算准确率**: 100% (与官方税收计算器对比)
- **税收功能覆盖率**: 覆盖90%的德国个人投资税收场景
- **用户配置完成率**: >80%的用户完成税收设置

### 用户体验指标
- **税收设置易用性**: >4.0/5.0 (用户调研)
- **税收信息理解度**: >85%的用户理解税收影响
- **功能使用率**: >60%的用户使用税收功能

### 技术质量指标
- **计算性能**: 税收计算响应时间 <50ms
- **数据准确性**: 税收计算精度到分 (€0.01)
- **代码覆盖率**: 税收相关代码覆盖率 >90%

## 🔄 Epic交付计划

### Sprint 2 (第3-4周)
- US-006: 税收设置界面优化
- US-007: Abgeltungssteuer计算 (核心功能)

### Sprint 3 (第5-6周)
- US-008: Freistellungsauftrag管理
- US-009: ETF Teilfreistellung

### 验收和测试
- 税收计算准确性验证
- 用户体验测试
- 法规合规性检查
- 性能和安全测试

## 🏛️ 法规合规要求

### BaFin合规
- [ ] 所有税收计算包含免责声明
- [ ] 明确区分计算工具与专业税务咨询
- [ ] 定期更新税率和法规变化
- [ ] 提供计算公式的透明度

### DSGVO合规
- [ ] 税收设置数据本地存储优先
- [ ] 用户可以删除所有税收相关数据
- [ ] 税收计算不收集个人身份信息
- [ ] 提供清晰的数据使用说明

### 技术安全
- [ ] 税收计算在客户端执行
- [ ] 敏感税收数据不传输到服务器
- [ ] 使用HTTPS加密所有通信
- [ ] 定期安全审计和漏洞扫描

这个Epic是产品的核心竞争优势，确保德国用户能够获得准确、合规的税收计算服务。
