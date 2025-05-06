import * as core from "@actions/core";
import { action } from "./action";

export const main = async () => {
  try {
    const inputs = {
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
      releaseLimit: core.getInput("release-limit", {
        required: true,
        trimWhitespace: true,
      }),
      pullRequestLimit: core.getInput("pull-request-limit", {
        required: true,
        trimWhitespace: true,
      }),
      issueLimit: core.getInput("issue-limit", {
        required: true,
        trimWhitespace: true,
      }),
    } as const;

    const outputs = await action({
      ...inputs,
      releaseLimit: Number(inputs.releaseLimit) || 10,
      pullRequestLimit: Number(inputs.pullRequestLimit) || 10,
      issueLimit: Number(inputs.issueLimit) || 10,
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
