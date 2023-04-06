import Client from "@axiomhq/axiom-node";

function throttle(fn: Function, wait: number) {
  let lastFn: ReturnType<typeof setTimeout>, lastTime: number;
  return function (this: any) {
    const context = this,
      args = arguments;

    // First call, set lastTime
    if (lastTime == null) {
      lastTime = Date.now();
    }

    clearTimeout(lastFn);
    lastFn = setTimeout(() => {
      if (Date.now() - lastTime >= wait) {
        fn.apply(context, args);
        lastTime = Date.now();
      }
    }, Math.max(wait - (Date.now() - lastTime), 0));
  };
}

export interface AxiomClient {
  ingestEvents(events: Array<object> | object): Promise<void>
  flush(): Promise<void>
}

export class ImmediateAxiomClient implements AxiomClient {
  private readonly client: Client;
  private readonly dataset: string;

  constructor(token: string | undefined, dataset: string) {
    this.client = new Client({ token });
    this.dataset = dataset;
  }

  public async ingestEvents(events: Array<object> | object) {
    await this.client.ingestEvents(this.dataset, events);
  }

  public async flush() {
    // No-op
  }
}

const FLUSH_INTERVAL = 1000;
const FLUSH_SIZE = 1000;

export class BatchedAxiomClient implements AxiomClient {
  private readonly client: Client;
  private readonly dataset: string;
  private batch: object[];
  private throttledFlush = throttle(this.flush.bind(this), FLUSH_INTERVAL);
  private activeFlush: Promise<void> | null = null;

  constructor(token: string | undefined, dataset: string) {
    this.client = new Client({ token });
    this.dataset = dataset;
    this.batch = [];
  }

  // Ingests events into Axiom asynchronously every FLUSH_SIZE events or 
  // FLUSH_INTERVAL millis
  public async ingestEvents(events: Array<object> | object) {
    if (!Array.isArray(events)) {
      this.batch.push(events);
    } else {
      this.batch.push(...events);
    }

    if (this.batch.length >= FLUSH_SIZE) {
      this.flush();
    } else {
      this.throttledFlush();
    }
  }

  public async flush() {
    // If there's an active flush (due to throttling), wait for it to finish first
    if (this.activeFlush) {
      await this.activeFlush;
    }

    this.activeFlush = (async () => {
      await this.client.ingestEvents(this.dataset, this.batch);
      this.batch = [];
    })()
  }
}
