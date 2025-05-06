import * as core from "@actions/core";
import { AI } from "./lib/ai";
import { GitHub, type Label } from "./lib/github";
import { sleep, yyyymmdd } from "./lib/util";

export type Inputs = {
  aiModel: string;
  aiApiKey: string;
  aiApiEndpoint: string;
  repository: string;
};

export type Outputs = {
  summary: string;
};

export const action = async (inputs: Inputs): Promise<Outputs> => {
  const ai = new AI({
    model: inputs.aiModel,
    token: inputs.aiApiKey,
    endpoint: inputs.aiApiEndpoint,
  });
  const github = new GitHub(inputs.aiApiKey);

  const owner_repo = inputs.repository.split("/");
  if (owner_repo.length !== 2) {
    throw new Error("repository must be in the format of owner/repo");
  }
  const [owner, repo] = owner_repo;

  const since = new Date();
  since.setDate(since.getUTCDate() - 7);

  const releases = await core.group(
    "Fetching recent activities...",
    async () => {
      const releases = await github.getRecentReleases({
        owner,
        repo,
        since,
      });
      core.info(`Found ${releases.length} releases`);
      core.debug(JSON.stringify(releases, null, 2));

      return releases;
    },
  );

  const pullRequests = await core.group(
    "Fetching recent merged pull requests...",
    async () => {
      const pullRequests = await github.getRecentMergedPullRequests({
        owner,
        repo,
        since,
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
    });
    core.info(`Found ${issues.length} issues`);
    core.debug(JSON.stringify(issues, null, 2));

    return issues;
  });

  const summaries: string[] = [];

  // Releases
  core.info("Summarizing releases...");
  summaries.push("# Releases", "");
  summaries.push("| Title | Published at | Summary |", "| --- | --- | --- |");
  for (const release of releases) {
    await core.group(release.name, async () => {
      await sleep(5000);
      const summary = await ai.summarizeRelease({
        owner,
        repo,
        release,
      });
      core.info(summary);
      summaries.push(
        `| **[${release.name}](https://github.com/${owner}/${repo}/releases/tag/${release.tagName})** | _${yyyymmdd(release.publishedAt)}_ | ${summary} |`,
      );
    });
  }
  summaries.push("");

  // Pull Requests
  core.info("Summarizing pull requests...");
  summaries.push("# Pull Requests", "");
  summaries.push("| Title | Labels | Summary |", "| --- | --- | --- |");
  for (const pullRequest of pullRequests) {
    await core.group(pullRequest.title, async () => {
      await sleep(5000);
      const summary = await ai.summarizePullRequest({
        owner,
        repo,
        pullRequest,
      });
      core.info(summary);
      summaries.push(
        `| **[${pullRequest.title}](https://github.com/${owner}/${repo}/pull/${pullRequest.number})** | ${_labelsToBadges(owner, repo, pullRequest.labels)} | ${summary} |`,
      );
    });
  }
  summaries.push("");

  // Issues
  core.info("Summarizing issues...");
  summaries.push("# Issues", "");
  summaries.push("| Title | Labels | Summary |", "| --- | --- | --- |");
  for (const issue of issues) {
    await core.group(issue.title, async () => {
      await sleep(5000);
      const summary = await ai.summarizeIssue({
        owner,
        repo,
        issue,
      });
      core.info(summary);
      summaries.push(
        `| **[${issue.title}](https://github.com/${owner}/${repo}/issues/${issue.number})** | ${_labelsToBadges(owner, repo, issue.labels)} | ${summary} |`,
      );
    });
  }
  summaries.push("");

  return {
    summary: summaries.join("\n"),
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
