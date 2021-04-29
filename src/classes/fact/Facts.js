import { Fact } from './Fact.js';
export class Facts {
  #facts;
  #contexts;
  constructor(facts, contexts) {
    const toHashMap = (hashMap, b) => ({ ...hashMap, [b.id]: b });
    this.#contexts = contexts.filter(c => !c.hasExplicitMember()).reduce(toHashMap, {});
    this.#facts = facts
      .filter(f => this.#contexts[f.contextRef])
      .map(f => new Fact(f, this.#contexts[f.contextRef]));
  }

  get facts() {
    return this.#facts;
  }

  getMostRecent() {
    if (this.#facts.length === 0) return null;
    return this.#facts.reduce(Fact.latest);
  }
}
