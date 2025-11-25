const { execSync } = require('child_process');

/**
 * Export issues from GitHub repository using gh CLI
 */
async function exportIssues(options) {
  const args = ['gh', 'issue', 'list'];

  // Repository
  if (options.repo) {
    args.push('-R', options.repo);
  }

  // State filter
  if (options.state) {
    args.push('--state', options.state);
  }

  // Labels filter
  if (options.labels) {
    options.labels.split(',').forEach(label => {
      args.push('--label', label.trim());
    });
  }

  // Milestone filter
  if (options.milestone) {
    args.push('--milestone', options.milestone);
  }

  // Assignee filter
  if (options.assignee) {
    args.push('--assignee', options.assignee);
  }

  // Limit
  args.push('--limit', options.limit || '500');

  // JSON output for parsing (include projectItems for board status)
  args.push('--json', 'number,title,state,labels,assignees,milestone,createdAt,updatedAt,url,body,comments,projectItems');

  try {
    const result = execSync(args.join(' '), {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024 // 50MB buffer for large exports
    });

    const issues = JSON.parse(result);

    // Transform to simplified format
    return issues.map(issue => {
      // Extract project board status from first project item
      let projectStatus = null;
      if (issue.projectItems && issue.projectItems.length > 0) {
        const firstProject = issue.projectItems[0];
        if (firstProject.status) {
          projectStatus = firstProject.status.name;
        }
      }

      return {
        number: issue.number,
        title: issue.title,
        state: issue.state,
        labels: issue.labels.map(l => l.name),
        assignees: issue.assignees.map(a => a.login),
        milestone: issue.milestone?.title || null,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
        url: issue.url,
        body: issue.body || '',
        commentCount: issue.comments?.length || 0,
        comments: issue.comments || [],
        projectStatus: projectStatus // Board status: Todo, In Progress, Done
      };
    });
  } catch (error) {
    if (error.message.includes('gh: command not found')) {
      throw new Error('GitHub CLI (gh) is not installed. Install it from https://cli.github.com/');
    }
    if (error.message.includes('not logged in')) {
      throw new Error('Not logged in to GitHub. Run: gh auth login');
    }
    throw error;
  }
}

module.exports = { exportIssues };
