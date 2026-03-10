const cron = require("node-cron")

function isValidCron(expression) {
    return cron.validate(expression)
}

module.exports = {
    isValidCron
}