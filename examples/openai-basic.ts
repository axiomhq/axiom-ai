import * as dotenv from 'dotenv';
import { Configuration, OpenAIApi } from "openai";
import { withAxiom } from "axiom-ai/openai";

(async function() {
  dotenv.config()

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const { openai, flush } = withAxiom(new OpenAIApi(configuration));
  process.on("beforeExit", async () => {
    await flush()
    process.exit(0);
  });

  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: "Hello world",
  });
  console.log(completion.data.choices[0].text);
})()
