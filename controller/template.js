const PouchDB = require("pouchdb-node");
exports.save = (name, template) => {
  const db = new PouchDB("templates");

  // console.log(5, JSON.stringify(template));

  const formatted = template.replace(/[\r\n]/gm, "\n");

  // console.log(6, name);

  // console.log(13, JSON.stringify(formatted));
  // console.log(13, formatted);
  return db
    .get(name)
    .then(function (doc) {
      // console.log(8, doc);
      return db.put({
        _id: name,
        _rev: doc._rev,
        template: JSON.stringify(formatted),
      });
    })
    .catch(function (err) {
      return db.put({
        _id: name,
        template: JSON.stringify(formatted),
      });
    });
};

exports.get = (name) => {
  const db = new PouchDB("templates");

  return db
    .get(name)
    .then(function (doc) {
      return JSON.parse(doc.template);
    })
    .catch(function (err) {
      return null;
    });
};
