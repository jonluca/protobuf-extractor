import { describe, test } from "vitest";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import * as path from "path";
import { fetchAndParseJsFilesFromWebpage, parseHtmlAndFetchScripts, parseJsFile } from "../src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const explore = fs.readFileSync(path.join(__dirname, "./data/explore.js")).toString();
const chunk = fs.readFileSync(path.join(__dirname, "./data/chunk.js")).toString();
describe("Parsing js", async () => {
  test(`Parses JS`, async ({ expect }) => {
    const data = await parseJsFile(explore);
    expect(data).toHaveLength(3);
  });

  test(`Parses JS from website`, async ({ expect }) => {
    const data = await fetchAndParseJsFilesFromWebpage("https://www.exploretock.com/");
    expect(data).toHaveLength(3);
  });
  test(`Parses JS with no protobufs`, async ({ expect }) => {
    const data = await parseJsFile(chunk);
    expect(data).toEqual([]);
  });
  test(`Parses html with no scripts`, async ({ expect }) => {
    const data = await parseHtmlAndFetchScripts(
      '<ul id="list"><li>Hello World</li></ul>',
      "https://www.exploretock.com/",
      "https:",
    );
    expect(data).toEqual([]);
  });
  test(`Parses html with no protobufs`, async ({ expect }) => {
    const data = await parseHtmlAndFetchScripts(
      '<ul id="list"><li>Hello World</li><script src="explore.js"/></ul>',
      "https://www.exploretock.com/",
      "https:",
    );
    expect(data).toEqual([]);
  });
});
