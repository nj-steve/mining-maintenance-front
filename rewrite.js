const fs = require('fs');
let content = fs.readFileSync('src/views/repairRecordsDetail/index.vue', 'utf8');

// Replace static string array with objects for repairTypeOptions is already done in previous replace.
// Let's undo my previous replace and just rewrite cleanly.

