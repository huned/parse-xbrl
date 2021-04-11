import _ from 'lodash';

export function search(object, target) {
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

export function getPropertyFrom(object, conceptToFind, key = '$t') {
  const concept = search(object, 'dei:' + conceptToFind).shift();
  return _.get(concept, key, 'Field not found');
}

export function constructDateWithMultipleComponents(monthDay, year) {
  try {
    return new Date(monthDay + year).toISOString();
  } catch (err) {
    throw new Error(
      `Cannot construct proper date with ${monthDay} and ${year}`
    );
  }
}

export function canConstructDateWithMultipleComponents(monthDay, year) {
  try {
    constructDateWithMultipleComponents(monthDay, year);
    return true;
  } catch (ex) {
    return false;
  }
}

export function getNodeList(nodeNamesArr, root) {
  root = root || this.documentJson;
  let allNodes = [];

  for (let i = 0; i < nodeNamesArr.length; i++) {
    allNodes = allNodes.concat(search(root, nodeNamesArr[i]));
  }
  allNodes = allNodes.flat();

  // Remove undefined nodes
  return allNodes.filter(node => typeof node);
}

export function isSameDate(a, b, epsilon = 0) {
  return Math.abs(new Date(a) - new Date(b)) <= epsilon;
}

export function getVariable(object, paths, defaultValue) {
  return findVariable(object, paths, _.get);
}

export function searchVariable(object, paths) {
  return findVariable(object, paths, search);
}

export function findVariable(object, paths, cb) {
  for (let path of paths) {
    const result = cb(object, path);
    if (result) return result;
  }
  return null;
}

export function formatNumber(format, number) {
  if (!format) return number;

  if (format === 'ixt:numdotdecimal') {
    return number.replace(/,/g, '');
  } else if (format === 'ixt:numcommadecimal') {
    return number.replace(/\./g, '').replace(/,/g, '.');
  }
  throw new Error(`Unknown format: ${format}`);
}
