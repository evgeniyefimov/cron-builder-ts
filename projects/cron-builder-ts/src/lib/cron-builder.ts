import * as Cron from "cron-converter";

import { CronValidator } from './cron-validator';
import { DEFAULT_INTERVAL, ExpandedExpression, Expression, MEASURE_OF_TIME_MAP } from './types';
import { keys } from './utils';

/**
 * Initializes a CronBuilder with an optional initial cron expression.
 * @param {String=} initialExpression - if provided, it must be up to 5 space delimited parts
 * @throws {Error} if the initialExpression is bogus
 * @constructor
 */
export class CronBuilder {
  private readonly expression: Expression;

  constructor(initialExpression: string = "* * * * *") {
    if (initialExpression) {
      CronValidator.validateString(initialExpression);

      const splitExpression = initialExpression.split(' ');

      this.expression = {
        minute: splitExpression[0] ? splitExpression[0].split(",") : DEFAULT_INTERVAL,
        hour: splitExpression[1] ? splitExpression[1].split(",") : DEFAULT_INTERVAL,
        dayOfTheMonth: splitExpression[2] ? splitExpression[2].split(",") : DEFAULT_INTERVAL,
        month: splitExpression[3] ? splitExpression[3].split(",") : DEFAULT_INTERVAL,
        dayOfTheWeek: splitExpression[4] ? splitExpression[4].split(",") : DEFAULT_INTERVAL,
      };
    } else {
      this.expression = {
        minute: DEFAULT_INTERVAL,
        hour: DEFAULT_INTERVAL,
        dayOfTheMonth: DEFAULT_INTERVAL,
        month: DEFAULT_INTERVAL,
        dayOfTheWeek: DEFAULT_INTERVAL,
      };
    }
  }

  /**
   * builds a working cron expression based on the state of the cron object
   * @param {!Object} [options] - customize how to build cron string
   * @param {!Boolean} [options.plain=true] - get cron string as it is, otherwise build short cron string.
   * if false: * 13 * 1-6 0,1,2,3,5,6 ---> * 13 * 1-6 0-3,5-6
   * @param {!Boolean} [options.outputWeekdayNames=false] - changes the numbers to 3 letter weekday names.
   * if true: *\/5 9-17/2 * 1-3 1-5 ---> *\/5 *(10-16)/2 * JAN-MAR MON-FRI
   * @param {!Boolean} [options.outputMonthNames=false] - changes the numbers to 3 letter month names.
   * if true: *\/5 9-17/2 * 1-3 1-5 ---> *\/5 *(10-16)/2 * JAN-MAR MON-FRI
   * @param {!Boolean} [options.outputHashes=false] - changes the * to H.
   * if true: *\/5 9-17/2 * 1-3 1-5 ---> H/5 H(10-16)/2 H 1-3 1-5
   * @returns {string} - working cron expression
   */
  public build(options?: { plain: boolean | undefined } & Omit<Cron.Options, "timezone">): string {
    const {
      plain,
    } = options ?? { plain: true };

    const cronString = [
      this.expression.minute.join(','),
      this.expression.hour.join(','),
      this.expression.dayOfTheMonth.join(','),
      this.expression.month.join(','),
      this.expression.dayOfTheWeek.join(','),
    ].join(' ');

    if (plain) {
      return cronString;
    }

    const cronInstance = new Cron(options);
    cronInstance.fromString(cronString);

    return cronInstance.toString();
  }


  /**
   * adds a value to what exists currently (builds)
   * @param {!String} measureOfTime
   * @param {!String} value
   * @throws {Error} if measureOfTime or value fail validation
   */
  public addValue(measureOfTime: keyof Expression, value: string): void {
    CronValidator.validateValue(measureOfTime, value);

    if (this.expression[measureOfTime].length === 1 && this.expression[measureOfTime][0] === '*') {
      this.expression[measureOfTime] = [value];
    } else {
      if (this.expression[measureOfTime].indexOf(value) < 0) {
        this.expression[measureOfTime].push(value);
      }
    }
  };

