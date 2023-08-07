const { setCache, getCache, setSocket, getSocket } = require("../store");
const jwt = require("jsonwebtoken");
module.exports = (req, res, next) => {
  try {
    const cookies = { ...req.cookies };
    console.log(50, cookies["x-token"]);
    if (!cookies["x-token"]) {
      res.redirect("/login");
    } else {
      const token = cookies["x-token"];

      const verify = jwt.verify(token, process.env.SECRET);
      const username = verify.username;

      if (!getCache(username)) {
        return res.redirect("/login");
      }

      next();
    }
  } catch (err) {
    console.log(22, err);
    if (err.message.includes("jwt")) {
      return res.redirect("/login");
    } else {
      next(err);
    }
  }
};
