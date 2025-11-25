#!/usr/bin/env node

const { program } = require('commander');
const { exportIssues } = require('./exporter');
const { formatOutput } = require('./formatter');
const fs = require('fs');
const path = require('path');

program
  .name('gh-export')
  .description('Export GitHub Issues to analyzable formats')
  .version('1.0.0');

program
  .command('export')
  .description('Export issues from a repository')
  .option('-r, --repo <repo>', 'Repository in owner/repo format (uses current repo if not specified)')
  .option('-s, --state <state>', 'Filter by state: open, closed, all', 'all')
  .option('-l, --labels <labels>', 'Filter by labels (comma-separated)')
  .option('-m, --milestone <milestone>', 'Filter by milestone')
  .option('-a, --assignee <assignee>', 'Filter by assignee')
  .option('-f, --format <format>', 'Output format: json, markdown, text', 'markdown')
  .option('-o, --output <file>', 'Output file (prints to stdout if not specified)')
  .option('--limit <number>', 'Maximum number of issues to fetch', '500')
  .option('--titles-only', 'Export only titles without body', false)
  .option('--include-comments', 'Include issue comments', false)
  .action(async (options) => {
    try {
      const issues = await exportIssues(options);
      const output = formatOutput(issues, options.format, options);

      if (options.output) {
        const outputPath = path.resolve(options.output);
        fs.writeFileSync(outputPath, output);
        console.error(`Exported ${issues.length} issues to ${outputPath}`);
      } else {
        console.log(output);
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('stats')
  .description('Show statistics for repository issues')
  .option('-r, --repo <repo>', 'Repository in owner/repo format')
  .option('-l, --labels <labels>', 'Filter by labels (comma-separated)')
  .option('-m, --milestone <milestone>', 'Filter by milestone')
  .action(async (options) => {
    try {
      const issues = await exportIssues({ ...options, state: 'all', limit: '1000' });

      const stats = {
        total: issues.length,
        open: issues.filter(i => i.state === 'OPEN').length,
        closed: issues.filter(i => i.state === 'CLOSED').length,
        byLabel: {},
        byAssignee: {},
        byMilestone: {}
      };

      issues.forEach(issue => {
        // Count by labels
        issue.labels.forEach(label => {
          stats.byLabel[label] = (stats.byLabel[label] || 0) + 1;
        });

        // Count by assignee
        issue.assignees.forEach(assignee => {
          stats.byAssignee[assignee] = (stats.byAssignee[assignee] || 0) + 1;
        });

        // Count by milestone
        const milestone = issue.milestone || 'No milestone';
        stats.byMilestone[milestone] = (stats.byMilestone[milestone] || 0) + 1;
      });

      console.log('\n=== GitHub Issues Statistics ===\n');
      console.log(`Total: ${stats.total}`);
      console.log(`Open: ${stats.open}`);
      console.log(`Closed: ${stats.closed}`);

      if (Object.keys(stats.byLabel).length > 0) {
        console.log('\nBy Label:');
        Object.entries(stats.byLabel)
          .sort((a, b) => b[1] - a[1])
          .forEach(([label, count]) => {
            console.log(`  ${label}: ${count}`);
          });
      }

      if (Object.keys(stats.byMilestone).length > 0) {
        console.log('\nBy Milestone:');
        Object.entries(stats.byMilestone)
          .sort((a, b) => b[1] - a[1])
          .forEach(([milestone, count]) => {
            console.log(`  ${milestone}: ${count}`);
          });
      }

      if (Object.keys(stats.byAssignee).length > 0) {
        console.log('\nBy Assignee:');
        Object.entries(stats.byAssignee)
          .sort((a, b) => b[1] - a[1])
          .forEach(([assignee, count]) => {
            console.log(`  ${assignee}: ${count}`);
          });
      }

      console.log('');
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('Quick list of issues (compact format)')
  .option('-r, --repo <repo>', 'Repository in owner/repo format')
  .option('-s, --state <state>', 'Filter by state: open, closed, all', 'open')
  .option('-l, --labels <labels>', 'Filter by labels (comma-separated)')
  .option('-m, --milestone <milestone>', 'Filter by milestone')
  .option('--limit <number>', 'Maximum number of issues', '50')
  .action(async (options) => {
    try {
      const issues = await exportIssues(options);

      issues.forEach(issue => {
        const labels = issue.labels.length > 0 ? ` [${issue.labels.join(', ')}]` : '';
        const state = issue.state === 'OPEN' ? 'O' : 'C';
        console.log(`#${issue.number} (${state}) ${issue.title}${labels}`);
      });

      console.error(`\nTotal: ${issues.length} issues`);
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

// Issue management commands
program
  .command('close <numbers...>')
  .description('Close one or more issues')
  .option('-r, --repo <repo>', 'Repository in owner/repo format')
  .option('-c, --comment <comment>', 'Add a comment when closing')
  .option('--reason <reason>', 'Reason: completed, not_planned', 'completed')
  .action(async (numbers, options) => {
    const { execSync } = require('child_process');
    try {
      for (const num of numbers) {
        const args = ['gh', 'issue', 'close', num];
        if (options.repo) args.push('-R', options.repo);
        if (options.comment) args.push('--comment', `"${options.comment}"`);
        if (options.reason === 'not_planned') args.push('--reason', '"not planned"');

        execSync(args.join(' '), { stdio: 'inherit' });
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('reopen <numbers...>')
  .description('Reopen one or more issues')
  .option('-r, --repo <repo>', 'Repository in owner/repo format')
  .action(async (numbers, options) => {
    const { execSync } = require('child_process');
    try {
      for (const num of numbers) {
        const args = ['gh', 'issue', 'reopen', num];
        if (options.repo) args.push('-R', options.repo);

        execSync(args.join(' '), { stdio: 'inherit' });
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('assign <number> [assignees...]')
  .description('Assign issue to users (use @me for yourself)')
  .option('-r, --repo <repo>', 'Repository in owner/repo format')
  .option('--remove', 'Remove assignees instead of adding')
  .action(async (number, assignees, options) => {
    const { execSync } = require('child_process');
    try {
      const args = ['gh', 'issue', 'edit', number];
      if (options.repo) args.push('-R', options.repo);

      const flag = options.remove ? '--remove-assignee' : '--add-assignee';
      assignees.forEach(a => args.push(flag, a));

      execSync(args.join(' '), { stdio: 'inherit' });
      console.log(`✓ Issue #${number} ${options.remove ? 'unassigned' : 'assigned'}`);
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('label <number>')
  .description('Add or remove labels from issue')
  .option('-r, --repo <repo>', 'Repository in owner/repo format')
  .option('-a, --add <labels>', 'Labels to add (comma-separated)')
  .option('-d, --remove <labels>', 'Labels to remove (comma-separated)')
  .action(async (number, options) => {
    const { execSync } = require('child_process');
    try {
      const args = ['gh', 'issue', 'edit', number];
      if (options.repo) args.push('-R', options.repo);

      if (options.add) {
        options.add.split(',').forEach(l => args.push('--add-label', l.trim()));
      }
      if (options.remove) {
        options.remove.split(',').forEach(l => args.push('--remove-label', l.trim()));
      }

      execSync(args.join(' '), { stdio: 'inherit' });
      console.log(`✓ Issue #${number} labels updated`);
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('view <number>')
  .description('View issue details')
  .option('-r, --repo <repo>', 'Repository in owner/repo format')
  .option('-w, --web', 'Open in browser')
  .action(async (number, options) => {
    const { execSync } = require('child_process');
    try {
      const args = ['gh', 'issue', 'view', number];
      if (options.repo) args.push('-R', options.repo);
      if (options.web) args.push('--web');

      execSync(args.join(' '), { stdio: 'inherit' });
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('comment <number> <message>')
  .description('Add comment to issue')
  .option('-r, --repo <repo>', 'Repository in owner/repo format')
  .action(async (number, message, options) => {
    const { execSync } = require('child_process');
    try {
      const args = ['gh', 'issue', 'comment', number, '--body', `"${message}"`];
      if (options.repo) args.push('-R', options.repo);

      execSync(args.join(' '), { stdio: 'inherit' });
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('status <number> <status>')
  .description('Change issue status on project board (todo, in_progress, done)')
  .option('-r, --repo <repo>', 'Repository in owner/repo format')
  .action(async (number, status, options) => {
    const { execSync } = require('child_process');
    try {
      // Map friendly names to actual values
      const statusMap = {
        'todo': 'Todo',
        'in_progress': 'In Progress',
        'in-progress': 'In Progress',
        'progress': 'In Progress',
        'done': 'Done',
        'closed': 'Done'
      };

      const actualStatus = statusMap[status.toLowerCase()] || status;

      // Get repo owner and name
      const repoFlag = options.repo ? `-R ${options.repo}` : '';
      let owner, repo;

      if (options.repo) {
        [owner, repo] = options.repo.split('/');
      } else {
        const repoInfo = execSync('gh repo view --json owner,name', { encoding: 'utf-8' });
        const repoData = JSON.parse(repoInfo);
        owner = repoData.owner.login;
        repo = repoData.name;
      }

      // Get issue node ID and project items via GraphQL
      const issueQuery = execSync(
        `gh api graphql -f query='
          query {
            repository(owner: "${owner}", name: "${repo}") {
              issue(number: ${number}) {
                id
                projectItems(first: 10) {
                  nodes {
                    id
                    project {
                      id
                    }
                  }
                }
              }
            }
          }
        '`,
        { encoding: 'utf-8' }
      );

      const issueData = JSON.parse(issueQuery);
      const projectItems = issueData.data.repository.issue.projectItems.nodes;

      if (!projectItems || projectItems.length === 0) {
        console.error(`Error: Issue #${number} is not on any project board`);
        process.exit(1);
      }

      const projectItem = projectItems[0];
      const projectId = projectItem.project.id;
      const itemId = projectItem.id;

      // Get the Status field ID for this project
      const projectData = execSync(
        `gh api graphql -f query='
          query {
            node(id: "${projectId}") {
              ... on ProjectV2 {
                field(name: "Status") {
                  ... on ProjectV2SingleSelectField {
                    id
                    options {
                      id
                      name
                    }
                  }
                }
              }
            }
          }
        '`,
        { encoding: 'utf-8' }
      );

      const fieldData = JSON.parse(projectData);
      const statusField = fieldData.data.node.field;
      const fieldId = statusField.id;
      const option = statusField.options.find(o => o.name === actualStatus);

      if (!option) {
        const available = statusField.options.map(o => o.name).join(', ');
        console.error(`Error: Status "${actualStatus}" not found. Available: ${available}`);
        process.exit(1);
      }

      // Update the status
      execSync(
        `gh api graphql -f query='
          mutation {
            updateProjectV2ItemFieldValue(
              input: {
                projectId: "${projectId}"
                itemId: "${itemId}"
                fieldId: "${fieldId}"
                value: { singleSelectOptionId: "${option.id}" }
              }
            ) {
              projectV2Item {
                id
              }
            }
          }
        '`,
        { encoding: 'utf-8' }
      );

      console.log(`✓ Issue #${number} moved to "${actualStatus}"`);
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program.parse();
