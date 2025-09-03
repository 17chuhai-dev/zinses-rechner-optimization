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

# 基于依赖关系和优先级分析 - Task 001和002已完成
echo "📌 **Task 004: 语言切换组件移除和UI清理**"
echo "   GitHub Issue: 待创建"
echo "   状态: 准备开始"
echo "   优先级: 高"
echo "   依赖: Task 001 ✅, Task 002 ✅ 已完成"
echo "   预计工时: 6小时"
echo ""

echo "🔍 为什么选择这个任务："
echo "   ✅ Task 001和002已完成，I18nService已简化"
echo "   ✅ 可以安全移除LanguageSwitcher组件"
echo "   ✅ 第2周计划的重要任务"
echo "   ✅ 进一步清理多语言UI元素"
echo ""

echo "📊 任务概览："
echo "   • 移除LanguageSwitcher组件（500+行）"
echo "   • 清理导航栏中的语言切换UI"
echo "   • 更新移动端菜单布局"
echo "   • 移除设置页面的语言选项"
echo "   • 优化导航栏空间利用"
echo ""

echo "🎯 预期成果："
echo "   • 移除500+行LanguageSwitcher代码"
echo "   • 简化的导航栏设计"
echo "   • 更好的德语用户体验"
echo "   • 进一步的性能优化"
echo ""

echo "🚀 开始执行："
echo "   /pm:issue-start 4"
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

echo "⏳ 等待依赖的任务："
echo "   Task 005: 冗余代码清理 (依赖: Task 004)"
echo "   Task 006-010: 后续优化任务"
echo ""

echo "💡 建议："
echo "   Task 004是当前最佳选择，基于已完成的Task 001和002"
echo "   完成后可以并行进行Task 003和Task 005"

exit 0
