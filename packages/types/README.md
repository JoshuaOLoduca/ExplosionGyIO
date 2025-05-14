# How to Use

Install package as a dev dependency. this allows us to skip a bunch of configuration for compilation for prod.

### Example install

<ins>_In root directory of project_</ins>

```sh
cd ./packages/client
npm i -D ../types
```

# How to Develop for Package

All types in this package should only have defined keys that will be shared by server and client.
Since we are using [colyseus](https://colyseus.io/) for data syncing, that means that things defined on the server **needs** a decorator.

### Server Example

```ts
import { Schema, type } from "@colyseus/schema";

type tExample = {
  id: number;
};

class ExampleSchema extends Schema implements tExample {
  constructor(data: tExample) {
    this.id = data.id;
  }

  @type("number")
  id: number;

  // any be anything, and will only exist serverside.
  // so DO NOT include it in the tExample type.
  internalData: any;
}
```
