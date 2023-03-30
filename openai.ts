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

    const mappedRequest = request as any;
    if (opts?.excludePromptOrMessages) {
      delete mappedRequest.messages;
    }

    let response = null;
    let duration = null;
    try {
      response = await createCompletion.apply(openai, [request, options]);
      duration = new Date().getTime() - start.getTime();
    } catch (e: any) {
      await axiom.ingestEvents(dataset!, {
        _time: start.toISOString(),
        type: "completion",
        duration,
        request: mappedRequest,
        error: e.message,
      })
      throw e;
    }

    if (opts?.excludePromptOrMessages) {
      delete request.prompt;
    }
    const responseData = response.data as any;
    if (opts?.excludeChoices) {
      delete responseData.choices;
    }

    await axiom.ingestEvents(dataset!, { 
      _time: start.toISOString(),
      type: "completion",
      duration,
      request: mappedRequest, 
      response: responseData
    });

    return response;
  }

  const createChatCompletion = openai.createChatCompletion;
  openai.createChatCompletion = async (request: CreateChatCompletionRequest, options?: AxiosRequestConfig) => {
    const start = new Date();

    const mappedRequest = request as any;
    if (opts?.excludePromptOrMessages) {
      delete mappedRequest.messages;
    }

    let response = null;
    let duration = null;
    try {
      response = await createChatCompletion.apply(openai, [request, options]);
      duration = new Date().getTime() - start.getTime();
    } catch (e: any) {
      await axiom.ingestEvents(dataset!, {
        _time: start.toISOString(),
        type: "chatCompletion",
        duration,
        request: mappedRequest,
        error: e.message,
      })
      throw e;
    }

    const responseData = response.data as any;
    if (opts?.excludeChoices) {
      delete responseData.choices;
    }

    await axiom.ingestEvents(dataset!, { 
      _time: start.toISOString(),
      type: "chatCompletion",
      duration,
      request: mappedRequest, 
      response: responseData
    });

    return response;
  }

  return openai;
}

