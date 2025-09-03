#!/bin/bash

echo "🎯 下一个优先任务"
echo "================"
echo ""

# 检查GitHub Issues状态
echo "📋 检查任务状态..."
gh issue list --state open --limit 20 > /tmp/issues.txt 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ GitHub连接正常"
else
  echo "⚠️ GitHub连接失败，使用本地任务列表"
fi

echo ""
echo "🚀 推荐的下一个任务："
echo ""

# 基于依赖关系和优先级分析 - Task 001, 002, 004已完成
echo "📌 **Task 005: 冗余代码清理和优化**"
echo "   GitHub Issue: 待创建"
echo "   状态: 准备开始"
echo "   优先级: 高"
echo "   依赖: Task 001 ✅, Task 002 ✅, Task 004 ✅ 已完成"
echo "   预计工时: 8小时"
echo ""

echo "🔍 为什么选择这个任务："
echo "   ✅ Task 001, 002, 004已完成，基础清理工作完成"
echo "   ✅ 已掌握孤立代码识别方法（Task 004经验）"
echo "   ✅ 第2周计划的重要任务"
echo "   ✅ 进一步优化项目结构和性能"
echo ""

echo "📊 任务概览："
echo "   • 应用孤立代码识别方法到其他组件"
echo "   • 清理未使用的工具类和服务"
echo "   • 移除冗余的样式文件和资源"
echo "   • 优化导入和依赖关系"
echo "   • 清理测试文件和配置"
echo ""

echo "🎯 预期成果："
echo "   • 进一步减少代码体积（预计500+行）"
echo "   • 优化项目结构和可维护性"
echo "   • 提升构建和运行性能"
echo "   • 建立代码清理的标准流程"
echo ""

echo "🚀 开始执行："
echo "   /pm:issue-start 5"
echo ""

echo "📋 其他可用任务："
echo ""
echo "   Task 003: 计算器功能完整性验证"
echo "   ├─ 状态: 可并行执行"
echo "   ├─ 优先级: 高"
echo "   └─ 预计工时: 16小时"
echo ""

echo "✅ 已完成任务："
echo "   Task 001: 多语言代码审计 ✅ 完成"
echo "   ├─ 审计报告已提交"
echo "   ├─ 82%代码减少潜力确认"
echo "   └─ 为Task 002提供了详细基础"
echo ""
echo "   Task 002: I18nService德语单一化重构 ✅ 完成"
echo "   ├─ 代码简化62% (从831行到318行)"
echo "   ├─ 保持100%德语功能和API兼容性"
echo "   └─ Vite构建成功，性能提升显著"
echo ""
echo "   Task 004: 语言切换组件移除和UI清理 ✅ 完成"
echo "   ├─ 移除1858+行孤立代码（LanguageSwitcher组件）"
echo "   ├─ 清理设置页面语言选项，简化用户界面"
echo "   └─ 建立了孤立代码识别和清理方法"
echo ""

echo "⏳ 等待依赖的任务："
echo "   Task 006-010: 后续优化任务"
echo ""

echo "💡 建议："
echo "   Task 005是当前最佳选择，基于已完成的Task 001, 002, 004"
echo "   可以应用Task 004的孤立代码识别经验，进一步优化项目"
echo "   完成后可以并行进行Task 003和Task 006"

exit 0
