# Client

A library to easily interact with PSocket servers from the client.

## Creating a client

```ts
import { PSocketClient } from "@psocket/client";

const client = new PSocketClient({
  url: "/psocket/"
});
```

## Making remote requests

```ts
const response: Response = await client.fetch("https://api.example.com/");

console.log(await response.json());
```

## Connecting to a remote

```ts
const ws: WebSocket = await client.connect("wss://example.com/");

ws.onopen = () => {
  ws.send("Hello World!");
}
```
