export class Fact {
  #context;
  constructor(fact) {
    this.fact = fact;
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

  updateContext(contextRef) {
    this.#context = contextRef[this.contextRef];
  }
}

export class Facts {
  #facts;
  constructor(facts, contexts) {
    this.#facts = facts.map(f => new Fact(f));
  }

  get facts() {
    return this.#facts;
  }

  updateContexts(contextRef) {
    this.#facts.map(f => f.updateContext(contextRef));
  }
}
