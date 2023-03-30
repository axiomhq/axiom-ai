import { OpenAIApi, CreateCompletionRequest, CreateChatCompletionRequest } from "openai";
import { AxiosRequestConfig } from "axios";
import Client from "@axiomhq/axiom-node";

export interface WithAxiomOptions {
  token: string;
  dataset: string;
  excludePromptOrMessages: boolean;
  excludeChoices: boolean;
}

export default function withAxiom(openai: OpenAIApi, opts?: WithAxiomOptions): OpenAIApi {
  const axiom = new Client({ token: opts?.token });
  const dataset  = opts?.dataset || process.env.AXIOM_DATASET;

  const createCompletion = openai.createCompletion;
  openai.createCompletion = async (request: CreateCompletionRequest, options?: AxiosRequestConfig) => {
    const start = new Date();
    const response = await createCompletion(request);
    const duration = new Date().getTime() - start.getTime();

    if (opts?.excludePromptOrMessages) {
      delete request.prompt;
    }
    // FIXME: Figure out how to get rid of choices
    // if (opts?.excludeChoices) {
    //   delete response.choices;
    // }

    await axiom.ingestEvents(dataset!, { 
      _time: start.toISOString(),
      duration,
      request, 
      response 
    });

    return response;
  }

  const createChatCompletion = openai.createChatCompletion;
  openai.createChatCompletion = async (request: CreateChatCompletionRequest, options?: AxiosRequestConfig) => {
    const start = new Date();
    const response = await createChatCompletion(request);
    const duration = new Date().getTime() - start.getTime();

    const anyRequest = request as any;
    if (opts?.excludePromptOrMessages) {
      delete anyRequest.messages;
    }
    // FIXME: Figure out how to get rid of choices
    // if (opts?.excludeChoices) {
    //   delete response.choices;
    // }

    await axiom.ingestEvents(dataset!, { 
      _time: start.toISOString(),
      duration,
      request: anyRequest, 
      response 
    });

    return response;
  }

  return openai;
}

