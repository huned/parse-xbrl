'use strict';
const XBRL = require('./src/XBRL');

exports.parse = async filePath => await new XBRL().parseFile(filePath);
exports.parseStr = async str => await new XBRL().parseStr(str);
