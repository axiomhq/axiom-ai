# axiom-ai

The official package to send events from AI libraries to Axiom.

## OpenAI

Wrap your `OpenAIApi` in `withAxiom` to automatically send completion and 
chat completion calls to Axiom:

```typescript
import { Configuration, OpenAIApi } from "openai";
import withAxiom from "axiom-ai/openai";

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
