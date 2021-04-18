import { search } from '../utils/utils.js';

class Instant {
  #value;
  constructor(instant) {
    this.#value = new Date(instant);
  }
  get value() {
    return this.#value;
  }
}

class Period {
  #start;
  #end;
  constructor(start, end) {
    this.#start = new Date(start);
    this.#end = new Date(end);
  }
  get start() {
    return this.#start;
  }
  get end() {
    return this.#end;
  }
}

export class ContextRef {
  constructor(document) {
    this.document = document;
  }

  getReferences() {
    const contextDict = search(this.document, 'xbrli:context').reduce(
      (a, b) => ({ ...a, [b.id]: this.getDates(b['xbrli:period']) }),
      {}
    );
    return contextDict;
  }

  getDates(xbrliPeriod) {
    if (xbrliPeriod['xbrli:instant']) return new Instant(xbrliPeriod['xbrli:instant']);
    return new Period(xbrliPeriod['xbrli:startDate'], xbrliPeriod['xbrli:endDate']);
  }
}
