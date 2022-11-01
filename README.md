# Protobuf extractor

This package will help extract protobuf.js definitions from a given file or from a webpage.

## Usage

```bash
yarn add protobuf-extractor
```

```js
import { parseJsFile } from "protobuf-extractor";

const jsContents = fs.readFileSync(path.join(__dirname, "./file.js")).toString();
const definitions = await parseJsFile(jsContents);
```
