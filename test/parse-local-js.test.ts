import { describe, test } from "vitest";
import { parseJsFile } from "../src/index.js";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import * as path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const js = fs.readFileSync(path.join(__dirname, "./data/explore.js")).toString();
describe("Parsing js", async () => {
  test(`Parses JS`, async ({ expect }) => {
    const data = await parseJsFile(js);
  });
});
