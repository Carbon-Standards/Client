export class PResponse extends Response {
  url: string;

  constructor(
    url: string,
    init: ResponseInit & { body?: BodyInit | null | undefined }
  ) {
    super(init.body, init);
    this.url = url;
  }

  clone(): PResponse {
    return new PResponse(this.url, {
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
      body: this.body
    });
  }
}