  /**
   * removes a single explicit value (subtracts)
   * @param {!String} measureOfTime - as you might guess
   * @param {!String} value - the offensive value
   * @throws {Error} if measureOfTime is bogus.
   */
  public removeValue(measureOfTime: keyof Expression, value: string): void {
    if (!this.expression[measureOfTime]) {
      throw new Error(`Invalid measureOfTime: Valid options are: ${MEASURE_OF_TIME_MAP.join(', ')}`);
    }

    if (this.expression[measureOfTime].length === 1 && this.expression[measureOfTime][0] === '*') {
      console.log('The value for "' + measureOfTime + '" is already at the default value of "*" - this is a no-op.');

      return;
    }

    this.expression[measureOfTime] = this.expression[measureOfTime].filter((timeValue) => {
      return value !== timeValue;
    });

    if (!this.expression[measureOfTime].length) {
      this.expression[measureOfTime] = DEFAULT_INTERVAL;
    }
  };

  /**
   * returns the current state of a given measureOfTime
   * @param {!String} measureOfTime one of "minute", "hour", etc
   * @returns {!Array.number} comma separated blah blah
   * @throws {Error} if the measureOfTime is not one of the permitted values.
   */
  public get(measureOfTime: keyof Expression, options: { expand: true }): number[]
  /**
   * returns the current state of a given measureOfTime
   * @param {!String} measureOfTime one of "minute", "hour", etc
   * @returns {!String} comma separated blah blah
   * @throws {Error} if the measureOfTime is not one of the permitted values.
   */
  public get(measureOfTime: keyof Expression, options?: { expand: false }): string
  public get(measureOfTime: keyof Expression, options?: { expand: boolean }): string | number[] {
    if (!this.expression[measureOfTime]) {
      throw new Error(`Invalid measureOfTime: Valid options are: ${MEASURE_OF_TIME_MAP.join(', ')}`);
    }

    const {
      expand,
    } = options ?? { expand: false };

    if (!expand) {
      return this.expression[measureOfTime].join(',');
    }

    const expression = this.getAll({ expand });

    return expression[measureOfTime];
  }

  /**
   * Returns a rich object that describes the current state of the cron expression.
   * @returns {!{
   *  minute: Array.number,
   *  hour: Array.number,
   *  dayOfTheMonth: Array.number,
   *  month: Array.number,
   *  dayOfTheWeek: Array.number,
   * }}
   */
  public getAll(options: { expand: true }): ExpandedExpression
  /**
   * Returns a rich object that describes the current state of the cron expression.
   * @returns {!{
   *  minute: Array.string,
   *  hour: Array.string,
   *  dayOfTheMonth: Array.string,
   *  month: Array.string,
   *  dayOfTheWeek: Array.string,
   * }}
   */
  public getAll(options?: { expand: false }): Expression
  public getAll(options?: { expand: boolean }): Expression | ExpandedExpression {
    const {
      expand,
    } = options ?? { expand: false };

    if (!expand) {
      return this.expression;
    }

    const cronString = this.build({ plain: true });
    const cronInstance = new Cron();
    cronInstance.fromString(cronString);
    const cronArray = cronInstance.toArray();

    return {
      minute: cronArray[0],
      hour: cronArray[1],
      dayOfTheMonth: cronArray[2],
      month: cronArray[3],
      dayOfTheWeek: cronArray[4],
    }
  }

  /**
   * sets the state of a given measureOfTime
   * @param {!String} measureOfTime - yup
   * @param {!Array.<String>} value - the 5 tuple array of values to set
   * @returns {!String} the comma separated version of the value that you passed in
   * @throws {Error} if your "value" is not an Array&lt;String&gt;
   * @throws {Error} when any item in your value isn't a legal cron-ish descriptor
   */
  public set(measureOfTime: keyof Expression, value: string[]): string {
    if (!Array.isArray(value)) {
      throw new Error('Invalid value; Value must be in the form of an Array.');
    }

    for (const item of value) {
      CronValidator.validateValue(measureOfTime, item);
    }

    this.expression[measureOfTime] = value;

    return this.expression[measureOfTime].join(',');
  }

  /**
   * sets the state for the entire cron expression
   * @param {!{
   *  minute: Array.string,
   *  hour: Array.string,
   *  dayOfTheMonth: Array.string,
   *  month: Array.string,
   *  dayOfTheWeek: Array.string,
   * }} expToSet - the entirety of the cron expression.
   * @throws {Error} as usual
   */
  public setAll(expToSet: Expression): void {
    CronValidator.validateExpression(expToSet);

    keys(this.expression).forEach((key) => this.expression[key] = expToSet[key])
  }
}
