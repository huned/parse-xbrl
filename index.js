(function () {
  'use strict';

  var Promise = require('bluebird');
  var fs = Promise.promisifyAll(require('fs'));
  var _ = require('lodash');
  var xmlParser = require('xml2json');
  var FundamentalAccountingConcepts = require('./FundamentalAccountingConcepts.js');

  function parse(filePath) {
    return new Promise(function (resolve, reject) {
      // Load xml and parse to json
      fs.readFileAsync(filePath, 'utf8')
        .then((d) => new parseStr(d))
        .then((d) => resolve(d))
        .catch((err) => reject('Problem with reading file', err));
    });
  }

  function parseStr(data) {
    this.loadYear = loadYear.bind(this);
    this.loadField = loadField.bind(this);
    this.getFactValue = getFactValue.bind(this);
    this.documentJson;
    this.fields = {};
    this.getNodeList = getNodeList.bind(this);
    this.getContextForInstants = getContextForInstants.bind(this);
    this.getContextForDurations = getContextForDurations.bind(this);
    this.lookForAlternativeInstanceContext = lookForAlternativeInstanceContext.bind(this);

    return new Promise((resolve, reject) => {
      var jsonObj = JSON.parse(xmlParser.toJson(data));
      this.documentJson = jsonObj[Object.keys(jsonObj)[0]];

      // Calculate and load basic facts from json doc
      //CONTEXT REF MISSING?
      this.loadField('EntityRegistrantName'); // OK
      this.loadField('CurrentFiscalYearEndDate'); //?
      this.loadField('EntityCentralIndexKey'); //OK
      this.loadField('EntityFilerCategory'); //OK
      this.loadField('TradingSymbol'); //OK
      this.loadField('DocumentPeriodEndDate'); //OK
      this.loadField('DocumentFiscalYearFocus'); // GETS SOLVED LATER
      this.loadField('DocumentFiscalPeriodFocus'); //OK
      this.loadField('DocumentFiscalYearFocus', 'DocumentFiscalYearFocusContext', 'contextRef'); // DocumentFiscalYearFocusContext ??
      this.loadField('DocumentFiscalPeriodFocus', 'DocumentFiscalPeriodFocusContext', 'contextRef'); // ??
      this.loadField('DocumentType'); // OK

      var currentYearEnd = this.loadYear();
      if (currentYearEnd) {
        var durations = this.getContextForDurations(currentYearEnd);

        this.fields['BalanceSheetDate'] = durations.balanceSheetDate;
        this.fields['IncomeStatementPeriodYTD'] = durations.incomeStatementPeriodYTD;
        this.fields['ContextForInstants'] = this.getContextForInstants(currentYearEnd);
        this.fields['ContextForDurations'] = durations.contextForDurations;
        this.fields['BalanceSheetDate'] = currentYearEnd;

        // Load the rest of the facts
        FundamentalAccountingConcepts.load(this);
        resolve(this.fields);
      } else {
        reject('No year end found.');
      }
    });
  }
  function search(tree, target) {
    let result = [];

    Object.keys(tree).forEach((key) => {
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
    var concept = search(this.documentJson, 'dei:' + conceptToFind);

    if (conceptToFind === 'DocumentPeriodEndDate') {
      console.log(`${conceptToFind}: `, concept);
    }

    if (Array.isArray(concept)) {
      concept = _.find(concept, function (conceptInstance, idx) {
        return idx === 0;
      });
    }
    this.fields[fieldName] = _.get(concept, key, 'Field not found.');
  }

  function getFactValue(concept, periodType) {
    var contextReference;
    var factNode;
    var factValue;

    if (periodType === 'Instant') {
      contextReference = this.fields['ContextForInstants'];
    } else if (periodType === 'Duration') {
      contextReference = this.fields['ContextForDurations'];
    } else {
      console.warn('CONTEXT ERROR');
    }

    _.forEach(_.get(this.documentJson, concept), function (node) {
      if (node.contextRef === contextReference) {
        factNode = node;
      }
    });

    if (factNode) {
      factValue = factNode['$t'];

      for (var key in factNode) {
        if (key.indexOf('nil') >= 0) {
          factValue = 0;
        }
      }
      if (typeof factValue === 'string') {
        factValue = Number(factValue);
      }
    } else {
      return null;
    }

    return factValue;
  }

  //TODO: find better name for this function
  //isDateWithYearMonthDayFormat() is horrible...
  function matchDateWithRegEx(date) {
    return date.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  }

  function constructDateWithMultipleComponents(monthDay, year) {
    try {
      return new Date(monthDay + year).toISOString().split('T')[0];
    } catch (err) {
      throw new Error(`Cannot construct proper date with ${monthDay} and ${year}`);
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
    var currentEnd = this.fields['DocumentPeriodEndDate'];
    var currentYear = this.fields['DocumentFiscalYearFocus'];

    if (matchDateWithRegEx(currentEnd)) {
      return currentEnd;
    }

    if (canConstructDateWithMultipleComponents(currentEnd, currentYear)) {
      return constructDateWithMultipleComponents(currentEnd, currentYear);
    }

    console.warn(currentEnd + ' is not a date');
    return false;
  }

  function getNodeList(nodeNamesArr, root) {
    root = root || this.documentJson;
    var allNodes = [];

    for (var i = 0; i < nodeNamesArr.length; i++) {
      allNodes = allNodes.concat(_.get(root, nodeNamesArr[i]));
    }

    // Remove undefined nodes
    return _.filter(allNodes, function (node) {
      if (node) {
        return true;
      }
    });
  }

  function getContextForInstants(endDate) {
    var contextForInstants = null;
    var contextId;
    var contextPeriods;
    var contextPeriod;
    var instanceHasExplicitMember;

    // Uses the concept ASSETS to find the correct instance context
    var instanceNodesArr = this.getNodeList([
      'us-gaap:Assets',
      'us-gaap:AssetsCurrent',
      'us-gaap:LiabilitiesAndStockholdersEquity'
    ]);

    for (var i = 0; i < instanceNodesArr.length; i++) {
      contextId = instanceNodesArr[i].contextRef;
      contextPeriods =
        _.get(this.documentJson, 'xbrli:context') || _.get(this.documentJson, 'context');

      _.forEach(contextPeriods, function (period) {
        if (period.id === contextId) {
          contextPeriod =
            _.get(period, ['xbrli:period', 'xbrli:instant']) ||
            _.get(period, ['period', 'instant']);

          if (contextPeriod && contextPeriod === endDate) {
            instanceHasExplicitMember =
              _.get(period, ['xbrli:entity', 'xbrli:segment', 'xbrldi:explicitMember'], false) ||
              _.get(period, ['entity', 'segment', 'explicitMember'], false);
            if (instanceHasExplicitMember) {
              // console.log('Instance has explicit member.');
            } else {
              contextForInstants = contextId;
              // console.log('Use Context:', contextForInstants);
            }
          }
        }
      });
    }

    if (contextForInstants === null) {
      contextForInstants = this.lookForAlternativeInstanceContext();
    }

    return contextForInstants;
  }

  function getContextForDurations(endDate) {
    var contextForDurations = null;
    var contextId;
    var contextPeriod;
    var durationHasExplicitMember;
    var startDateYTD = '2099-01-01';
    var startDate;

    var durationNodesArr = this.getNodeList([
      'us-gaap:CashAndCashEquivalentsPeriodIncreaseDecrease',
      'us-gaap:CashPeriodIncreaseDecrease',
      'us-gaap:NetIncomeLoss',
      'dei:DocumentPeriodEndDate'
    ]);

    for (var k = 0; k < durationNodesArr.length; k++) {
      contextId = durationNodesArr[k].contextRef;

      _.forEach(
        _.get(this.documentJson, 'xbrli:context') || _.get(this.documentJson, 'context'),
        function (period) {
          if (period.id === contextId) {
            contextPeriod =
              _.get(period, ['xbrli:period', 'xbrli:endDate']) ||
              _.get(period, ['period', 'endDate']);

            if (contextPeriod === endDate) {
              durationHasExplicitMember =
                _.get(period, ['xbrli:entity', 'xbrli:segment', 'xbrldi:explicitMember'], false) ||
                _.get(period, ['entity', 'segment', 'explicitMember'], false);

              if (durationHasExplicitMember) {
                // console.log('Duration has explicit member.');
              } else {
                startDate =
                  _.get(period, ['xbrli:period', 'xbrli:startDate']) ||
                  _.get(period, ['period', 'startDate']);

                // console.log('Context start date:', startDate);
                // console.log('YTD start date:', startDateYTD);

                if (startDate <= startDateYTD) {
                  // console.log('Context start date is less than current year to date, replace');
                  // console.log('Context start date: ', startDate);
                  // console.log('Current min: ', startDateYTD);

                  startDateYTD = startDate;
                  contextForDurations = _.get(period, 'id');
                } else {
                  // console.log('Context start date is greater than YTD, keep current YTD');
                  // console.log('Context start date: ', startDate);
                }

                // console.log('Use context ID: ', contextForDurations);
                // console.log('Current min: ', startDateYTD);
                // console.log('');
                // console.log('Use context: ', contextForDurations);
              }
            }
          }
        }
      );
    }

    return {
      contextForDurations: contextForDurations,
      incomeStatementPeriodYTD: startDateYTD
    };
  }

  function lookForAlternativeInstanceContext() {
    var altContextId = null;
    var altNodesArr = _.filter(
      _.get(this.documentJson, ['xbrli:context', 'xbrli:period', 'xbrli:instant']) ||
        _.get(this.documentJson, ['context', 'period', 'instant']),
      function (node) {
        if (node === this.fields['BalanceSheetDate']) {
          return true;
        }
      }
    );

    for (var h = 0; h < altNodesArr.length; h++) {
      _.forEach(_.get(this.documentJson, ['us-gaap:Assets']), function (node) {
        if (node.contextRef === altNodesArr[h].id) {
          altContextId = altNodesArr[h].id;
        }
      });
    }
    return altContextId;
  }

  exports.parse = parse;
  exports.parseStr = parseStr;
  exports.loadField = loadField;
})();
