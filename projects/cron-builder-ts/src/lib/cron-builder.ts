import { CronValidator } from './cron-validator';
import { DEFAULT_INTERVAL, Expression, MEASURE_OF_TIME_MAP } from './types';

/**
 * Initializes a CronBuilder with an optional initial cron expression.
 * @param {String=} initialExpression - if provided, it must be up to 5 space delimited parts
 * @throws {Error} if the initialExpression is bogus
 * @constructor
 */
export class CronBuilder {
  private expression: Expression;

  constructor(initialExpression?: string) {
    // var splitExpression;
    // var expression;

    if (initialExpression) {
      CronValidator.validateString(initialExpression);

      const splitExpression = initialExpression.split(' ');
      // check to see if initial expression is valid

      this.expression = {
        minute: splitExpression[0] ? [splitExpression[0]] : DEFAULT_INTERVAL,
        hour: splitExpression[1] ? [splitExpression[1]] : DEFAULT_INTERVAL,
        dayOfTheMonth: splitExpression[2] ? [splitExpression[2]] : DEFAULT_INTERVAL,
        month: splitExpression[3] ? [splitExpression[3]] : DEFAULT_INTERVAL,
        dayOfTheWeek: splitExpression[4] ? [splitExpression[4]] : DEFAULT_INTERVAL,
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
   * @returns {string} - working cron expression
   */
  public build(): string {
    return [
      this.expression.minute.join(','),
      this.expression.hour.join(','),
      this.expression.dayOfTheMonth.join(','),
      this.expression.month.join(','),
      this.expression.dayOfTheWeek.join(','),
    ].join(' ');
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
   * @returns {!String} comma separated blah blah
   * @throws {Error} if the measureOfTime is not one of the permitted values.
   */
  public get(measureOfTime: keyof Expression): string {
    if (!this.expression[measureOfTime]) {
      throw new Error(`Invalid measureOfTime: Valid options are: ${MEASURE_OF_TIME_MAP.join(', ')}`);
    }

    return this.expression[measureOfTime].join(',');
  }

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
  public getAll(): Expression {
    return this.expression;
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

    this.expression = expToSet;
  }
}
