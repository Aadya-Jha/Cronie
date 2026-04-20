import { CronExpressionParser } from 'cron-parser';

export const validateCronExpression = (cronExpression) => {
  try {
    CronExpressionParser.parse(cronExpression);
    return true;
  } catch (err) {
    return false;
  }
};

export const getNextRunTime = (cronExpression) => {
  const nextRun = CronExpressionParser.parse(cronExpression).next();
  return nextRun.toDate();
};