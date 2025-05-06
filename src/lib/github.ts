import { getOctokit } from "@actions/github";

export type Release = {
  name: string;
  tagName: string;
  body: string;
  publishedAt: Date;
};

export type PullRequest = {
  number: number;
  title: string;
  body: string;
  createdAt: Date;
  labels: Label[];
};

export type Issue = {
  number: number;
  title: string;
  body: string;
  createdAt: Date;
  labels: Label[];
};

export type Label = {
  name: string;
  color: string;
};

export type GetRecentReleasesParams = {
  owner: string;
  repo: string;
  since: Date;
  limit: number;
};

export type GetRecentMergedPullRequestsParams = {
  owner: string;
  repo: string;
  since: Date;
  limit: number;
};

export type GetRecentIssuesParams = {
  owner: string;
  repo: string;
  since: Date;
  limit: number;
};

export class GitHub {
  private readonly octokit: ReturnType<typeof getOctokit>;

  constructor(token: string) {
    this.octokit = getOctokit(token);
  }

  async getRecentReleases({
    owner,
    repo,
    since,
    limit,
  }: GetRecentReleasesParams): Promise<Release[]> {
    const releases: Release[] = [];

    let page = 1;
    while (true) {
      // Fetch releases
      const response = await this.octokit.rest.repos.listReleases({
        owner,
        repo,
        page,
        per_page: 100,
      });

      // Filter out releases where `published_at` is before `since`
      const filtered = response.data.filter((release) => {
        if (!release.published_at) return false;
        if (new Date(release.published_at) < since) return false;
        return true;
      });
      if (filtered.length === 0) break;

      // Push filtered releases
      releases.push(
        ...filtered.map((r) => ({
          name: r.name ?? "",
          tagName: r.tag_name,
          body: r.body ?? "",
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          publishedAt: new Date(r.published_at!),
        })),
      );
      if (releases.length >= limit) break;

      // Increment page
      page++;
    }

    return releases.slice(0, limit);
  }

  async getRecentMergedPullRequests({
    owner,
    repo,
    since,
    limit,
  }: GetRecentMergedPullRequestsParams): Promise<PullRequest[]> {
    const pullRequests: PullRequest[] = [];

    let page = 1;
    while (true) {
      // Fetch pull requests
      const response = await this.octokit.rest.search.issuesAndPullRequests({
        q: `repo:${owner}/${repo} created:>${since.toISOString()} is:pr is:merged`,
        page,
        per_page: 100,
      });
      if (response.data.items.length === 0) break;

      // Push filtered pull requests
      pullRequests.push(
        ...response.data.items.map((p) => ({
          number: p.number,
          title: p.title,
          body: p.body ?? "",
          createdAt: new Date(p.created_at),
          labels: p.labels.map((label): Label => {
            if (typeof label === "string") {
              return { name: label, color: "" };
            }
            return { name: label.name ?? "", color: label.color ?? "" };
          }),
        })),
      );
      if (pullRequests.length >= limit) break;

      // Increment page
      page++;
    }

    return pullRequests.slice(0, limit);
  }

  async getRecentIssues({
    owner,
    repo,
    since,
    limit,
  }: GetRecentIssuesParams): Promise<Issue[]> {
    const issues: Issue[] = [];

    let page = 1;
    while (true) {
      // Fetch issues
      const response = await this.octokit.rest.search.issuesAndPullRequests({
        q: `repo:${owner}/${repo} created:>${since.toISOString()} is:issue sort:reactions-+1-desc`,
        page,
        per_page: 100,
      });
      if (response.data.items.length === 0) break;

      issues.push(
        ...response.data.items.map((issue) => ({
          number: issue.number,
          title: issue.title,
          body: issue.body ?? "",
          createdAt: new Date(issue.created_at),
          labels: issue.labels.map((label): Label => {
            if (typeof label === "string") {
              return { name: label, color: "" };
            }
            return { name: label.name ?? "", color: label.color ?? "" };
          }),
        })),
      );
      if (issues.length >= limit) break;

      // Increment page
      page++;
    }

    return issues.slice(0, limit);
  }
}
