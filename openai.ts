import { OpenAIApi, CreateCompletionRequest, CreateChatCompletionRequest } from "openai";
import { AxiosRequestConfig } from "axios";
import BatchedAxiomClient from './shared';

export interface WithAxiomOptions {
  token?: string;
  dataset?: string;
  excludePromptOrMessages?: boolean;
  excludeChoices?: boolean;
}

export function withAxiom(openai: OpenAIApi, opts?: WithAxiomOptions): { openai: OpenAIApi, flush: Function } {
  const dataset = opts?.dataset || process.env.AXIOM_DATASET;
  const axiom = new BatchedAxiomClient(opts?.token, dataset!);

  const createCompletion = openai.createCompletion;
  openai.createCompletion = async (request: CreateCompletionRequest, options?: AxiosRequestConfig<any>) => {
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
      await axiom.ingestEvents({
        _time: start.toISOString(),
        type: "completion",
        duration_ms: duration,
        request: transformedRequest,
        error: e.message,
      })
      throw e;
    }

    const transformedResponse = structuredClone(response.data) as any;
    if (opts?.excludeChoices) {
      delete transformedResponse.choices;
    }
    transformedResponse.created = new Date(transformedResponse.created * 1000).toISOString();

    await axiom.ingestEvents({ 
      _time: start.toISOString(),
      type: "completion",
      duration_ms: duration,
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
      await axiom.ingestEvents({
        _time: start.toISOString(),
        type: "chatCompletion",
        duration_ms: duration,
        request: transformedRequest,
        error: e.message,
      })
      throw e;
    }

    const transformedResponse = structuredClone(response.data) as any;
    if (opts?.excludeChoices) {
      delete transformedResponse.choices;
    }
    transformedResponse.created = new Date(transformedResponse.created * 1000).toISOString();

    await axiom.ingestEvents({ 
      _time: start.toISOString(),
      type: "chatCompletion",
      duration_ms: duration,
      request: transformedRequest, 
      response: transformedResponse
    });

    return response;
  }

  return { openai, flush: axiom.flush.bind(axiom) };
}

