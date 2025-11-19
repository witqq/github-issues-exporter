# GitHub Issues Exporter

CLI utility for exporting GitHub Issues to analyzable formats.

## Installation

```bash
npm install
npm link
```

## Usage

### Export Issues

```bash
# Export all issues from current repo to markdown
gh-export export

# Export to specific file
gh-export export -o issues.md

# Export as JSON
gh-export export -f json -o issues.json

# Filter by state
gh-export export -s open
gh-export export -s closed

# Filter by labels
gh-export export -l "pre-alpha,bug"

# Filter by milestone
gh-export export -m "v1.0"

# Include full descriptions
gh-export export --include-body

# Export from specific repo
gh-export export -r anthropics/claude-code
```

### Quick List

```bash
# List open issues (compact)
gh-export list

# List all issues
gh-export list -s all

# List by label
gh-export list -l "pre-alpha"
```

### Statistics

```bash
# Show stats for current repo
gh-export stats

# Stats for specific repo
gh-export stats -r owner/repo

# Stats filtered by label
gh-export stats -l "pre-alpha"
```

## Output Formats

- **markdown** (default): Structured markdown document
- **json**: Machine-readable JSON
- **text**: Plain text for terminal viewing

## Requirements

- Node.js 18+
- GitHub CLI (`gh`) installed and authenticated
