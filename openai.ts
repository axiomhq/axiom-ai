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
  const dataset = opts?.dataset || process.env.AXIOM_DATASET;

  const createCompletion = openai.createCompletion;
  openai.createCompletion = async (request: CreateCompletionRequest, options?: AxiosRequestConfig) => {
    const start = new Date();
    // TODO: Capture exceptions
    const response = await createCompletion.apply(openai, [request, options]);
    const duration = new Date().getTime() - start.getTime();

    if (opts?.excludePromptOrMessages) {
      delete request.prompt;
    }
    const responseData = response.data as any;
    if (opts?.excludeChoices) {
      delete responseData.choices;
    }

    await axiom.ingestEvents(dataset!, { 
      _time: start.toISOString(),
      duration,
      request, 
      response: responseData
    });

    return response;
  }

  const createChatCompletion = openai.createChatCompletion;
  openai.createChatCompletion = async (request: CreateChatCompletionRequest, options?: AxiosRequestConfig) => {
    const start = new Date();
    // TODO: Capture exceptions
    const response = await createChatCompletion.apply(openai, [request, options]);
    const duration = new Date().getTime() - start.getTime();

    const anyRequest = request as any;
    if (opts?.excludePromptOrMessages) {
      delete anyRequest.messages;
    }
    const responseData = response.data as any;
    if (opts?.excludeChoices) {
      delete responseData.choices;
    }

    await axiom.ingestEvents(dataset!, { 
      _time: start.toISOString(),
      duration,
      request: anyRequest, 
      response: responseData
    });

    return response;
  }

  return openai;
}

