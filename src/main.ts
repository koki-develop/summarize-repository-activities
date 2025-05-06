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
    } as const;

    const outputs = await action(inputs);

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
