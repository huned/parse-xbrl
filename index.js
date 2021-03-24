'use strict';
import { XbrlParser } from './src/XbrlParser.js';

export async function parse(filePath) {
  return await new XbrlParser().parseFile(filePath);
}
export async function parseStr(str) {
  return await new XbrlParser().parseStr(str);
}

// for CommonJS compatibility
export default {
  parse,
  parseStr
};
