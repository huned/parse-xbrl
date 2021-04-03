import { XbrlParser } from './classes/XbrlParser.js';

export async function parse(filePath) {
  return await new XbrlParser().parseFile(filePath);
}
export async function parseStr(str) {
  return await new XbrlParser().parseStr(str);
}
