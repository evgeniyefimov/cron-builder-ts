import { CronBuilder } from './cron-builder';

describe('cron-builder', () => {
  it('defaults to "* * * * *" when initialized without arguments', () => {
    const cron = new CronBuilder();
    expect(cron.get('minute')).toEqual('*');
    expect(cron.get('hour')).toEqual('*');
    expect(cron.get('dayOfTheMonth')).toEqual('*');
    expect(cron.get('month')).toEqual('*');
    expect(cron.get('dayOfTheWeek')).toEqual('*');
  });

  it('should split multiple cron values when initialized with arguments', () => {
    const cron = new CronBuilder("0,15,30,45 * * * *");
    const { minute } = cron.getAll();
    expect(minute).toEqual(["0", "15", "30", "45"]);
  });

  it('should split multiple cron values when initialized with arguments (expanded)', () => {
    const cron = new CronBuilder("0,15,30,45 * * * *");
    const {
      dayOfTheMonth,
      dayOfTheWeek,
      hour,
      minute,
      month,
    } = cron.getAll({ expand: true });

    expect(minute).toEqual([0, 15, 30, 45]);
    expect(hour).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]);
    expect(dayOfTheMonth).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]);
    expect(month).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(dayOfTheWeek).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('returns a working cron expression when calling .build()', () => {
    const cron = new CronBuilder();
    expect(cron.build()).toEqual('* * * * *');
  });

  it('sets a single value', () => {
    const cron = new CronBuilder();
    expect(cron.set('hour', ['5'])).toEqual('5');
    expect(cron.build()).toEqual('* 5 * * *');
  });

  it('sets multiple values at once', () => {
    const cron = new CronBuilder();
    expect(cron.set('minute', ['0', '10', '20', '30', '40', '50'])).toEqual('0,10,20,30,40,50');
    expect(cron.build({ plain: false })).toEqual('*/10 * * * *');
    expect(cron.build()).toEqual('0,10,20,30,40,50 * * * *');
  });

  it('sets a range', () => {
    const cron = new CronBuilder();
    expect(cron.set('dayOfTheWeek', ['5-7'])).toEqual('5-7');
    expect(cron.build({ plain: false })).toEqual('* * * * 0,5-6');
    expect(cron.build()).toEqual('* * * * 5-7');
  });

  it('multiple sets build the cron string accurately', () => {
    const cron = new CronBuilder();
    cron.set('minute', ['10', '30', '50']);
    cron.set('hour', ['6', '18']);
    cron.set('dayOfTheMonth', ['1', '15']);
    cron.set('dayOfTheWeek', ['1-5']);
    expect(cron.build({ plain: false })).toEqual('10-50/20 6,18 1,15 * 1-5');
    expect(cron.build()).toEqual('10,30,50 6,18 1,15 * 1-5');
  });

  it('validates against setting a value that is not a number or range of numbers', () => {
    const cron = new CronBuilder();
    expect(() => { cron.set('hour', ['!']) }).toThrow();
  });

  describe('validates against setting values outside the valid range', () => {
    it('validates against values too low', () => {
      const cron = new CronBuilder();
      expect(() => { cron.set('dayOfTheWeek', ['-1']) }).toThrow();
    });

    it('validates against values too high', () => {
      const cron = new CronBuilder();
      expect(() => { cron.set('hour', ['100']) }).toThrow();
    });

    it('validates against setting a range that is out of bounds', () => {
      const cron = new CronBuilder();
      expect(() => { cron.set('minute', ['20-60']) }).toThrow();

      expect(() => { cron.set('hour', ['12', '22-26', '15']) }).toThrow();
    });
  });

  it('gets a single value', () => {
    const cron = new CronBuilder();
    cron.set('minute', ['30']);
    expect(cron.get('minute')).toEqual('30');
  });

  it('returns the entire expression object when getAll is called', () => {
    const cron = new CronBuilder();
    const getAllResponse = cron.getAll();
    expect(getAllResponse.minute[0]).toEqual('*');
    expect(getAllResponse.hour[0]).toEqual('*');
    expect(getAllResponse.dayOfTheMonth[0]).toEqual('*');
    expect(getAllResponse.month[0]).toEqual('*');
    expect(getAllResponse.dayOfTheWeek[0]).toEqual('*');
  });

  it('sets the entire object when setAll is called', () => {
    const cron = new CronBuilder();
    const getAllResponse = cron.getAll();
    getAllResponse.hour = ['13'];
    getAllResponse.month = ['1-6'];
    getAllResponse.dayOfTheWeek = ['1,3,5,7'];
    cron.setAll(getAllResponse);
    expect(cron.build({ plain: false })).toEqual('* 13 * 1-6 0-1,3,5');
    expect(cron.build()).toEqual('* 13 * 1-6 1,3,5,7');
  });

  it('validates setting with an incorrect value with setAll', () => {
    const cron = new CronBuilder();
    const getAllResponse = cron.getAll();
    getAllResponse.hour = ['28'];
    expect(() => { cron.setAll(getAllResponse) }).toThrow();
  });

  it('adds a value to a measureOfTime that is set to "*"', () => {
    const cron = new CronBuilder();
    cron.addValue('minute', '5');
    expect(cron.get('minute')).toEqual('5');
    expect(cron.build()).toEqual('5 * * * *');
  });

  it('adds a value to a measure of time that has been set to a number', () => {
    const cron = new CronBuilder();
    cron.addValue('hour', '5');
    cron.addValue('hour', '10');
    expect(cron.get('hour')).toEqual('5,10');
  });

  it('validates duplicate values', () => {
    const cron = new CronBuilder();
    cron.addValue('dayOfTheMonth', '5');
    cron.addValue('dayOfTheMonth', '15');
    cron.addValue('dayOfTheMonth', '5');
    expect(cron.get('dayOfTheMonth')).toEqual('5,15');
  });

  it('validates an invalid value when adding', () => {
    const cron = new CronBuilder();
    expect(() => { cron.addValue('minute', '62') }).toThrow();
  });

  it('removes a value that exists with other values', () => {
    const cron = new CronBuilder();
    cron.set('dayOfTheWeek', ['2', '4']);
    cron.removeValue('dayOfTheWeek', '4');
    expect(cron.get('dayOfTheWeek')).toEqual('2');
  });

  it('resets the value to the default "*" when removing the only value', () => {
    const cron = new CronBuilder();
    cron.set('minute', ['7']);
    expect(cron.get('minute')).toEqual('7');
    cron.removeValue('minute', '7');
    expect(cron.get('minute')).toEqual('*');
  });

  it('accepts a cron expression when instantiating', () => {
    const cron = new CronBuilder('30 0-6 * * 1-5');
    expect(cron.build()).toEqual('30 0-6 * * 1-5');
  });

  it('validates bad values when instantiating with an explicit expression', () => {
    expect(() => {
      const cron = new CronBuilder('30 0-6 * * 1-10');
      cron.build();
    }).toThrow();
  });

  it('validates an expression that is too long when instantiating with an explicit expression', () => {
    expect(() => {
      const cron = new CronBuilder('30 0-6 * * 1-5 * *');
      cron.build();
    }).toThrow();
  });
});
