import { Configuration, OpenAIApi } from "openai";
import withAxiom from "axiom-ai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = withAxiom(new OpenAIApi(configuration));

const completion = await openai.createCompletion({
  model: "text-davinci-003",
  prompt: "Hello world",
});
console.log(completion.data.choices[0].text);

