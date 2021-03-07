const fs = require('fs').promises;
const _ = require('lodash');
const xmlParser = require('xml2json');
const FundamentalAccountingConcepts = require('./FundamentalAccountingConcepts.js');

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

    const durations = this.getContextForDurations(currentYearEnd);

    this.fields['IncomeStatementPeriodYTD'] = getPropertyFrom(
      durations,
      'incomeStatementPeriodYTD'
    );
    this.fields['ContextForInstants'] = this.getContextForInstants(
      currentYearEnd
    );
    this.fields['ContextForDurations'] = getPropertyFrom(
      durations,
      'contextForDurations'
    );
    this.fields['BalanceSheetDate'] = currentYearEnd;

    // Load the rest of the facts
    FundamentalAccountingConcepts.load(this);

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
    this.fields[fieldName] = this.getPropertyFrom(
      this.document,
      conceptToFind,
      fieldName,
      key
    );
  }
}
