export class Fact {
  #context;
  constructor(fact, contexts) {
    this.fact = fact;
    this.#context = contexts[fact.contextRef];
  }

  get value() {
    return this.fact.$t;
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

  reduce(strategy) {
    if (strategy == 'lastFact') return this.getLastFact();
    throw new Error();
  }

  getLastFact() {
    return this.#facts.reduce(function (previousValue, currentValue, index, array) {
      if (previousValue.context.getEndDate() <= currentValue.context.getEndDate()) return currentValue;
      return previousValue;
    });
  }
}
