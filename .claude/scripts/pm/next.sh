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

# 基于依赖关系和优先级分析 - Task 001已完成
echo "📌 **Task 002: I18nService德语单一化重构**"
echo "   GitHub Issue: #3"
echo "   状态: 开放"
echo "   优先级: 高"
echo "   依赖: Task 001 ✅ 已完成"
echo "   预计工时: 12小时"
echo ""

echo "🔍 为什么选择这个任务："
echo "   ✅ Task 001审计已完成，提供了详细基础"
echo "   ✅ 关键路径上的核心重构任务"
echo "   ✅ 第1周计划的重要任务"
echo "   ✅ 为后续任务奠定技术基础"
echo ""

echo "📊 任务概览："
echo "   • 基于审计结果重构I18nService"
echo "   • 从831行简化到180行（-78%）"
echo "   • 保持德语翻译功能完整"
echo "   • 移除多语言切换和动态加载"
echo "   • 优化性能和内存使用"
echo ""

echo "🎯 预期成果："
echo "   • 简化的德语单一服务（180行）"
echo "   • 性能提升40%"
echo "   • 内存使用减少60%"
echo "   • 保持完整接口兼容性"
echo ""

echo "🚀 开始执行："
echo "   /pm:issue-start 3"
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

echo "⏳ 等待依赖的任务："
echo "   Task 004: 语言切换组件移除 (依赖: Task 002)"
echo "   Task 005: 冗余代码清理 (依赖: Task 002, 004)"
echo "   Task 006-010: 后续优化任务"
echo ""

echo "💡 建议："
echo "   Task 002是当前最佳选择，基于Task 001的审计结果"
echo "   完成后可以并行进行Task 003和Task 004"

exit 0
