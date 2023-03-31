![axiom-ai: The official package to send events from AI libraries to Axiom](.github/images/banner-dark.svg#gh-dark-mode-only)
![axiom-ai: The official package to send events from AI libraries to Axiom](.github/images/banner-light.svg#gh-light-mode-only)

[Axiom](https://axiom.co) unlocks observability at any scale.

- **Ingest with ease, store without limits:** Axiom’s next-generation datastore enables ingesting petabytes of data with ultimate efficiency. Ship logs from Kubernetes, AWS, Azure, Google Cloud, DigitalOcean, Nomad, and others.
- **Query everything, all the time:** Whether DevOps, SecOps, or EverythingOps, query all your data no matter its age. No provisioning, no moving data from cold/archive to “hot”, and no worrying about slow queries. All your data, all. the. time.
- **Powerful dashboards, for continuous observability:** Build dashboards to collect related queries and present information that’s quick and easy to digest for you and your team. Dashboards can be kept private or shared with others, and are the perfect way to bring together data from different sources

For more information check out the [official documentation](https://axiom.co/docs)
and our
[community Discord](https://axiom.co/discord).

## Installation

```shell
npm install axiom-ai
```

## OpenAI

Wrap your `OpenAIApi` in `withAxiom` to automatically send completion and 
chat completion calls to Axiom:

```typescript
import { Configuration, OpenAIApi } from "openai";
import { withAxiom } from "axiom-ai/openai";

(async function() {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = withAxiom(new OpenAIApi(configuration), {
    token: process.env.AXIOM_TOKEN,
    dataset: process.env.AXIOM_DATASET,
  });

  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: "Hello world",
  });
  console.log(completion.data.choices[0].text);
})()
```

This is what an event could look like.

```json
{
  "duration": 1037,
  "request": {
    "model": "text-davinci-003",
    "prompt": "Hello world"
  },
  "response": {
    "choices": [
      {
        "text": " world\n\nHello! How are you today?",
        "index": 0,
        "logprobs": null,
        "finish_reason": "stop"
      }
    ],
    "created": "2023-03-30T09:14:07.000Z",
    "id": "cmpl-6zie7fuAZQ8BwdNE5hKnDiEpnY9Bb",
    "model": "text-davinci-003",
    "object": "text_completion",
    "usage": {
      "completion_tokens": 10,
      "prompt_tokens": 2,
      "total_tokens": 12
    }
  },
  "type": "completion"
}
```

If you pass `excludePromptOrMessages: true` and/or `excludeChoices: true` to 
the `withAxiom` options it won't send the prompt/messages or choices, 
respectively.
