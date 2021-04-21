import { formatNumber } from '../utils/utils.js';

export class Fact {
  #context;

  constructor(fact, contexts) {
    this.fact = fact;
    this.#context = contexts[fact.contextRef];
  }

  get value() {
    if (Object.keys(this).some(k => k.includes('nil'))) return 0;

    const scale = parseInt(this.scale) || 0;

    if (typeof this.$t === 'string') {
      return parseFloat(formatNumber(this.format, this.$t)) * 10 ** scale;
    }

    return this.$t * 10 ** scale;
  }

  get unit() {
    return this.fact.unitRef;
  }

  get context() {
    return this.#context;
  }
  get name() {
    return this.fact.name;
  }

  get contextRef() {
    return this.fact.contextRef;
  }
}

export class Facts {
  #facts;
  #contexts;
  constructor(facts, contexts) {
    this.#contexts = contexts.reduce((a, b) => ({ ...a, [b.id]: b }), {});
    this.#facts = facts.map(f => new Fact(f, this.#contexts));
  }

  get facts() {
    return this.#facts;
  }

  getMostRecent() {
    if (this.#facts.length === 0) return null;

    return this.#facts.reduce(function (previousValue, currentValue, index, array) {
      if (previousValue.context.endsBefore(currentValue.context.getEndDate())) return currentValue;

      return previousValue;
    });
  }
}
