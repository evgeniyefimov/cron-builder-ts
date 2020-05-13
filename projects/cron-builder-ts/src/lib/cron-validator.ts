import { Expression, MEASURE_OF_TIME_MAP } from './types';
import { keys } from './utils';

export class CronValidator {
  /**
   * validates a given cron expression (object) for length, then calls validateValue on each value
   * @param {!{
   *  minute: Array.string,
   *  hour: Array.string,
   *  dayOfTheMonth: Array.string,
   *  month: Array.string,
   *  dayOfTheWeek: Array.string,
   * }} expression - rich object containing the state of the cron expression
   * @throws {Error} if expression contains more than 5 keys
   */
  public static validateExpression(expression: Expression): void {
    // don't care if it's less than 5, we'll just set those to the default '*'
    if (keys(expression).length > MEASURE_OF_TIME_MAP.length) {
      throw new Error(`Invalid cron expression; limited to ${MEASURE_OF_TIME_MAP.length} values.`);
    }

    keys(expression).forEach((key) => {
      expression[key].forEach((value) => {
        CronValidator.validateValue(key, value);
      });
    });
  }

  /**
   * validates a given cron expression (string) for length, then calls validateValue on each value
   * @param {!String} expression - an optionally empty string containing at most 5 space delimited expressions.
   * @throws {Error} if the string contains more than 5 space delimited parts.
   */
  public static validateString(expression: string): void {
    const splitExpression = expression.split(' ');

    if (splitExpression.length > MEASURE_OF_TIME_MAP.length) {
      throw new Error(`Invalid cron expression; limited to ${MEASURE_OF_TIME_MAP.length} values.`);
    }

    for (let i = 0; i < splitExpression.length; i += 1) {
      CronValidator.validateValue(MEASURE_OF_TIME_MAP[i], splitExpression[i]);
    }
  }

  /**
   * validates any given measureOfTime and corresponding value
   * @param {!String} measureOfTime - as expected
   * @param {!String} value - the cron-ish interval specifier
   * @throws {Error} if measureOfTime is bogus
   * @throws {Error} if value contains an unsupported character
   */
  public static validateValue(measureOfTime: keyof Expression, value: string): void {
    const validatorObj = {
      minute: { min: 0, max: 59 },
      hour: { min: 0, max: 23 },
      dayOfTheMonth: { min: 1, max: 31 },
      month: { min: 1, max: 12 },
      dayOfTheWeek: { min: 0, max: 7 }
    };

    const validChars = /^[0-9*-]/;

    if (!validatorObj[measureOfTime]) {
      throw new Error(`Invalid measureOfTime; Valid options are: ${MEASURE_OF_TIME_MAP.join(', ')}`);
    }

    if (!validChars.test(value)) {
      throw new Error('Invalid value; Only numbers 0-9, "-", and "*" chars are allowed');
    }

    if (value === '*') {
      return;
    }

    // check to see if value is within range if value is not '*'
    if (value.indexOf('-') >= 0) {
      // value is a range and must be split into high and low
      const rangeArray: ReadonlyArray<number | undefined> = value
        .split('-')
        .map((range) => parseInt(range, 10))
        .filter((range) => isNaN(range) === false);

      const [rangeMin, rangeMax] = rangeArray;

      if (typeof rangeMin !== "number" || rangeMin < validatorObj[measureOfTime].min) {
        throw new Error(`Invalid value; bottom of range is not valid for \\"${measureOfTime}\\". Limit is ${validatorObj[measureOfTime].min}.`);
      }

      if (typeof rangeMax !== "number" || rangeMax > validatorObj[measureOfTime].max) {
        throw new Error(`Invalid value; top of range is not valid for \\"${measureOfTime}\\". Limit is ${validatorObj[measureOfTime].max}.`);
      }
    } else {
      if (parseInt(value) < validatorObj[measureOfTime].min) {
        throw new Error(`Invalid value; given value is not valid for \\"${measureOfTime}\\". Minimum value is \\"${validatorObj[measureOfTime].min}\\".`);
      }

      if (parseInt(value) > validatorObj[measureOfTime].max) {
        throw new Error(`Invalid value; given value is not valid for \\"${measureOfTime}\\". Maximum value is \\"${validatorObj[measureOfTime].max}\\".`);
      }
    }
  }
}
