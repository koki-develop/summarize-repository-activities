import * as core from "@actions/core";
import { AI, type Locale } from "./lib/ai";
import { GitHub, type Label } from "./lib/github";
import { exponentialBackoff, yyyymmdd } from "./lib/util";

export type Inputs = {
  githubToken: string;
  locale: Locale;
  daysAgo: number;
  aiModel: string;
  aiApiKey: string;
  aiApiEndpoint: string;
  repository: string;
  releasesLimit: number;
  pullRequestsLimit: number;
  issuesLimit: number;
};

export type Outputs = {
  summary: string;
  hasNewRelease: boolean;
  hasNewPullRequest: boolean;
  hasNewIssue: boolean;
};

export const action = async (inputs: Inputs): Promise<Outputs> => {
  const ai = new AI({
    model: inputs.aiModel,
    token: inputs.aiApiKey,
    endpoint: inputs.aiApiEndpoint,
    locale: inputs.locale,
  });
  const github = new GitHub(inputs.githubToken);

  const owner_repo = inputs.repository.split("/");
  if (owner_repo.length !== 2) {
    throw new Error("repository must be in the format of owner/repo");
  }
  const [owner, repo] = owner_repo;

  const since = new Date();
  since.setDate(since.getUTCDate() - inputs.daysAgo);
  since.setUTCHours(0, 0, 0, 0);

  const releases = await core.group("Fetching recent releases...", async () => {
    const releases = await github.getRecentReleases({
      owner,
      repo,
      since,
      limit: inputs.releasesLimit,
    });
    core.info(`Found ${releases.length} releases`);
    core.debug(JSON.stringify(releases, null, 2));

    return releases;
  });

  const pullRequests = await core.group(
    "Fetching recent merged pull requests...",
    async () => {
      const pullRequests = await github.getRecentMergedPullRequests({
        owner,
        repo,
        since,
        limit: inputs.pullRequestsLimit,
      });
      core.info(`Found ${pullRequests.length} pull requests`);
      core.debug(JSON.stringify(pullRequests, null, 2));

      return pullRequests;
    },
  );

  const issues = await core.group("Fetching recent issues...", async () => {
    const issues = await github.getRecentIssues({
      owner,
      repo,
      since,
      limit: inputs.issuesLimit,
    });
    core.info(`Found ${issues.length} issues`);
    core.debug(JSON.stringify(issues, null, 2));

    return issues;
  });

  const summaries: string[] = [];

  // Releases
  core.info("Summarizing releases...");
  summaries.push("## Releases", "");
  if (releases.length === 0) {
    summaries.push("No releases found");
  } else {
    summaries.push("| Title | Summary |", "| --- | --- |");
    for (const release of releases) {
      await core.group(release.name, async () => {
        const summary = await exponentialBackoff(
          { maxRetries: 5, initialDelay: 2000 },
          () => ai.summarizeRelease({ owner, repo, release }),
        );
        core.info(summary);
        summaries.push(
          `| **[${release.name}](https://github.com/${owner}/${repo}/releases/tag/${release.tagName})** (_${yyyymmdd(release.publishedAt)}_) | ${summary} |`,
        );
      });
    }
  }
  summaries.push("");

  // Pull Requests
  core.info("Summarizing pull requests...");
  summaries.push("## Pull Requests", "");
  if (pullRequests.length === 0) {
    summaries.push("No pull requests found");
  } else {
    summaries.push("| Title | Labels | Summary |", "| --- | --- | --- |");
    for (const pullRequest of pullRequests) {
      await core.group(pullRequest.title, async () => {
        const summary = await exponentialBackoff(
          { maxRetries: 5, initialDelay: 2000 },
          () => ai.summarizePullRequest({ owner, repo, pullRequest }),
        );
        core.info(summary);
        summaries.push(
          `| **[${pullRequest.title}](https://github.com/${owner}/${repo}/pull/${pullRequest.number})** (_${yyyymmdd(pullRequest.createdAt)}_) | ${_labelsToBadges(owner, repo, pullRequest.labels)} | ${summary} |`,
        );
      });
    }
  }
  summaries.push("");

  // Issues
  core.info("Summarizing issues...");
  summaries.push("## Issues", "");
  if (issues.length === 0) {
    summaries.push("No issues found");
  } else {
    summaries.push("| Title | Labels | Summary |", "| --- | --- | --- |");
    for (const issue of issues) {
      await core.group(issue.title, async () => {
        const summary = await exponentialBackoff(
          { maxRetries: 5, initialDelay: 2000 },
          () => ai.summarizeIssue({ owner, repo, issue }),
        );
        core.info(summary);
        summaries.push(
          `| **[${issue.title}](https://github.com/${owner}/${repo}/issues/${issue.number})** (_${yyyymmdd(issue.createdAt)}_) | ${_labelsToBadges(owner, repo, issue.labels)} | ${summary} |`,
        );
      });
    }
  }
  summaries.push("");

  return {
    summary: summaries.join("\n"),
    hasNewRelease: releases.length > 0,
    hasNewPullRequest: pullRequests.length > 0,
    hasNewIssue: issues.length > 0,
  };
};

function _labelsToBadges(owner: string, repo: string, labels: Label[]): string {
  return labels
    .map(
      (label) =>
        `[![${label.name}](https://img.shields.io/badge/-${label.name.replaceAll(" ", "_").replaceAll("-", "--").replaceAll("_", "__")}-${label.color})](https://github.com/${owner}/${repo}/labels/${label.name})`,
    )
    .join(" ");
}
