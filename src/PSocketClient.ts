import { PResponse } from "./PResponse";
import {
  PSocketPacket,
  PSocketMeta,
  PSocketRequest,
  PSocketResponse
} from "./types/PSocket";
import { v4 } from "uuid";

type Options = {
  url: string;
};

const META_BYTES = 18;

export class PSocketClient {
  ws?: WebSocket;
  #responseQueue: Record<
    string,
    {
      chunks: Uint8Array[];
      request: PSocketRequest;
      resolve: (response: Response) => void;
      reject: (reason?: any) => void;
      response?: PSocketResponse;
    }
  > = {};
  url: string;
  meta?: PSocketMeta;
  ready: Promise<void>;

  constructor(options: Options) {
    this.ready = this.#init();
    this.url = options.url;
  }

  fetch(input: string | Request | URL, init?: RequestInit): Promise<Response> {
    return new Promise<Response>(async (resolve, reject) => {
      await this.ready;

      const request = new Request(input, init);

      const pRequest: PSocketRequest = {
        id: v4().replace(/-/g, ""),
        type: "request",
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries())
      };

      let body: ArrayBuffer | undefined;

      if (request.body) {
        body = await request.arrayBuffer();

        pRequest.body = body.byteLength;

        if (body.byteLength > this.meta!.maxBodySize) {
          throw new Error("Body too large.");
        }
      }

      this.ws!.send(JSON.stringify(pRequest));

      const usableBytes = this.meta!.maxPacketSize - META_BYTES;

      if (body !== undefined) {
        const packets = Math.ceil(body.byteLength / usableBytes);

        for (let i = 0; i < packets; i++) {
          this.ws!.send(
            new Uint8Array([
              // ID
              ...pRequest.id
                .match(/.{1,2}/g)!
                .map((byte) => parseInt(byte, 16)),
              // Index
              ...[(i >> 8) & 0xff, i & 0xff],
              // Body
              ...new Uint8Array(
                body.slice(i * usableBytes, (i + 1) * usableBytes)
              )
            ])
          );
        }
      }

      this.#responseQueue[pRequest.id] = {
        chunks: new Array<Uint8Array>(
          Math.ceil(body?.byteLength ?? 0 / usableBytes)
        ),
        request: pRequest,
        resolve,
        reject
      };
    });
  }

  connect(): Promise<WebSocket> {
    return new Promise<WebSocket>((resolve, reject) => {
      reject();
    });
  }

  async #handleMessage({
    data
  }: MessageEvent<string | Uint8Array>): Promise<void> {
    if (typeof data === "string") {
      const message = JSON.parse(data) as PSocketPacket;

      switch (message.type) {
        case "response":
          const request = this.#responseQueue[message.id];

          if (!request) throw new Error("Matching request not found.");

          request.response = message;

          if (!message.body) {
            request.resolve(
              new PResponse(message.url, {
                status: message.status,
                statusText: message.statusText,
                headers: message.headers
              })
            );
          }

          break;
        case "message":
          // TODO: Websockets
          break;
        case "error":
          throw new Error(message.message);
        default:
          throw new Error("Unknown message type.");
      }
    } else {
      const id = Array.from(data.slice(0, 16))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      const index = ((data[16] & 0xff) << 8) | (data[17] & 0xff);

      const request = this.#responseQueue[id];

      if (!request) throw new Error("Matching request not found.");

      request.chunks[index] = data.slice(18);

      if (request.chunks.every((chunk) => chunk !== undefined)) {
        const body = new Uint8Array(
          request.chunks.reduce(
            (previous, current) => previous + current.byteLength,
            0
          )
        );

        let offset = 0;

        for (const chunk of request.chunks) {
          body.set(chunk, offset);
          offset += chunk.byteLength;
        }

        request.resolve(
          new PResponse(request.request.url, {
            status: request.response!.status,
            statusText: request.response!.statusText,
            headers: request.response!.headers,
            body
          })
        );
      }
    }
  }

  async #init(): Promise<void> {
    return new Promise(async (resolve, reject): Promise<void> => {
      this.meta = await this.#fetchMeta();
      this.ws = new WebSocket(this.url);

      this.ws.addEventListener("open", () => {
        resolve();
      });

      this.ws.addEventListener("message", this.#handleMessage.bind(this));

      this.ws.addEventListener("error", (event) => {
        reject(event);
      });
    });
  }

  async #fetchMeta(): Promise<PSocketMeta> {
    const request = await fetch(this.url);

    const meta = (await request.json()) as PSocketMeta;

    return meta;
  }
}
