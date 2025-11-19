# GitHub Issues Exporter

Export GitHub issues for analysis.

## Commands

```bash
# Export all issues to markdown
gh-export export -o issues.md

# Export as JSON for processing
gh-export export -f json -o issues.json

# Quick stats
gh-export stats

# Filter by label
gh-export export -l "pre-alpha" -o pre-alpha.md

# Include full descriptions
gh-export export --include-body -o detailed.md
```

## Typical Usage

```bash
# Get all issues from mcp-moira for analysis
gh-export export -r anthropics/mcp-moira -f json -o /tmp/issues.json

# Then read the JSON file for analysis
```
