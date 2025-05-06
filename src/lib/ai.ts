import type { Issue, PullRequest, Release } from "./github";
import { removeChecklist, removeComment } from "./util";

export type Config = {
  model: string;
  token: string;
};

type SummarizeReleaseParams = {
  owner: string;
  repo: string;
  release: Release;
};

type SummarizePullRequestParams = {
  owner: string;
  repo: string;
  pullRequest: PullRequest;
};

type SummarizeIssueParams = {
  owner: string;
  repo: string;
  issue: Issue;
};

type GenerateTextParams = {
  prompt: string;
  systemPrompt: string;
  maxTokens: number;
};

export class AI {
  private readonly _config: Config;

  constructor(config: Config) {
    this._config = config;
  }

  async summarizeRelease(params: SummarizeReleaseParams): Promise<string> {
    const summary = await this._generateText({
      prompt: JSON.stringify({
        name: params.release.name,
        body: _cleanMarkdown(params.release.body),
      }),
      systemPrompt: `
あなたは ${params.owner}/${params.repo} リポジトリのリリースノートの内容を要約するアシスタントです。
以下の条件に基づいて、ユーザーから提供されたリリースノートの内容を日本語で簡潔に要約してください。

- 要約のフォーマットはプレーンテキストを使用してください。
- 要約は 200 文字程度に収めてください。
- 文体は「ですます調」を使用してください。
`.trim(),

      maxTokens: 4000,
    });

    return summary.trim();
  }

  async summarizePullRequest(
    params: SummarizePullRequestParams,
  ): Promise<string> {
    const summary = await this._generateText({
      prompt: JSON.stringify({
        title: params.pullRequest.title,
        body: _cleanMarkdown(params.pullRequest.body),
      }),
      systemPrompt: `
あなたは ${params.owner}/${params.repo} リポジトリの Pull Request の内容を要約するアシスタントです。
以下の条件に基づいて、ユーザーから提供された Pull Request の内容を日本語で簡潔に要約してください。

- 要約のフォーマットはプレーンテキストを使用してください。
- 要約は 200 文字程度に収めてください。
- 文体は「ですます調」を使用してください。
`.trim(),
      maxTokens: 4000,
    });

    return summary;
  }

  async summarizeIssue(params: SummarizeIssueParams): Promise<string> {
    const summary = await this._generateText({
      prompt: JSON.stringify({
        title: params.issue.title,
        body: _cleanMarkdown(params.issue.body),
      }),
      systemPrompt: `
あなたは ${params.owner}/${params.repo} リポジトリの Issue の内容を要約するアシスタントです。
以下の条件に基づいて、ユーザーから提供された Issue の内容を日本語で簡潔に要約してください。

- 要約のフォーマットはプレーンテキストを使用してください。
- 要約は 200 文字程度に収めてください。
- 文体は「ですます調」を使用してください。
`.trim(),
      maxTokens: 4000,
    });

    return summary;
  }

  private async _generateText(params: GenerateTextParams): Promise<string> {
    const endpoint = "https://models.github.ai/inference/chat/completions";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this._config.token}`,
      },
      body: JSON.stringify({
        model: this._config.model,
        max_tokens: params.maxTokens,
        messages: [
          { role: "system", content: params.systemPrompt },
          { role: "user", content: params.prompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
}

function _cleanMarkdown(markdown: string): string {
  return removeComment(removeChecklist(markdown));
}
