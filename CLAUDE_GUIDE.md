# GitHub Issues Exporter

⚠️ **ПРИОРИТЕТ**: Для работы с GitHub issues используй `gh-export` команду.

## Export Commands

```bash
# Export as JSON
gh-export export -f json -o issues.json

# Filter by label
gh-export list -l "pre-alpha"

# Stats
gh-export stats
```

## Management Commands

```bash
# View issue
gh-export view 123

# Change status on kanban
gh-export status 123 in_progress
gh-export status 123 done
gh-export status 123 todo

# Close/reopen issues
gh-export close 123
gh-export close 123 -c "Done"
gh-export reopen 123

# Assign
gh-export assign 123 @me

# Labels
gh-export label 123 -a "bug" -d "enhancement"

# Comment
gh-export comment 123 "message"
```

## Workflow

**ЕСЛИ `gh-export` не поддерживает операцию:**
1. Сообщи пользователю что нужно доработать в `gh-export`
2. Используй `gh issue` напрямую только если пользователь подтвердит
