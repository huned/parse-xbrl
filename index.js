//const { try } = require('bluebird');

(function () {
  'use strict';
  const MS_IN_A_DAY = 24 * 60 * 60 * 1000;

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
        .catch((err) => {
          console.error(err);
          reject('Problem with reading file');
        });
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
    this.lookForAlternativeInstanceContext = lookForAlternativeInstanceContext.bind(
      this
    );

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

    _.forEach(search(this.documentJson, concept), function (node) {
      if (node.contextRef === contextReference) {
        factNode = node;
      }
    });

    if (!factNode) {
      return null;
    }

    factValue = factNode['$t'];
    for (const key in factNode) {
      if (key.includes('nil')) {
        factValue = 0;
      }
    }

    if (typeof factValue === 'string') {
      factValue = parseFloat(factValue);
    }

    const scalingFactor = findScaleFactor(factNode) || 1;
    return factValue * scalingFactor;
  }

  //TODO: find better name for this function
  //isDateWithYearMonthDayFormat() is horrible...
  function findScaleFactor(factNode) {
    if (!factNode.scale) {
      return 1;
    }
    const scalePower = Number(factNode.scale);
    return 10 ** scalePower;
  }
  function matchDateWithRegEx(date) {
    return date.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  }

  function constructDateWithMultipleComponents(monthDay, year) {
    try {
      return new Date(monthDay + year).toISOString().split('T')[0];
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
    const periods =
      getContext(this.documentJson) ?? searchContext(this.documentJson);

    // Uses the concept ASSETS to find the correct instance context
    const nodes = this.getNodeList([
      'us-gaap:Assets',
      'us-gaap:AssetsCurrent',
      'us-gaap:LiabilitiesAndStockholdersEquity'
    ]);

    for (const node of nodes) {
      periods
        .filter((period) => {
          return (
            period.id === node.contextRef &&
            isSameDate(getContextInstant(period), endDate, MS_IN_A_DAY) &&
            !instanceHasExplicitMember(period)
          );
        })
        .forEach((period) => {
          contextForInstants = period.id;
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

  //TODO: The second condition has a default value  "false",
  //should we add it? The answer isYes

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
    // return (
    //   _.get(
    //     object,
    //     ['xbrli:entity', 'xbrli:segment', 'xbrldi:explicitMember'],
    //     false
    //   ) || _.get(object, ['entity', 'segment', 'explicitMember'], false)
    // );
  }

  //TODO: what if date can't be found?
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

  function isDifferentDate(a, b, epsilon) {
    return !isSameDate(a, b, epsilon);
  }

  function getContextForDurations(endDate) {
    let contextForDurations = null;
    let startDateYTD = '2099-01-01';
    const context =
      getContext(this.documentJson) ?? searchContext(this.documentJson);

    const durationNodes = this.getNodeList([
      'us-gaap:CashAndCashEquivalentsPeriodIncreaseDecrease',
      'us-gaap:CashPeriodIncreaseDecrease',
      'us-gaap:NetIncomeLoss',
      'dei:DocumentPeriodEndDate'
    ]);

    for (let k = 0; k < durationNodes.length; k++) {
      const contextId = durationNodes[k].contextRef;
      _.forEach(context, function (period) {
        if (period.id !== contextId) return;
        const contextPeriod = getEndDate(period);
        if (isDifferentDate(contextPeriod, endDate, MS_IN_A_DAY)) return;
        if (durationHasExplicitMember(period)) return;

        const startDate = getStartDate(period);

        if (new Date(startDate) <= new Date(startDateYTD)) {
          startDateYTD = startDate;
          contextForDurations = _.get(period, 'id');
        }
      });
    }

    return {
      contextForDurations: contextForDurations,
      incomeStatementPeriodYTD: startDateYTD
    };
  }

  function lookForAlternativeInstanceContext() {
    var altContextId = null;
    var altNodesArr = _.filter(
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
  exports.getContextForDurations = getContextForDurations;
})();
