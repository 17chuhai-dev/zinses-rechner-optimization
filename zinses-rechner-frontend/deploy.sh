#!/bin/bash

# Zinses Rechner Cloudflare Pages部署脚本
# 使用邮箱和API Key进行自动化部署

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Cloudflare配置
CLOUDFLARE_EMAIL="yigetech@gmail.com"
CLOUDFLARE_API_KEY="d70a07155b7e29ba4c0fe1ac05e976fe6852f"
PROJECT_NAME="zinses-rechner"

echo -e "${BLUE}🚀 开始部署 Zinses Rechner 到 Cloudflare Pages...${NC}\n"

# 检查必要的文件和目录
echo -e "${YELLOW}🔍 检查部署环境...${NC}"

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 错误: package.json 文件不存在${NC}"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 安装依赖...${NC}"
    npm install
fi

# 构建项目
echo -e "${YELLOW}🔨 构建项目...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ 错误: 构建失败，dist目录不存在${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 项目构建成功${NC}"

# 设置环境变量
export CLOUDFLARE_EMAIL="$CLOUDFLARE_EMAIL"
export CLOUDFLARE_API_KEY="$CLOUDFLARE_API_KEY"

# 部署到Cloudflare Pages
echo -e "${YELLOW}⬆️  部署到 Cloudflare Pages...${NC}"

# 使用wrangler部署
npx wrangler pages deploy dist --project-name="$PROJECT_NAME" --compatibility-date="2024-01-15"

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}🎉 部署成功！${NC}"
    echo -e "${GREEN}📊 部署信息:${NC}"
    echo -e "   项目名称: ${PROJECT_NAME}"
    echo -e "   部署时间: $(date)"
    echo -e "   访问地址: https://${PROJECT_NAME}.pages.dev"
    echo -e "   自定义域名: https://zinses-rechner.de"
    echo -e "\n${BLUE}💡 提示: 自定义域名可能需要几分钟才能生效${NC}"
else
    echo -e "\n${RED}❌ 部署失败${NC}"
    exit 1
fi

# 显示项目统计
echo -e "\n${BLUE}📈 项目统计:${NC}"
if [ -d "dist" ]; then
    DIST_SIZE=$(du -sh dist | cut -f1)
    FILE_COUNT=$(find dist -type f | wc -l)
    echo -e "   构建大小: ${DIST_SIZE}"
    echo -e "   文件数量: ${FILE_COUNT}"
fi

echo -e "\n${GREEN}✨ 部署完成！${NC}"
