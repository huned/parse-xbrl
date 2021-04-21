import { getVariable } from '../utils/utils.js';
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
    if (startDate === null || startDate === undefined) throw new Error('No start date found!');
    if (/Invalid date/.test(new Date(startDate))) throw new Error(`Invalid date: ${startDate}`);

    return startDate;
  }

  getEndDate() {
    if (this.isInstant()) return this.getInstant();

    const paths = [
      ['xbrli:period', 'xbrli:endDate'],
      ['period', 'endDate']
    ];
    const endDate = getVariable(this.#context, paths);
    if (endDate === null || endDate === undefined) throw new Error('No end date found!');
    if (/Invalid date/.test(new Date(endDate))) throw new Error(`Invalid date: ${endDate}`);

    return endDate;
  }

  getInstant() {
    const paths = [
      ['xbrli:period', 'xbrli:instant'],
      ['period', 'instant']
    ];
    const instant = getVariable(this.#context, paths);
    if (instant === null || instant === undefined) throw new Error('No instant found!');
    if (/Invalid date/.test(new Date(instant))) throw new Error(`Invalid date: ${instant}`);

    return instant;
  }

  isSameDate(date, epsilon = 0) {
    return Math.abs(new Date(this.getEndDate()) - new Date(date)) <= epsilon;
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
    return this.id === node.contextRef && this.isSameDate(date, MS_IN_A_DAY) && !this.hasExplicitMember();
  }

  startsBefore(date) {
    return new Date(this.getStartDate()) <= new Date(date);
  }

  endsBefore(date) {
    return new Date(this.getEndDate()) <= new Date(date);
  }
}
