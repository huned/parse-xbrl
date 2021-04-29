import _ from 'lodash';
import { promises as fs } from 'fs';
import { toJson } from 'xml2json';
import { loadFundamentalAccountingConcepts } from '../utils/FundamentalAccountingConcepts.js';
import { Context } from './Context.js';
import {
  canConstructDateWithMultipleComponents,
  constructDateWithMultipleComponents,
  getPropertyFrom,
  getVariable,
  searchVariable,
  search,
  formatNumber
} from '../utils/utils.js';

import { Facts } from './fact/Facts.js';

export class XbrlParser {
  constructor(data) {
    this.document = '';
    this.fields = {};
    this.init(data);
  }

  static async parse(path) {
    return await XbrlParser.parseStr(await fs.readFile(path, 'utf8'));
  }

  static async parseStr(str) {
    const data = JSON.parse(toJson(str));
    return Promise.resolve(new XbrlParser(data).fields);
  }

  init(data) {
    this.document = data[Object.keys(data)[0]];
    this.loadField('EntityRegistrantName');
    this.loadField('CurrentFiscalYearEndDate');
    this.loadField('EntityCentralIndexKey');
    this.loadField('EntityFilerCategory');
    this.loadField('TradingSymbol');
    this.loadField('DocumentPeriodEndDate');
    this.loadField('DocumentFiscalYearFocus');
    this.loadField('DocumentFiscalPeriodFocus');
    this.loadField('DocumentFiscalYearFocus', 'DocumentFiscalYearFocusContext', 'contextRef');
    this.loadField('DocumentFiscalPeriodFocus', 'DocumentFiscalPeriodFocusContext', 'contextRef');
    this.loadField('DocumentType');

    const currentYearEnd = this.getYear();
    if (!currentYearEnd) throw new Error('No end year found');

    const durations = this.getContextForDurations(currentYearEnd);
    this.fields['IncomeStatementPeriodYTD'] = durations.incomeStatementPeriodYTD;
    this.fields['ContextForInstants'] = this.getContextForInstants(currentYearEnd);
    this.fields['ContextForDurations'] = durations.contextForDurations;
    this.fields['BalanceSheetDate'] = currentYearEnd;
    // Load the rest of the facts
    loadFundamentalAccountingConcepts(this);
  }

  getDocument() {
    return this.document;
  }

  getFields() {
    return this.fields;
  }

  getYear() {
    const currentEnd = this.fields['DocumentPeriodEndDate'];
    const currentYear = this.fields['DocumentFiscalYearFocus'];

    if (canConstructDateWithMultipleComponents(currentEnd, currentYear)) {
      return constructDateWithMultipleComponents(currentEnd, currentYear);
    }

    const endDate = new Date(currentEnd);
    if (!/Invalid date/.test(endDate)) return currentEnd;

    throw new Error(`${currentEnd} is not a date!`);
  }

  loadField(concept, fieldName = concept, key = '$t') {
    this.fields[fieldName] = getPropertyFrom(this.document, concept, key);
  }

  getContexts() {
    const [obj, paths] = [this.document, ['xbrli:context', 'context']];
    const result = getVariable(obj, paths) ?? searchVariable(obj, paths);
    if (result) return result.map(c => new Context(c));

    throw new Error('No contexts found!');
  }

  getDurationContexts() {
    return this.getContexts().filter(c => c.isDuration());
  }

  getInstantContexts() {
    return this.getContexts().filter(c => c.isInstant());
  }

  getNodeList(names) {
    const allNodes = [];

    for (const name of names) {
      allNodes.push(...search(this.document, name));
    }

    return allNodes.flat().filter(n => typeof n !== 'undefined');
  }

  getContextForDurations(endDate) {
    let contextForDurations = null;
    let startDateYTD = '2099-01-01';
    const contexts = this.getDurationContexts();

    const nodes = this.getNodeList([
      'us-gaap:CashAndCashEquivalentsPeriodIncreaseDecrease',
      'us-gaap:CashPeriodIncreaseDecrease',
      'us-gaap:NetIncomeLoss',
      'dei:DocumentPeriodEndDate'
    ]);

    for (const node of nodes) {
      contexts
        .filter(context => context.represents(node, endDate))
        .forEach(context => {
          if (context.startsBefore(startDateYTD)) {
            startDateYTD = context.getStartDate();
            contextForDurations = context.id;
          }
        });
    }

    return {
      contextForDurations: contextForDurations,
      incomeStatementPeriodYTD: startDateYTD
    };
  }

  getContextForInstants(endDate) {
    let contextForInstants = null;
    const contexts = this.getInstantContexts();

    // Uses the concept ASSETS to find the correct instant context
    const nodes = this.getNodeList([
      'us-gaap:Assets',
      'us-gaap:AssetsCurrent',
      'us-gaap:LiabilitiesAndStockholdersEquity'
    ]);

    for (const node of nodes) {
      const context = contexts.filter(context => context.represents(node, endDate)).pop();
      if (context) contextForInstants = context.id;
    }

    if (contextForInstants !== null) return contextForInstants;
    return this.lookForAlternativeInstantsContext();
  }

  lookForAlternativeInstantsContext() {
    let altContextId = null;
    let altNodesArr = _.filter(
      _.get(this.document, ['xbrli:context', 'xbrli:period', 'xbrli:instant']) ||
        _.get(this.document, ['context', 'period', 'instant']),
      node => node === this.fields['BalanceSheetDate']
    );

    for (let h = 0; h < altNodesArr.length; h += 1) {
      _.get(this.document, ['us-gaap:Assets']).forEach(node => {
        if (node.contextRef === altNodesArr[h].id) {
          altContextId = altNodesArr[h].id;
        }
      });
    }
    return altContextId;
  }

  getInstantFactValue(concept) {
    return this.getFactValue(concept, this.fields['ContextForInstants']);
  }

  getDurationFactValue(concept) {
    return this.getFactValue(concept, this.fields['ContextForDurations']);
  }

  getFactValue(concept, contextReference) {
    const factNode = search(this.document, concept)
      .filter(node => node.contextRef === contextReference)
      .pop();

    if (!factNode) return null;

    if (Object.keys(factNode).some(k => k.includes('nil'))) {
      return 0;
    }

    let factValue = factNode['$t'];
    if (typeof factValue === 'string') {
      factValue = parseFloat(formatNumber(factNode.format, factValue));
    }

    const scale = parseInt(factNode.scale) || 0;
    return factValue * 10 ** scale;
  }

  getFact(concept) {
    return new Facts(search(this.document, concept), this.getContexts());
  }
}

export default XbrlParser;
