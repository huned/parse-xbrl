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

module.exports = search;
