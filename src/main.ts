import * as core from "@actions/core";
import { action } from "./action";

export const main = async () => {
  try {
    const inputs = {
      githubToken: core.getInput("github-token", {
        required: true,
        trimWhitespace: true,
      }),
      locale: core.getInput("locale", {
        required: true,
        trimWhitespace: true,
      }),
      daysAgo: core.getInput("days-ago", {
        required: true,
        trimWhitespace: true,
      }),
      aiModel: core.getInput("ai-model", {
        required: true,
        trimWhitespace: true,
      }),
      aiApiEndpoint: core.getInput("ai-api-endpoint", {
        required: true,
        trimWhitespace: true,
      }),
      aiApiKey: core.getInput("ai-api-key", {
        required: true,
        trimWhitespace: true,
      }),
      repository: core.getInput("repository", {
        required: true,
        trimWhitespace: true,
      }),
      releasesLimit: core.getInput("releases-limit", {
        required: true,
        trimWhitespace: true,
      }),
      pullRequestsLimit: core.getInput("pull-requests-limit", {
        required: true,
        trimWhitespace: true,
      }),
      issuesLimit: core.getInput("issues-limit", {
        required: true,
        trimWhitespace: true,
      }),
    } as const;

    if (inputs.locale !== "en" && inputs.locale !== "ja") {
      throw new Error(
        `Invalid locale: ${inputs.locale} (valid values: "en", "ja")`,
      );
    }

    const outputs = await action({
      ...inputs,
      locale: inputs.locale,
      githubToken: inputs.githubToken,
      daysAgo: Number(inputs.daysAgo) || 7,
      releasesLimit: Number(inputs.releasesLimit) || 10,
      pullRequestsLimit: Number(inputs.pullRequestsLimit) || 10,
      issuesLimit: Number(inputs.issuesLimit) || 10,
    });

    core.setOutput("summary", outputs.summary);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      throw error;
    }
  }
};

await main();
