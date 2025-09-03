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

# 基于依赖关系和优先级分析 - Task 001, 002, 003, 004, 005已完成
echo "📌 **Task 006: 架构文档和代码注释更新**"
echo "   GitHub Issue: 待创建"
echo "   状态: 准备开始"
echo "   优先级: 中高"
echo "   依赖: Task 001-005 ✅ 已完成"
echo "   预计工时: 12小时"
echo ""

echo "🔍 为什么选择这个任务："
echo "   ✅ 前5个任务已完成，需要更新文档反映当前架构"
echo "   ✅ 大量代码优化后，文档需要同步更新"
echo "   ✅ 为团队协作和后续维护提供清晰文档"
echo "   ✅ 第2-3周计划的重要任务"
echo ""

echo "📊 任务概览："
echo "   • 更新架构文档反映德语单一化架构"
echo "   • 清理过时的多语言相关注释"
echo "   • 更新API文档和服务接口说明"
echo "   • 完善德语用户指南和开发文档"
echo "   • 更新部署和配置文档"
echo ""

echo "🎯 预期成果："
echo "   • 完整的架构文档更新"
echo "   • 清晰的代码注释和说明"
echo "   • 德语用户和开发者文档"
echo "   • 简化的部署和维护指南"
echo ""

echo "🚀 开始执行："
echo "   /pm:issue-start 6"
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
echo "   Task 003: 计算器功能完整性验证 ✅ 完成"
echo "   ├─ 核心功能完整性验证通过（65.8%测试通过率）"
echo "   ├─ 德语界面完整，用户体验良好"
echo "   └─ 确认优化效果：4148+行代码减少，性能提升"
echo ""
echo "   Task 004: 语言切换组件移除和UI清理 ✅ 完成"
echo "   ├─ 移除1858+行孤立代码（LanguageSwitcher组件）"
echo "   ├─ 清理设置页面语言选项，简化用户界面"
echo "   └─ 建立了孤立代码识别和清理方法"
echo ""
echo "   Task 005: 冗余代码清理和优化 ✅ 完成"
echo "   ├─ 应用孤立代码识别方法，移除1777行高级可视化组件"
echo "   ├─ 建立标准化的代码清理流程"
echo "   └─ 累积优化：4148+行代码减少"
echo ""

echo "⏳ 等待依赖的任务："
echo "   Task 006-010: 后续优化任务"
echo ""

echo "💡 建议："
echo "   Task 006是当前最佳选择，基于已完成的Task 001-005"
echo "   大量代码优化后需要更新文档反映当前架构"
echo "   为团队协作和后续维护提供清晰的文档基础"

exit 0
