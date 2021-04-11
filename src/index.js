import { XbrlParser } from './classes/XbrlParser.js';

export async function parse(filePath) {
  return await XbrlParser.parse(filePath);
}

export async function parseStr(str) {
  return await XbrlParser.parseStr(str);
}

export { XbrlParser };
