import { axiosClient } from "./axiosClient.js";
import esprima from "esprima";
import estraverse from "estraverse";
import { isString } from "lodash";
import { uniqBy } from "lodash-es";
import stableStringify from "json-stable-stringify";
import protobuf from "protobufjs";

export const parseJsFile = async (contents: string) => {
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
export const fetchAndParseJsFile = async (url: string) => {
  const { data } = await axiosClient.get(url);
  await parseJsFile(data);
};
