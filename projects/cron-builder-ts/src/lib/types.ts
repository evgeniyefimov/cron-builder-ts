export const MINUTE = "minute";
export const HOUR = "hour";
export const DAY_OF_THE_MONTH = "dayOfTheMonth";
export const MONTH = "month";
export const DAY_OF_THE_WEEK = "dayOfTheWeek";

export type MeasureOfTime = typeof MINUTE | typeof HOUR | typeof DAY_OF_THE_MONTH | typeof MONTH | typeof DAY_OF_THE_WEEK;

export interface Expression {
  [MINUTE]: string[];
  [HOUR]: string[];
  [DAY_OF_THE_MONTH]: string[];
  [MONTH]: string[];
  [DAY_OF_THE_WEEK]: string[];
}

export interface ExpandedExpression {
  [MINUTE]: number[];
  [HOUR]: number[];
  [DAY_OF_THE_MONTH]: number[];
  [MONTH]: number[];
  [DAY_OF_THE_WEEK]: number[];
}

export const DEFAULT_INTERVAL = ['*'];

/**
 * Contains the position-to-name mapping of the cron expression
 * @type {Array}
 * @const
 */
export const MEASURE_OF_TIME_MAP: ReadonlyArray<MeasureOfTime> = [
  MINUTE,
  HOUR,
  DAY_OF_THE_MONTH,
  MONTH,
  DAY_OF_THE_WEEK,
];
