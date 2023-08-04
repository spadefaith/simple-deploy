const queue = require('queue-microtask');


module.exports = async function QueueService(callback) {
  return queue(callback);
}
