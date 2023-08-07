const PouchDB = require("pouchdb-node");
exports.save = (data) => {
  const db = new PouchDB("applications");
  const { repo_name, repo_branch } = data;
  const id = `${repo_name}-${repo_branch}`;

  return db
    .get(id)
    .then(function (doc) {
      return db.put({
        _id: id,
        _rev: doc._rev,
        ...data,
      });
    })
    .catch(function (err) {
      return db.put({
        _id: id,
        ...data,
      });
    });
};

exports.get = (id) => {
  const db = new PouchDB("applications");

  return db
    .get(id)
    .then(function (doc) {
      return doc;
    })
    .catch(function (err) {
      return null;
    });
};

exports.instance = new PouchDB("applications");
