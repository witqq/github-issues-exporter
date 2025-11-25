/**
 * Format issues for output
 */
function formatOutput(issues, format, options = {}) {
  switch (format) {
    case 'json':
      return formatJson(issues, options);
    case 'markdown':
      return formatMarkdown(issues, options);
    case 'text':
      return formatText(issues, options);
    default:
      return formatMarkdown(issues, options);
  }
}

function formatJson(issues, options) {
  const output = issues.map(issue => {
    const result = {
      number: issue.number,
      title: issue.title,
      state: issue.state,
      labels: issue.labels,
      assignees: issue.assignees,
      milestone: issue.milestone,
      url: issue.url,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt
    };

    // Include project board status if available
    if (issue.projectStatus) {
      result.projectStatus = issue.projectStatus;
    }

    // Include body by default unless --titles-only specified
    if (!options.titlesOnly) {
      result.body = issue.body;
    }

    if (options.includeComments) {
      result.comments = issue.comments;
    }

    return result;
  });

  return JSON.stringify(output, null, 2);
}

function formatMarkdown(issues, options) {
  let output = `# GitHub Issues Export\n\n`;
  output += `**Total issues:** ${issues.length}\n`;
  output += `**Export date:** ${new Date().toISOString()}\n\n`;

  // Group by state
  const openIssues = issues.filter(i => i.state === 'OPEN');
  const closedIssues = issues.filter(i => i.state === 'CLOSED');

  if (openIssues.length > 0) {
    output += `## Open Issues (${openIssues.length})\n\n`;
    output += formatIssueList(openIssues, options);
  }

  if (closedIssues.length > 0) {
    output += `## Closed Issues (${closedIssues.length})\n\n`;
    output += formatIssueList(closedIssues, options);
  }

  return output;
}

function formatIssueList(issues, options) {
  let output = '';

  issues.forEach(issue => {
    const labels = issue.labels.length > 0 ? ` \`${issue.labels.join('` `')}\`` : '';
    const assignees = issue.assignees.length > 0 ? ` @${issue.assignees.join(' @')}` : '';
    const milestone = issue.milestone ? ` [${issue.milestone}]` : '';

    output += `### #${issue.number} ${issue.title}\n\n`;
    output += `**URL:** ${issue.url}\n`;

    if (labels) output += `**Labels:**${labels}\n`;
    if (assignees) output += `**Assignees:**${assignees}\n`;
    if (milestone) output += `**Milestone:**${milestone}\n`;

    output += `**Created:** ${formatDate(issue.createdAt)}\n`;
    output += `**Updated:** ${formatDate(issue.updatedAt)}\n`;

    // Include body by default unless --titles-only specified
    if (!options.titlesOnly && issue.body) {
      output += `\n**Description:**\n\n${issue.body}\n`;
    }

    output += '\n---\n\n';
  });

  return output;
}

function formatText(issues, options) {
  let output = `GitHub Issues Export\n`;
  output += `${'='.repeat(50)}\n`;
  output += `Total: ${issues.length} issues\n`;
  output += `Date: ${new Date().toISOString()}\n\n`;

  issues.forEach(issue => {
    const state = issue.state === 'OPEN' ? '[OPEN]' : '[CLOSED]';
    const labels = issue.labels.length > 0 ? ` [${issue.labels.join(', ')}]` : '';

    output += `#${issue.number} ${state} ${issue.title}${labels}\n`;
    output += `  URL: ${issue.url}\n`;

    if (issue.assignees.length > 0) {
      output += `  Assignees: ${issue.assignees.join(', ')}\n`;
    }

    if (issue.milestone) {
      output += `  Milestone: ${issue.milestone}\n`;
    }

    // Include body by default unless --titles-only specified
    if (!options.titlesOnly && issue.body) {
      const truncatedBody = issue.body.substring(0, 200);
      output += `  Description: ${truncatedBody}${issue.body.length > 200 ? '...' : ''}\n`;
    }

    output += '\n';
  });

  return output;
}

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

module.exports = { formatOutput };
