import { axiosClient } from "./axiosClient.js";
import esprima from "esprima";
import estraverse from "estraverse";
import { isString } from "lodash";
import { uniqBy } from "lodash-es";
import stableStringify from "json-stable-stringify";
import type { Root } from "protobufjs";
import protobuf from "protobufjs";
import path from "path";
import { parse } from "node-html-parser";

export const parseJsFile = async (contents: string): Promise<Root[]> => {
  const ast = esprima.parseScript(contents);

  const strings = new Set<string>();

  estraverse.traverse(ast, {
    enter: (node) => {
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
  // do another unique-ness check here, in case the objects are similar
  const uniqueObjects = uniqBy(validJson, (o) => stableStringify(o));

  const roots = uniqueObjects.map((l) => protobuf.Root.fromJSON(l));
  return roots;
};

export const parseHtmlAndFetchScripts = async (html: string, url: string, protocol: string) => {
  const root = parse(html);
  const scripts = root.getElementsByTagName("script");

  const srcList: string[] = [];
  scripts.forEach((l) => {
    const src = l.attrs.src;
    if (src) {
      const fullurl = `${src.startsWith("//") ? protocol || "https:" : ""}${src}`;
      srcList.push(fullurl);
    }
  });

  if (!srcList.length) {
    return [];
  }

  const roots: Root[][] = [];

  const processUrl = async (src: string) => {
    try {
      if (!(src.startsWith("http:") || src.startsWith("https:"))) {
        const parsedUrl = new URL(url);
        parsedUrl.pathname = src?.startsWith("/") ? src : path.join(parsedUrl.pathname, src);
        src = parsedUrl.toString();
      }
      const { data } = await axiosClient.get(src);
      roots.push(await parseJsFile(data));
    } catch {
      // do nothing
    }
  };
  const promises = srcList.map((l) => processUrl(l));
  await Promise.all(promises);
  const allRoots = roots.flat();
  return allRoots;
};
export const fetchAndParseJsFilesFromWebpage = async (url: string) => {
  const { data, request } = await axiosClient.get(url);
  return parseHtmlAndFetchScripts(data, url, request.protocl);
};
