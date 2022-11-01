import { describe, test } from "vitest";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import * as path from "path";
import { parseJsFile } from "../src/file-handling.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const explore = fs.readFileSync(path.join(__dirname, "./data/explore.js")).toString();
const chunk = fs.readFileSync(path.join(__dirname, "./data/chunk.js")).toString();
describe("Parsing js", async () => {
  test(`Parses JS`, async ({ expect }) => {
    const data = await parseJsFile(explore);
    expect(data).toHaveLength(3);
  });
  test(`Parses JS with no protobufs`, async ({ expect }) => {
    const data = await parseJsFile(chunk);
    expect(data).toEqual([]);
  });
});
