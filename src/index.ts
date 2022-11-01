import esprima from "esprima";
import estraverse from "estraverse";
import jsdom from "jsdom";
import * as path from "path";
import { isString } from "lodash";
import { axiosClient } from "./axiosClient.js";
const { JSDOM } = jsdom;

const BASE_URL = process.argv[process.argv.length - 2];
const OUT_DIR = process.argv[process.argv.length - 1];

export const parseJsFile = async (contents: string) => {
  const ast = esprima.parseScript(contents);

  const strings = new Set<string>();

  estraverse.traverse(ast, {
    enter: (node, parent) => {
      if (node.type === "Literal") {
        if (isString(node.value)) {
          strings.add(node.value);
        }
      }
    },
  });

  const unique = Array.from(strings);
  const validJson = [];
  for (const str of unique) {
    if (str) {
      const trimmed = str.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Object.keys(parsed).length) {
            validJson.push(parsed);
          }
        } catch {
          // do nothing
        }
      }
    }
  }
  return validJson;
};

const fetchAndParseJsFile = async (url: string) => {
  const { data } = await axiosClient.get(url);
  await parseJsFile(data);
};

const run = async () => {
  if (!BASE_URL || !OUT_DIR) {
    console.error("Must pass url as first argument and directory to save into as second");
    process.exit(1);
  }
  const { data, request } = await axiosClient.get(BASE_URL);
  const dom = new JSDOM(data);
  if (!dom) {
    console.error("Invalid DOM");
    process.exit(1);
  }
  const links = dom.window.document.querySelectorAll("script");
  const srcList: string[] = [];
  links.forEach((l) => {
    const src = l.src;
    if (src && request) {
      if (src.startsWith("//")) {
        srcList.push(`${request.protocol || "https:"}${src}`);
      } else {
        srcList.push(src);
      }
    }
  });

  if (!srcList.length) {
    console.log("No sources found, bailing");
    process.exit(0);
  }

  for (const s of srcList) {
    try {
      if (s.startsWith("http:") || s.startsWith("https:")) {
        await fetchAndParseJsFile(s);
      } else {
        const parsedUrl = new URL(BASE_URL);
        parsedUrl.pathname = s?.startsWith("/") ? s : path.join(parsedUrl.pathname, s);
        await fetchAndParseJsFile(parsedUrl.toString());
      }
    } catch (e) {
      console.error(`Error parsing source ${s}`);
      console.error(e);
    }
  }
  console.error(`Done`);
};
if (BASE_URL && OUT_DIR) {
  run();
}
