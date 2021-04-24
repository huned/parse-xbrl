import { formatNumber } from '../../utils/utils.js';

export class Fact {
  #context;
  #fact;

  constructor(fact, contexts) {
    this.#fact = fact;
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

  get context() {
    return this.#context;
  }

  get contextRef() {
    return this.#fact.contextRef;
  }

  static latest(a, b) {
    if (!(a instanceof Fact) || !(b instanceof Fact)) {
      throw new TypeError('Arguments are not instances of the Fact class!');
    }

    if (a.context.endsBefore(b.context.getEndDate())) return b;
    return a;
  }
}
