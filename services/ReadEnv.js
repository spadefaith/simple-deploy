const { envToJson } = require("env-and-json");
const fs = require("fs");

module.exports = (envPath) => {
  return new Promise((res, rej) => {
    fs.readFile(envPath, "utf8", (err, data) => {
      if (err) {
        rej(err);
        return;
      }
      let jsondata = JSON.parse(envToJson(data));
      res(jsondata);
    });
  });
};
