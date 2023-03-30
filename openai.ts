import { OpenAIApi, CreateCompletionRequest, CreateChatCompletionRequest } from "openai";
import { AxiosRequestConfig } from "axios";
import Client from "axiom-node";

export interface WithAxiomOptions {
  token: string;
  dataset: string;
  excludePrompt: boolean;
  excludeChoices: boolean;
}

export default function withAxiom(openai: OpenAIApi, opts?: WithAxiomOptions): OpenAIApi {
  const axiom = new Client({ token: opts?.token });

  const createCompletion = openai.createCompletion;
  openai.createCompletion = async (request: CreateCompletionRequest, options?: AxiosRequestConfig) => {
    const start = new Date();
    const response = await createCompletion(request);
    const duration = new Date().getTime() - start.getTime();

    if (opts?.excludePrompt) {
      delete request.prompt;
    }
    if (opts?.excludeChoices) {
      delete response.choices;
    }

    await axiom.ingest({ 
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

    if (opts?.excludePrompt) {
      delete request.prompt;
    }
    if (opts?.excludeChoices) {
      delete response.choices;
    }

    await axiom.ingestEvents(opts?.dataset || process.env.AXIOM_DATASET, { 
      _time: start.toISOString(),
      duration,
      request, 
      response 
    });

    return response;
  }

  return openai;
}

