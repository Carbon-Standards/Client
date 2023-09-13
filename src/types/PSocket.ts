export type PSocketMeta = {
  /**
   * Versions that are provided by the given PSocket server.
   * */
  versions: number[];
  /**
   * The request timeout value set by the server, this value should be identical between client and server pairs.
   * */
  requestTimeout: number;
  /**
   * The maximum body size in bytes allowed by the server. If either request or response body exceeds this limit, the server will respond with an error.
   */
  maxBodySize: number;
  /**
   * The maximum websocket message size in bytes allowed for remote connections. If any message exceeds this limit, the server will respond with an error.
   */
  maxMessageSize: number;
  /**
   * The maximum packet size in bytes allowed by the server. If any packet exceeds this limit, the server will respond with an error.
   */
  maxPacketSize: number;
  /**
   * Contact information about the maintainer of the given PSocket server.
   *
   * Can be used to contact maintainers about security vulnerabilities.
   * */
  maintainer?: {
    email: string;
    website: string;
  };
  /**
   * Meta data about the current implementation.
   *
   * Can be used to identify vulnerable servers.
   */
  project: {
    name: string;
    description?: string;
    email?: string;
    website?: string;
    repository?: string;
    version: string;
  };
};

export type PSocketRequest = {
  /**
   * A 32 character HEX string identifying the request.
   *
   * This should be randomly generated uppon each request in order to ensure there are no response collisions.
   * If this isn't set, the server will respond with an error.
   */
  id: string;
  /**
   * This value is used by the server to determine what kind of action is being completed.
   *
   * This value may be one of four different values for requests and responses.
   *
   * `"request" | "response" | "message" | "error"`
   */
  type: "request";
  /**
   * A string to set request's method.
   *
   * If an invalid HTTP method is provided, the server will respond with an error.
   */
  method: string;
  /**
   * The remote URL.
   *
   * If this isn't set, the server will respond with an error.
   */
  url: string;
  /**
   * Headers to be sent to the remote.
   *
   * Note that no other headers apart from what is specified here will be sent to the remote.
   */
  headers: Record<string, string>;
  /**
   * An integer value representing the size of the body in bytes.
   *
   * If set, the server will wait for the full body to be recieved before making any requests.
   */
  body?: number;
};

export type PSocketResponse = {
  /**
   * The 32 character HEX string identifying the response.
   *
   * This id represents which `PSocketRequest` the given response corelates to.
   */
  id: string;
  /**
   * This value is used by the client to determine what kind of action is being completed.
   *
   * This value may be one of four different values for requests and responses.
   *
   * `"request" | "response" | "message" | "error"`
   */
  type: "response";
  /**
   * The final URL provided by the response.
   *
   * This may differ from the request URL if the server redirected the request.
   */
  url: string;
  /**
   * The HTTP status code provided by the remote resource.
   */
  status: number;
  /**
   * The HTTP status text provided by the remote resource.
   */
  statusText: string;
  /**
   * The response headers provided by the remote.
   */
  headers: Record<string, string>;
  /**
   * An integer value representing the size of the body in bytes.
   *
   * If set, the client will wait for the full body to be recieved before finalizing any requests.
   */
  body?: number;
};

export type PSocketMessage = {
  /**
   * The 32 character HEX string identifying the response.
   *
   * This id represents which `PSocketRequest` the given response corelates to.
   */
  id: string;
  /**
   * This value is used by the client and server to determine what kind of action is being completed.
   *
   * This value may be one of four different values for requests and responses.
   *
   * `"request" | "response" | "message" | "error"`
   */
  type: "message";
  /**
   * An integer value representing the size of the message in bytes.
   *
   * The client/server will wait for the full message to be recieved before forwarding the message.
   */
  data: number;
  /**
   * The data type of the message.
   */
  dataType: "text" | "binary";
};

export type PSocketError = {
  id: string;
  type: "error";
  code: string;
  key: string;
  message: string;
};

export type PSocketPacket =
  | PSocketRequest
  | PSocketResponse
  | PSocketMessage
  | PSocketError;
