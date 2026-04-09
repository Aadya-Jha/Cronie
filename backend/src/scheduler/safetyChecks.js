import { isFrequencySafe as isFrequencySafeExtended } from "../services/cronValidator.js";

const MIN_INTERVAL_SECONDS = 60;

function isFrequencySafe(cronExpression) {
  const extendedResult = isFrequencySafeExtended(cronExpression);
  return extendedResult.safe;
}

export { isFrequencySafe, MIN_INTERVAL_SECONDS };

export default {
  isFrequencySafe,
  MIN_INTERVAL_SECONDS,
};
