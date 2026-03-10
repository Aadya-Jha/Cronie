
const MIN_INTERVAL_SECONDS = 60

function isFrequencySafe(cronExpression) {
    const parts = cronExpression.trim().split(" ")

    if (parts.length === 6 && parts[0] === "*") {
        return false
    }

    return true
}

module.exports = {
    isFrequencySafe
}