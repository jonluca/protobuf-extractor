import { describe, test, vi } from "vitest";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import * as path from "path";
import { fetchAndParseJsFilesFromWebpage, parseHtmlAndFetchScripts, parseJsFile } from "../src/index.js";
import { axiosClient } from "../src/axiosClient.js";

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
    const get = vi
      .spyOn(axiosClient, "get")
      .mockResolvedValueOnce({ data: '<script src="/explore.js"></script>' })
      .mockResolvedValueOnce({ data: explore });

    const data = await fetchAndParseJsFilesFromWebpage("https://www.exploretock.com/");

    expect(data).toHaveLength(3);
    expect(get).toHaveBeenCalledWith("https://www.exploretock.com/");
    expect(get).toHaveBeenCalledWith("https://www.exploretock.com/explore.js");
    get.mockRestore();
  });
  test(`Parses JS with no protobufs`, async ({ expect }) => {
    const data = await parseJsFile(chunk);
    expect(data).toEqual([]);
  });
  test(`Rejects unrelated JSON objects`, async ({ expect }) => {
    const data = await parseJsFile(`const config = '{"enabled":true}'`);
    expect(data).toEqual([]);
  });
  test(`Resolves page-relative and protocol-relative scripts`, async ({ expect }) => {
    const get = vi.spyOn(axiosClient, "get").mockResolvedValue({ data: "" });

    await parseHtmlAndFetchScripts(
      '<script src="bundle.js"></script><script src="//cdn.example.com/app.js"></script>',
      "http://example.com/assets/page.html",
    );

    expect(get).toHaveBeenCalledWith("http://example.com/assets/bundle.js");
    expect(get).toHaveBeenCalledWith("http://cdn.example.com/app.js");
    get.mockRestore();
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
