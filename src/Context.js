import { getVariable } from './utils.js';
const MS_IN_A_DAY = 24 * 60 * 60 * 1000;

export class Context {
  #context;
  constructor(context) {
    this.#context = context;
  }

  get id() {
    return this.#context.id;
  }

  isDuration() {
    return !this.isInstant();
  }

  isInstant() {
    try {
      this.getInstant();
      return true;
    } catch (ex) {
      if (/No instant found/.test(ex)) return false;

      throw ex;
    }
  }

  getStartDate() {
    if (this.isInstant()) return this.getInstant();

    const paths = [
      ['xbrli:period', 'xbrli:startDate'],
      ['period', 'startDate']
    ];
    const startDate = getVariable(this.#context, paths);
    if (startDate) return new Date(startDate);

    throw new Error('No start date found!');
  }

  getEndDate() {
    if (this.isInstant()) return this.getInstant();

    const paths = [
      ['xbrli:period', 'xbrli:endDate'],
      ['period', 'endDate']
    ];
    const endDate = getVariable(this.#context, paths);
    if (endDate) return new Date(endDate);

    throw new Error('No end date found!');
  }

  getInstant() {
    const paths = [
      ['xbrli:period', 'xbrli:instant'],
      ['period', 'instant']
    ];
    const instant = getVariable(this.#context, paths);
    if (instant) return new Date(instant);

    throw new Error('No instant found!');
  }

  isSameDate(date, epsilon = 0) {
    return Math.abs(this.getEndDate() - new Date(date)) <= epsilon;
  }

  hasExplicitMember() {
    if (this.getExplicitMember()) return true;
    return false;
  }

  getExplicitMember() {
    const paths = [
      ['xbrli:entity', 'xbrli:segment', 'xbrldi:explicitMember'],
      ['entity', 'segment', 'explicitMember']
    ];
    return getVariable(this.#context, paths);
  }

  represents(node, date) {
    return (
      this.id === node.contextRef &&
      this.isSameDate(date, MS_IN_A_DAY) &&
      !this.hasExplicitMember()
    );
  }

  startsBefore(date) {
    return this.getStartDate() <= new Date(date);
  }
}
