#!/bin/bash

echo "🚀 Initializing CCPM (Local Mode)"
echo "================================="
echo ""

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p .claude/prds
mkdir -p .claude/epics
mkdir -p .claude/rules
mkdir -p .claude/agents
mkdir -p .claude/context
echo "  ✅ Directories created"

# Create CLAUDE.md if it doesn't exist
if [ ! -f "CLAUDE.md" ]; then
  echo ""
  echo "📄 Creating CLAUDE.md..."
  cat > CLAUDE.md << 'EOF'
# CLAUDE.md

> Think carefully and implement the most concise solution that changes as little code as possible.

## Project-Specific Instructions

Add your project-specific instructions here.

## Testing

Always run tests before committing:
- `npm test` or equivalent for your stack

## Code Style

Follow existing patterns in the codebase.
EOF
  echo "  ✅ CLAUDE.md created"
fi

echo ""
echo "✅ Local Initialization Complete!"
echo "================================="
echo ""
echo "📊 Available Commands (Local Mode):"
echo "  /pm:help         - Show help"
echo "  /pm:status       - Show project status"
echo "  /pm:prd-new      - Create new PRD"
echo ""
echo "⚠️  Note: GitHub integration disabled"
echo "   Install GitHub CLI to enable full features"
echo ""

exit 0
