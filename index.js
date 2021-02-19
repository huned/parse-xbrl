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

      var currentYearEnd = this.loadYear();
      if (currentYearEnd) {
        var durations = this.getContextForDurations(currentYearEnd);

        this.fields['BalanceSheetDate'] = durations.balanceSheetDate;
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
    var contextForInstants = null;

    // Uses the concept ASSETS to find the correct instance context
    var instanceNodesArr = this.getNodeList([
      'us-gaap:Assets',
      'us-gaap:AssetsCurrent',
      'us-gaap:LiabilitiesAndStockholdersEquity'
    ]);

    for (var i = 0; i < instanceNodesArr.length; i++) {
      const contextId = instanceNodesArr[i].contextRef;
      _.forEach(getContext(this.documentJson), function (period) {
        if (period.id !== contextId) {
          return;
        }
        if (getContextPeriod(period) !== endDate) {
          return;
        }
        if (instanceHasExplicitMember(period)) {
          return;
        }
        contextForInstants = contextId;
      });
    }

    if (contextForInstants !== null) {
      return contextForInstants;
    }
    return this.lookForAlternativeInstanceContext();
  }

  function getVariable(object, conditions) {
    for (let condition of conditions) {
      if (_.get(object, condition)) return _.get(object, condition);
    }
    return null;
  }

  function getContextPeriod(object) {
    let conditions = [
      ['xbrli:period', 'xbrli:instant'],
      ['period', 'instant']
    ];
    return getVariable(object, conditions);
  }
  function getContext(object) {
    let conditions = ['xbrli:context', 'context'];
    return getVariable(object, conditions);
  }

  function getEndDate(object) {
    let conditions = [
      ['xbrli:period', 'xbrli:endDate'],
      ['period', 'endDate']
    ];
    return getVariable(object, conditions);
  }

  //TODDO: The second condition has  a  default value  "false",
  // should  we  need to add  it?

  function instanceHasExplicitMember(object) {
    let conditions = [
      ['xbrli:entity', 'xbrli:segment', 'xbrldi:explicitMember'],
      ['entity', 'segment', 'explicitMember']
    ];
    return getVariable(object, conditions);
  }
  function durationHasExplicitMember(object) {
    let conditions = [
      ['xbrli:entity', 'xbrli:segment', 'xbrldi:explicitMember'],
      ['entity', 'segment', 'explicitMember']
    ];
    return getVariable(object, conditions);
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
    let conditions = [
      ['xbrli:period', 'xbrli:startDate'],
      ['period', 'startDate']
    ];
    return getVariable(object, conditions);
  }

  function getContextForDurations(endDate) {
    let contextForDurations = null;
    let startDateYTD = '2099-01-01';

    const durationNodes = this.getNodeList([
      'us-gaap:CashAndCashEquivalentsPeriodIncreaseDecrease',
      'us-gaap:CashPeriodIncreaseDecrease',
      'us-gaap:NetIncomeLoss',
      'dei:DocumentPeriodEndDate'
    ]);

    for (let k = 0; k < durationNodes.length; k++) {
      const contextId = durationNodes[k].contextRef;
      _.forEach(getContext(this.documentJson), function (period) {
        if (period.id !== contextId) return;

        const contextPeriod = getEndDate(period);

        if (contextPeriod !== endDate) return;

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
})();
