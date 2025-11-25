const NodeCache = require("node-cache");

// cache for 30 seconds
const cache = new NodeCache({ stdTTL: 30, checkperiod: 35 });

module.exports = cache;
