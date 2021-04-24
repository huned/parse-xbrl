import { Fact } from './Fact.js';
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
