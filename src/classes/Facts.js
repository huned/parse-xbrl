export class Fact {
  #value;
  #context;
  constructor(fact) {
    this.fact = fact;
  }

  get value() {
    return this.#value;
  }

  get context() {
    return this.#context;
  }
}

export class Facts {
  #facts;
  constructor(facts) {
    this.#facts = facts.map(f => new Fact(f));
  }
}
