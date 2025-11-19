# GitHub Issues Exporter

Export and manage GitHub issues.

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

# Close issues
gh-export close 123
gh-export close 123 -c "Done"

# Assign
gh-export assign 123 @me

# Labels
gh-export label 123 -a "bug" -d "enhancement"
```
