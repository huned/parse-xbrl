const _ = require('lodash');

function search(object, target) {
  const result = [];

  Object.keys(object).forEach(key => {
    if (key === target) {
      return result.push(object[key]);
    }

    if (object[key]['name'] === target) {
      return result.push(object[key]);
    }

    if (typeof object[key] === 'object') {
      return result.push(search(object[key], target));
    }
  });

  return result.flat();
}

function getPropertyFrom(object, conceptToFind, key = '$t') {
  let concept = search(object, 'dei:' + conceptToFind);
  if (Array.isArray(concept)) {
    concept = _.find(concept, (conceptInstance, idx) => idx === 0);
  }
  return _.get(concept, key, 'Field not found');
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

module.exports = {
  search,
  getPropertyFrom,
  constructDateWithMultipleComponents,
  canConstructDateWithMultipleComponents,
  getNodeList
};
