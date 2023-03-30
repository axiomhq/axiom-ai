import { OpenAIApi, CreateCompletionRequest, CreateChatCompletionRequest } from "openai";
import { AxiosRequestConfig } from "axios";
import Client from "@axiomhq/axiom-node";

export interface WithAxiomOptions {
  token?: string;
  dataset?: string;
  excludePromptOrMessages?: boolean;
  excludeChoices?: boolean;
}

export default function withAxiom(openai: OpenAIApi, opts?: WithAxiomOptions): OpenAIApi {
  const axiom = new Client({ token: opts?.token });
  const dataset = opts?.dataset || process.env.AXIOM_DATASET;

  const createCompletion = openai.createCompletion;
  openai.createCompletion = async (request: CreateCompletionRequest, options?: AxiosRequestConfig) => {
    const start = new Date();

    const transformedRequest = structuredClone(request) as any;
    if (opts?.excludePromptOrMessages) {
      delete transformedRequest.prompt;
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
        request: transformedRequest,
        error: e.message,
      })
      throw e;
    }

    const transformedResponse = structuredClone(response.data) as any;
    if (opts?.excludeChoices) {
      delete transformedResponse.choices;
    }
    transformedResponse.created = new Date(responseData.created * 1000).toISOString();

    await axiom.ingestEvents(dataset!, { 
      _time: start.toISOString(),
      type: "completion",
      duration,
      request: transformedRequest, 
      response: transformedResponse
    });

    return response;
  }

  const createChatCompletion = openai.createChatCompletion;
  openai.createChatCompletion = async (request: CreateChatCompletionRequest, options?: AxiosRequestConfig) => {
    const start = new Date();

    const transformedRequest = structuredClone(request) as any;
    if (opts?.excludePromptOrMessages) {
      delete transformedRequest.messages;
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
        request: transformedRequest,
        error: e.message,
      })
      throw e;
    }

    const transformedResponse = structuredClone(response.data) as any;
    if (opts?.excludeChoices) {
      delete transformedResponse.choices;
    }
    transformedResponse.created = new Date(responseData.created * 1000).toISOString();

    await axiom.ingestEvents(dataset!, { 
      _time: start.toISOString(),
      type: "chatCompletion",
      duration,
      request: transformedRequest, 
      response: transformedResponse
    });

    return response;
  }

  return openai;
}

