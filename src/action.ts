import { AI } from "./lib/ai";
import { GitHub, type Label } from "./lib/github";
import { yyyymmdd } from "./lib/util";

export type Inputs = {
  model: string;
  token: string;
  repository: string;
};

export type Outputs = {
  summary: string;
};

export const action = async (inputs: Inputs): Promise<Outputs> => {
  const ai = new AI({
    model: inputs.model,
    token: inputs.token,
  });
  const github = new GitHub(inputs.token);

  const owner_repo = inputs.repository.split("/");
  if (owner_repo.length !== 2) {
    throw new Error("repository must be in the format of owner/repo");
  }
  const [owner, repo] = owner_repo;

  const since = new Date();
  since.setDate(since.getUTCDate() - 7);

  const releases = await github.getRecentReleases({
    owner,
    repo,
    since,
  });
  const pullRequests = await github.getRecentMergedPullRequests({
    owner,
    repo,
    since,
  });
  const issues = await github.getRecentIssues({
    owner,
    repo,
    since,
  });

  const summaries: string[] = [];

  // Releases
  summaries.push("# Releases", "");
  for (const release of releases) {
    summaries.push(
      `## [${release.name}](https://github.com/${owner}/${repo}/releases/tag/${release.tagName})`,
      `_Published at ${yyyymmdd(release.publishedAt)}_`,
      "",
    );
    const summary = await ai.summarizeRelease({
      owner,
      repo,
      release,
    });
    summaries.push(summary, "");
  }

  // Pull Requests
  summaries.push("# Pull Requests", "");
  for (const pullRequest of pullRequests) {
    summaries.push(
      `## [${pullRequest.title}](https://github.com/${owner}/${repo}/pull/${pullRequest.number}) ${_labelsToBadges(owner, repo, pullRequest.labels)}`,
      "",
      `_Merged at ${yyyymmdd(pullRequest.mergedAt)}_`,
      "",
    );
    const summary = await ai.summarizePullRequest({
      owner,
      repo,
      pullRequest,
    });
    summaries.push(summary, "");
  }

  // Issues
  summaries.push("# Issues", "");
  for (const issue of issues) {
    summaries.push(
      `## [${issue.title}](https://github.com/${owner}/${repo}/issues/${issue.number}) ${_labelsToBadges(owner, repo, issue.labels)}`,
      "",
      `_Created at ${yyyymmdd(issue.createdAt)}_`,
      "",
    );
    const summary = await ai.summarizeIssue({
      owner,
      repo,
      issue,
    });
    summaries.push(summary, "");
  }

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
