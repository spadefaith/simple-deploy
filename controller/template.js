const PouchDB = require("pouchdb-node");
exports.save = (name, template) => {
  const db = new PouchDB("templates");

  return db
    .get(name)
    .then(function (doc) {
      return db.put({
        _id: name,
        _rev: doc._rev,
        template,
      });
    })
    .catch(function (err) {
      return db.put({
        _id: name,
        template,
      });
    });
};

exports.get = (name) => {
  const db = new PouchDB("templates");

  return db
    .get(name)
    .then(function (doc) {
      return doc;
    })
    .catch(function (err) {
      return null;
    });
};
