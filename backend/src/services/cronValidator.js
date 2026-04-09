import pkg from "cron-parser";
const { CronExpressionParser } = pkg;

export const validateCronExpression = (cronExpression) => {
  try {
    CronExpressionParser.parse(cronExpression);
    return true;
  } catch {
    return false;
  }
};

export const getNextRunTime = (cronExpression) => {
  const nextRun = CronExpressionParser.parse(cronExpression).next();
  return nextRun.toDate();
};

export const getNextRunTimes = (cronExpression, count = 3) => {
  try {
    const interval = CronExpressionParser.parse(cronExpression);
    const times = [];
    for (let i = 0; i < count; i++) {
      const next = interval.next();
      times.push(next.toDate());
    }
    return times;
  } catch {
    return [];
  }
};

export const isFrequencySafe = (cronExpression) => {
  try {
    const interval = CronExpressionParser.parse(cronExpression);
    const now = new Date();
    const next1 = interval.next().toDate();
    const next2 = interval.next().toDate();

    const intervalMs = next2.getTime() - next1.getTime();
    const intervalSeconds = intervalMs / 1000;

    if (intervalSeconds < 60) {
      return {
        safe: false,
        reason: `Schedule runs too frequently (every ~${Math.round(intervalSeconds)}s). Minimum interval is 60 seconds.`,
        intervalSeconds,
      };
    }

    return {
      safe: true,
      intervalSeconds,
    };
  } catch (error) {
    return {
      safe: false,
      reason: `Invalid cron expression: ${error.message}`,
    };
  }
};

export const getSafetyRating = (cronExpression) => {
  const safety = isFrequencySafe(cronExpression);

  if (!safety.safe) {
    return {
      rating: "unsafe",
      reason: safety.reason,
    };
  }

  if (safety.intervalSeconds < 300) {
    return {
      rating: "caution",
      reason: `Schedule runs every ~${Math.round(safety.intervalSeconds / 60)} minutes. This may generate high load.`,
    };
  }

  return {
    rating: "safe",
    reason: null,
  };
};

export const generateHumanReadable = (cronExpression) => {
  try {
    const interval = CronExpressionParser.parse(cronExpression);
    const next = interval.next().toDate();

    const parts = cronExpression.trim().split(/\s+/);
    if (parts.length !== 5) {
      return "Invalid cron expression";
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    if (dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
      if (hour === "*" && minute === "*") {
        return "Every minute";
      }
      if (hour === "*") {
        return `Every ${minute === "0" ? "hour" : `minute ${minute} of every hour`}`;
      }
      if (minute === "0" || minute === "00") {
        return `Daily at ${hour.padStart(2, "0")}:00`;
      }
      return `Daily at ${hour}:${minute}`;
    }

    if (dayOfWeek !== "*" && dayOfMonth === "*") {
      const days = {
        "0": "Sunday",
        "1": "Monday",
        "2": "Tuesday",
        "3": "Wednesday",
        "4": "Thursday",
        "5": "Friday",
        "6": "Saturday",
        "7": "Sunday",
      };

      if (dayOfWeek.includes(",")) {
        const dayNames = dayOfWeek
          .split(",")
          .map((d) => days[d] || d)
          .join(", ");
        const time =
          hour !== "*" && (minute === "0" || minute === "00")
            ? ` at ${hour}:${minute}`
            : hour !== "*"
              ? ` at ${hour}:${minute}`
              : "";
        return `Every ${dayNames}${time}`;
      }

      const dayName = days[dayOfWeek] || dayOfWeek;
      const time =
        hour !== "*" && (minute === "0" || minute === "00")
          ? ` at ${hour}:${minute}`
          : hour !== "*"
            ? ` at ${hour}:${minute}`
            : "";
      return `Every ${dayName}${time}`;
    }

    if (dayOfMonth !== "*" && dayOfWeek === "*" && month === "*") {
      const time =
        hour !== "*" && (minute === "0" || minute === "00")
          ? ` at ${hour}:${minute}`
          : hour !== "*"
            ? ` at ${hour}:${minute}`
            : "";
      return `On day ${dayOfMonth} of every month${time}`;
    }

    if (month !== "*" && dayOfMonth === "*" && dayOfWeek === "*") {
      const months = {
        "1": "January",
        "2": "February",
        "3": "March",
        "4": "April",
        "5": "May",
        "6": "June",
        "7": "July",
        "8": "August",
        "9": "September",
        "10": "October",
        "11": "November",
        "12": "December",
      };
      const monthName = months[month] || month;
      return `Every ${monthName}`;
    }

    return `Next run: ${next.toLocaleString()}`;
  } catch {
    return "Unable to parse schedule";
  }
};

export const getFrequencyCategory = (cronExpression) => {
  try {
    const safety = isFrequencySafe(cronExpression);
    if (!safety.safe || !safety.intervalSeconds) {
      return "unknown";
    }

    const seconds = safety.intervalSeconds;
    if (seconds < 3600) return "minute";
    if (seconds < 86400) return "hourly";
    if (seconds < 604800) return "daily";
    if (seconds < 2592000) return "weekly";
    if (seconds < 31536000) return "monthly";
    return "yearly";
  } catch {
    return "unknown";
  }
};

export const validateAndAnalyzeCron = (cronExpression) => {
  const isValid = validateCronExpression(cronExpression);
  if (!isValid) {
    return {
      valid: false,
      error: "Invalid cron expression",
    };
  }

  const safety = getSafetyRating(cronExpression);
  const humanReadable = generateHumanReadable(cronExpression);
  const nextRunTimes = getNextRunTimes(cronExpression, 3);
  const frequencyCategory = getFrequencyCategory(cronExpression);

  return {
    valid: true,
    safetyRating: safety.rating,
    safetyReason: safety.reason,
    humanReadable,
    nextRunTimes,
    frequencyCategory,
  };
};

export default {
  validateCronExpression,
  getNextRunTime,
  getNextRunTimes,
  isFrequencySafe,
  getSafetyRating,
  generateHumanReadable,
  getFrequencyCategory,
  validateAndAnalyzeCron,
};
