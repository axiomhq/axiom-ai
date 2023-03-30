import { OpenAIApi, CreateCompletionRequest, CreateChatCompletionRequest, AxiosRequestConfig } from 'openai';
import Client as AxiomClient from 'axiom-node';

export interface WithAxiomOptions {
  token: string;
  dataset: string;
  excludePrompt: boolean = false;
  excludeChoices: boolean = false;
}

export default function withAxiom(openai: OpenAIApi, opts?: WithAxiomOptions): OpenAI {
  const axiom = new AxiomClient({ token: opts.token });

  const createCompletion = openai.createCompletion;
  openai.createCompletion = async (request: CreateCompletionRequest, options?: AxiosRequestConfig) => {
    const start = new Date();
    const response = await createCompletion(params);
    const duration = new Date().getTime() - start.getTime();

    if (opts.excludePrompt) {
      delete request.prompt;
    }
    if (opts.excludeChoices) {
      delete request.choices;
    }

    await axiom.ingest({ 
      _time: start.toISOString(),
      duration,
      request, 
      response 
    });

    return res;
  }

  const createChatCompletion = openai.createChatCompletion;
  openai.createChatCompletion = async (params: CreateChatCompletionRequest, options?: AxiosRequestConfig) => {
    const start = new Date();
    const response = await createChatCompletion(params);
    const duration = new Date().getTime() - start.getTime();

    if (opts.excludePrompt) {
      delete request.prompt;
    }
    if (opts.excludeChoices) {
      delete request.choices;
    }

    await axiom.ingestEvents(opts.dataset, { 
      _time: start.toISOString(),
      duration,
      request, 
      response 
    });

    return res;
  }

  return openai;
}

