const misuseScenarios = [

{
issue: "Invalid cron expression",
description: "User provides a cron pattern that cannot be parsed."
},

{
issue: "Extremely frequent schedules",
description: "Jobs scheduled every second or too frequently may overload the system."
},

{
issue: "Overlapping executions",
description: "A job triggers again while a previous execution is still running."
},

{
issue: "API abuse",
description: "Jobs repeatedly call external APIs causing unnecessary load."
},

{
issue: "Unlimited retries",
description: "Failed jobs retry indefinitely and consume resources."
}

]

module.exports = misuseScenarios