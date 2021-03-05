const fs = require('fs').promises;
const _ = require('lodash');
const xmlParser = require('xml2json');
const FundamentalAccountingConcepts = require('./FundamentalAccountingConcepts.js');

(function () {
  'use strict';
  const MS_IN_A_DAY = 24 * 60 * 60 * 1000;
  const DATE_FORMAT = /(\d{4})-(\d{1,2})-(\d{1,2})/;

  async function parse(filePath) {
    const contents = await fs.readFile(filePath, 'utf8');
    return new XbrlData(contents);
  }

  class XbrlDataBuilder {
    constructor() {
      this.document = '';
      this.field = {};
    }

    async parseFile(filePath) {
      return this.parseString(await fs.readFile(filePath, 'utf8'));
    }

    async parseString(string) {
      const data = JSON.parse(xmlParser.toJson(string));
      this.document = data[Object.keys(data)[0]];
      this.loadField('EntityRegistrantName');
      this.loadField('CurrentFiscalYearEndDate');
      this.loadField('EntityCentralIndexKey');
      this.loadField('EntityFilerCategory');
      this.loadField('TradingSymbol');
      this.loadField('DocumentPeriodEndDate');
      this.loadField('DocumentFiscalYearFocus');
      this.loadField('DocumentFiscalPeriodFocus');
      this.loadField(
        'DocumentFiscalYearFocus',
        'DocumentFiscalYearFocusContext',
        'contextRef'
      );
      this.loadField(
        'DocumentFiscalPeriodFocus',
        'DocumentFiscalPeriodFocusContext',
        'contextRef'
      );
      this.loadField('DocumentType');

      const currentYearEnd = this.getYear();
      console.log(`Current year end: ${currentYearEnd}`);
      // TODO: continue from here

      // return a clone of this.fields
      return Object.assign({}, this.fields);
    }

    getYear() {
      const currentEnd = this.fields['DocumentPeriodEndDate'];
      const currentYear = this.fields['DocumentFiscalYearFocus'];

      if (canConstructDateWithMultipleComponents(currentEnd, currentYear)) {
        return constructDateWithMultipleComponents(currentEnd, currentYear);
      }

      const date = new Date(currentEnd);
      if (!/Invalid date/.test(date)) return date;

      throw new Error(`${currentEnd} is not a date!`);
    }

    loadField(conceptToFind, fieldName = conceptToFind, key = '$t') {
      let concept = search(this.document, 'dei:' + conceptToFind);
      if (Array.isArray(concept)) {
        concept = _.find(concept, (conceptInstance, idx) => idx === 0);
      }
      this.fields[fieldName] = _.get(concept, key, 'Field not found');
    }
  }

  function XbrlData(xmlContents) {
    this.loadYear = loadYear.bind(this);
    this.loadField = loadField.bind(this);
    this.getFactValue = getFactValue.bind(this);
    this.documentJson;
    this.fields = {};
    this.getNodeList = getNodeList.bind(this);
    this.getContextForInstants = getContextForInstants.bind(this);
    this.getContextForDurations = getContextForDurations.bind(this);
    this.lookForAlternativeInstanceContext = lookForAlternativeInstanceContext.bind(
      this
    );

    const result = new Promise((resolve, reject) => {
      const data = JSON.parse(xmlParser.toJson(xmlContents));
      this.documentJson = data[Object.keys(data)[0]];

      // Calculate and load basic facts from json doc
      // CONTEXT REF MISSING?
      this.loadField('EntityRegistrantName'); // OK
      this.loadField('CurrentFiscalYearEndDate'); // ?
      this.loadField('EntityCentralIndexKey'); // OK
      this.loadField('EntityFilerCategory'); // OK
      this.loadField('TradingSymbol'); // OK
      this.loadField('DocumentPeriodEndDate'); // OK
      this.loadField('DocumentFiscalYearFocus'); // GETS SOLVED LATER
      this.loadField('DocumentFiscalPeriodFocus'); // OK
      this.loadField(
        'DocumentFiscalYearFocus',
        'DocumentFiscalYearFocusContext',
        'contextRef'
      ); // DocumentFiscalYearFocusContext ??
      this.loadField(
        'DocumentFiscalPeriodFocus',
        'DocumentFiscalPeriodFocusContext',
        'contextRef'
      ); // ??
      this.loadField('DocumentType'); // OK

      const currentYearEnd = this.loadYear();
      if (!currentYearEnd) {
        return reject('No year end found.');
      }

      const durations = this.getContextForDurations(currentYearEnd);

      this.fields['IncomeStatementPeriodYTD'] =
        durations.incomeStatementPeriodYTD;
      this.fields['ContextForInstants'] = this.getContextForInstants(
        currentYearEnd
      );
      this.fields['ContextForDurations'] = durations.contextForDurations;
      this.fields['BalanceSheetDate'] = currentYearEnd;

      // Load the rest of the facts
      FundamentalAccountingConcepts.load(this);
      resolve(this.fields);
    });

    return result;
  }

  function search(tree, target) {
    let result = [];

    Object.keys(tree).forEach(key => {
      if (key === target) {
        return result.push(tree[key]);
      }

      if (tree[key]['name'] === target) {
        return result.push(tree[key]);
      }

      if (typeof tree[key] === 'object') {
        return result.push(search(tree[key], target));
      }
    });

    return result.flat();
  }

  function loadField(conceptToFind, fieldName, key) {
    key = key || '$t';
    fieldName = fieldName || conceptToFind;
    let concept = search(this.documentJson, 'dei:' + conceptToFind);
    if (Array.isArray(concept)) {
      concept = _.find(concept, function (conceptInstance, idx) {
        return idx === 0;
      });
    }
    this.fields[fieldName] = _.get(concept, key, 'Field not found.');
  }

  function getFactValue(concept, periodType) {
    let contextReference;
    let factNode;
    let factValue;

    if (periodType === 'Instant') {
      contextReference = this.fields['ContextForInstants'];
    } else if (periodType === 'Duration') {
      contextReference = this.fields['ContextForDurations'];
    } else {
      console.warn('CONTEXT ERROR');
    }

    _.forEach(search(this.documentJson, concept), function (node) {
      if (node.contextRef === contextReference) {
        factNode = node;
      }
    });

    if (!factNode) return null;

    factValue = factNode['$t'];
    if (Object.keys(factNode).some(k => k.includes('nil'))) {
      factValue = 0;
    }

    if (typeof factValue === 'string') {
      factValue = parseFloat(factValue);
    }

    const scale = parseInt(factNode.scale) || 0;
    return factValue * 10 ** scale;
  }

  function constructDateWithMultipleComponents(monthDay, year) {
    try {
      return new Date(monthDay + year).toISOString();
    } catch (err) {
      throw new Error(
        `Cannot construct proper date with ${monthDay} and ${year}`
      );
    }
  }

  function canConstructDateWithMultipleComponents(monthDay, year) {
    try {
      constructDateWithMultipleComponents(monthDay, year);
      return true;
    } catch (ex) {
      return false;
    }
  }

  function loadYear() {
    let currentEnd = this.fields['DocumentPeriodEndDate'];
    let currentYear = this.fields['DocumentFiscalYearFocus'];

    if (currentEnd.match(DATE_FORMAT)) {
      return currentEnd;
    }

    if (canConstructDateWithMultipleComponents(currentEnd, currentYear)) {
      return constructDateWithMultipleComponents(currentEnd, currentYear);
    }

    const date = new Date(currentEnd);
    if (!/Invalid date/.test(date)) return date;

    console.warn(currentEnd + ' is not a date');
    return false;
  }

  function getNodeList(nodeNamesArr, root) {
    root = root || this.documentJson;
    let allNodes = [];

    for (let i = 0; i < nodeNamesArr.length; i++) {
      allNodes = allNodes.concat(search(root, nodeNamesArr[i]));
    }
    allNodes = allNodes.flat();

    // Remove undefined nodes
    return _.filter(allNodes, function (node) {
      if (node) {
        return true;
      }
    });
  }

  function getContextForInstants(endDate) {
    let contextForInstants = null;
    const contexts =
      getContext(this.documentJson) ?? searchContext(this.documentJson);

    // Uses the concept ASSETS to find the correct instance context
    const nodes = this.getNodeList([
      'us-gaap:Assets',
      'us-gaap:AssetsCurrent',
      'us-gaap:LiabilitiesAndStockholdersEquity'
    ]);

    for (const node of nodes) {
      contexts
        .filter(context => {
          return (
            context.id === node.contextRef &&
            isSameDate(getContextInstant(context), endDate, MS_IN_A_DAY) &&
            !instanceHasExplicitMember(context)
          );
        })
        .forEach(context => {
          contextForInstants = context.id;
        });
    }

    if (contextForInstants !== null) {
      return contextForInstants;
    }
    return this.lookForAlternativeInstanceContext();
  }

  function getVariable(object, paths, defaultValue) {
    return findVariable(object, paths, _.get);
  }

  function searchVariable(object, paths) {
    return findVariable(object, paths, search);
  }

  function findVariable(object, paths, cb) {
    for (let path of paths) {
      if (cb(object, path)) return cb(object, path);
    }
    return null;
  }

  function getContextInstant(object) {
    const paths = [
      ['xbrli:period', 'xbrli:instant'],
      ['period', 'instant']
    ];
    return getVariable(object, paths);
  }

  function getContext(object) {
    const paths = ['xbrli:context', 'context'];
    return getVariable(object, paths);
  }

  function searchContext(object) {
    const paths = ['xbrli:context', 'context'];
    return searchVariable(object, paths);
  }

  function getEndDate(object) {
    const paths = [
      ['xbrli:period', 'xbrli:endDate'],
      ['period', 'endDate']
    ];
    return getVariable(object, paths);
  }

  // TODO: add default values
  function instanceHasExplicitMember(object) {
    const paths = [
      ['xbrli:entity', 'xbrli:segment', 'xbrldi:explicitMember'],
      ['entity', 'segment', 'explicitMember']
    ];
    return getVariable(object, paths);
  }

  function durationHasExplicitMember(object) {
    const paths = [
      ['xbrli:entity', 'xbrli:segment', 'xbrldi:explicitMember'],
      ['entity', 'segment', 'explicitMember']
    ];
    return getVariable(object, paths);
  }

  // TODO: what if date can't be found?
  function getStartDate(object) {
    const paths = [
      ['xbrli:period', 'xbrli:startDate'],
      ['period', 'startDate']
    ];
    return getVariable(object, paths);
  }

  function isSameDate(a, b, epsilon = 0) {
    return Math.abs(new Date(a) - new Date(b)) <= epsilon;
  }

  function getContextForDurations(endDate) {
    let contextForDurations = null;
    let startDateYTD = '2099-01-01';
    const contexts =
      getContext(this.documentJson) ?? searchContext(this.documentJson);

    const nodes = this.getNodeList([
      'us-gaap:CashAndCashEquivalentsPeriodIncreaseDecrease',
      'us-gaap:CashPeriodIncreaseDecrease',
      'us-gaap:NetIncomeLoss',
      'dei:DocumentPeriodEndDate'
    ]);

    for (const node of nodes) {
      contexts
        .filter(
          context =>
            context.id === node.contextRef &&
            isSameDate(getEndDate(context), endDate, MS_IN_A_DAY) &&
            !durationHasExplicitMember(context)
        )
        .forEach(context => {
          const startDate = getStartDate(context);
          if (new Date(startDate) <= new Date(startDateYTD)) {
            startDateYTD = startDate;
            contextForDurations = context.id;
          }
        });
    }

    return {
      contextForDurations: contextForDurations,
      incomeStatementPeriodYTD: startDateYTD
    };
  }

  function lookForAlternativeInstanceContext() {
    let altContextId = null;
    let altNodesArr = _.filter(
      _.get(this.documentJson, [
        'xbrli:context',
        'xbrli:period',
        'xbrli:instant'
      ]) || _.get(this.documentJson, ['context', 'period', 'instant']),
      function (node) {
        if (node === this.fields['BalanceSheetDate']) {
          return true;
        }
      }
    );

    for (let h = 0; h < altNodesArr.length; h++) {
      _.forEach(_.get(this.documentJson, ['us-gaap:Assets']), function (node) {
        if (node.contextRef === altNodesArr[h].id) {
          altContextId = altNodesArr[h].id;
        }
      });
    }
    return altContextId;
  }

  exports.parse = parse;
  exports.XbrlData = XbrlData;
  exports.loadField = loadField;
  exports.getContextForDurations = getContextForDurations;
  exports.XbrlDataBuilder = XbrlDataBuilder;
})();
