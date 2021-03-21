const fs = require('fs').promises;
const _ = require('lodash');
const xmlParser = require('xml2json');
const FundamentalAccountingConcepts = require('./FundamentalAccountingConcepts.js');
const utils = require('./utils');

const MS_IN_A_DAY = 24 * 60 * 60 * 1000;
class XBRL {
  constructor() {
    this.document = '';
    this.fields = {};
  }

  async parseFile(filePath) {
    return this.parseStr(await fs.readFile(filePath, 'utf8'));
  }

  async parseStr(string) {
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
    if (!currentYearEnd) throw new Error('No end year found');

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

    return this.fields;
  }

  getYear() {
    const currentEnd = this.fields['DocumentPeriodEndDate'];
    const currentYear = this.fields['DocumentFiscalYearFocus'];

    if (utils.canConstructDateWithMultipleComponents(currentEnd, currentYear)) {
      return utils.constructDateWithMultipleComponents(currentEnd, currentYear);
    }

    if (!/Invalid date/.test(new Date(currentEnd))) return currentEnd;

    throw new Error(`${currentEnd} is not a date!`);
  }

  loadField(concept, fieldName = concept, key = '$t') {
    this.fields[fieldName] = utils.getPropertyFrom(this.document, concept, key);
  }

  getContext(object) {
    const paths = ['xbrli:context', 'context'];
    return utils.getVariable(object, paths);
  }

  searchContext(object) {
    const paths = ['xbrli:context', 'context'];
    return utils.searchVariable(object, paths);
  }

  getEndDate(object) {
    const paths = [
      ['xbrli:period', 'xbrli:endDate'],
      ['period', 'endDate']
    ];
    return utils.getVariable(object, paths);
  }

  hasExplicitMember(object) {
    const paths = [
      ['xbrli:entity', 'xbrli:segment', 'xbrldi:explicitMember'],
      ['entity', 'segment', 'explicitMember']
    ];
    return utils.getVariable(object, paths);
  }

  getStartDate(object) {
    const paths = [
      ['xbrli:period', 'xbrli:startDate'],
      ['period', 'startDate']
    ];
    return utils.getVariable(object, paths);
  }

  getNodeList(names) {
    const allNodes = [];

    for (const name of names) {
      allNodes.push(...utils.search(this.document, name));
    }

    return allNodes.flat().filter(n => typeof n !== 'undefined');
  }

  getContextForDurations(endDate) {
    let contextForDurations = null;
    let startDateYTD = '2099-01-01';
    const contexts =
      this.getContext(this.document) ?? this.searchContext(this.document);

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
            utils.isSameDate(this.getEndDate(context), endDate, MS_IN_A_DAY) &&
            !this.hasExplicitMember(context)
        )
        .forEach(context => {
          const startDate = this.getStartDate(context);
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

  getContextForInstants(endDate) {
    let contextForInstants = null;
    const contexts =
      this.getContext(this.document) ?? this.searchContext(this.document);

    // Uses the concept ASSETS to find the correct instant context
    const nodes = this.getNodeList([
      'us-gaap:Assets',
      'us-gaap:AssetsCurrent',
      'us-gaap:LiabilitiesAndStockholdersEquity'
    ]);

    for (const node of nodes) {
      contexts
        .filter(
          context =>
            context.id === node.contextRef &&
            utils.isSameDate(
              this.getContextInstant(context),
              endDate,
              MS_IN_A_DAY
            ) &&
            !this.hasExplicitMember(context)
        )
        .forEach(context => {
          contextForInstants = context.id;
        });
    }

    if (contextForInstants !== null) {
      return contextForInstants;
    }
    return this.lookForAlternativeInstantsContext();
  }

  getContextInstant(object) {
    const paths = [
      ['xbrli:period', 'xbrli:instant'],
      ['period', 'instant']
    ];
    return utils.getVariable(object, paths);
  }

  lookForAlternativeInstantsContext() {
    let altContextId = null;
    let altNodesArr = _.filter(
      _.get(this.document, [
        'xbrli:context',
        'xbrli:period',
        'xbrli:instant'
      ]) || _.get(this.document, ['context', 'period', 'instant']),
      function (node) {
        if (node === this.fields['BalanceSheetDate']) {
          return true;
        }
      }
    );

    for (let h = 0; h < altNodesArr.length; h++) {
      _.forEach(_.get(this.document, ['us-gaap:Assets']), function (node) {
        if (node.contextRef === altNodesArr[h].id) {
          altContextId = altNodesArr[h].id;
        }
      });
    }
    return altContextId;
  }

  getFactValue(concept, periodType) {
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

    _.forEach(utils.search(this.document, concept), function (node) {
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
      factValue = parseFloat(utils.formatNumber(factNode.format, factValue));
    }

    const scale = parseInt(factNode.scale) || 0;
    return factValue * 10 ** scale;
  }
}

module.exports = XBRL;
