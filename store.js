let socket = null;
let cache = {};

exports.setSocket = (e) => {
  socket = e;
};

exports.setCache = (key, value) => {
  cache[key] = value;
};

exports.getCache = (key) => {
  return cache[key];
};

exports.getSocket = (e) => {
  return socket;
};
