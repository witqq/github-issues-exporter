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
  .option('--include-body', 'Include full issue body', false)
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

program.parse();
