# Summarize Repository Activities

[![GitHub Release](https://img.shields.io/github/v/release/koki-develop/summarize-repository-activities)](https://github.com/koki-develop/summarize-repository-activities/releases/latest)
[![CI](https://img.shields.io/github/actions/workflow/status/koki-develop/summarize-repository-activities/ci.yml?branch=main&logo=github&style=flat&label=ci)](https://github.com/koki-develop/summarize-repository-activities/actions/workflows/ci.yml)
[![Build](https://img.shields.io/github/actions/workflow/status/koki-develop/summarize-repository-activities/build.yml?branch=main&logo=github&style=flat&label=build)](https://github.com/koki-develop/summarize-repository-activities/actions/workflows/build.yml)

Summarize recent releases, pull requests, and issues of a repository.

## Usage

```yaml
- uses: koki-develop/summarize-repository-activities@v0
  id: summarize
  with:
    github-token: ${{ github.token }}
    # Target activities from the specified number of days ago.
    # (default: 7)
    days-ago: 7
    # The Model to use for summarization.
    # (default: openai/gpt-4o-mini)
    ai-model: openai/gpt-4o-mini
    # The repository to summarize.
    repository: hashicorp/terraform

- run: echo "$SUMMARY"
  env:
    SUMMARY: ${{ steps.summarize.outputs.summary }}
```

Summarize Repository Activities uses GitHub Models by default, so the following permissions are required.

```yaml
permissions:
  contents: read
  models: read # to use GitHub Models
```

### Using any compatible API for summarization

Summarize Repository Activities uses the GitHub Models API (`https://models.github.ai/inference/chat/completions`) by default to generate summaries, but you can also use any compatible API if needed.  
To customize the API used, specify `ai-api-endpoint` and `ai-api-key`.

```yaml
# e.g. Use OpenAI API
- uses: koki-develop/summarize-repository-activities@v0
  id: summarize
  with:
    # ...
    ai-api-endpoint: https://api.openai.com/v1/chat/completions
    ai-api-key: ${{ secrets.OPENAI_API_KEY }}
    ai-model: gpt-4o-mini
```

## LICENSE

[MIT](./LICENSE)
