require("dotenv").config();
const PORT = process.env.PORT;
const express = require("express");
const app = express();

const http = require("http");
const server = http.createServer(app);

const cookieParser = require("cookie-parser");
const path = require("path");
const nodeDeploy = require("./controller/node");
const staticDeploy = require("./controller/static");
const queue = require("./services/QueService.js");

const jwt = require("jsonwebtoken");
const Template = require("./controller/template");
const Env = require("./controller/env");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const { setCache, getCache, setSocket, getSocket } = require("./store");

app.post("/simple-deploy/:name", async function (req, res, next) {
  // deploy({
  //     repo_url: '--branch staging git@github.com:spadefaith/gcash-service-fe.git ',
  //     repo_name: 'gcash-staging'
  // })

  if (req.query.type == "static") {
    queue(async () => {
      return staticDeploy({
        repo_url: req.query.repo_url,
        repo_name: req.query.repo_name,
        template: req.params.name,
      });
    });
  } else {
    queue(async () => {
      return nodeDeploy({
        repo_url: req.query.repo_url,
        repo_name: req.query.repo_name,
        template: req.params.name,
        loc: req.query.loc,
        repo_branch: req.query.repo_branch,
      });
    });
  }

  return res.json({ status: 1 });
});

app.post("/template/:name", async function (req, res, next) {
  try {
    const name = req.params.name;
    if (!name) {
      next(new Error("name is required"));
    }
    const template = await new Promise((res, rej) => {
      const contentType = req.headers["content-type"] || "",
        mime = contentType.split(";")[0];

      if (mime != "text/plain") {
        return rej(new Error("payload is wrong format"));
      }

      let data = "";
      req.setEncoding("utf8");
      req.on("data", function (chunk) {
        data += chunk;
      });
      req.on("end", function () {
        res(data);
      });
      req.on("error", function () {
        rej(err);
      });
    }).catch((err) => {
      throw err;
    });

    if (template) {
      await Template.save(req.params.name, template);
    }

    res.json({ status: 1 });
  } catch (err) {
    res.json({ status: 1, message: err.message });
  }
});

app.get("/template/:name", async function (req, res, next) {
  try {
    const template = await Template.get(req.params.name);

    res.json({ status: 1, data: template });
  } catch (err) {
    res.json({ status: 1, message: err.message });
  }
});

app.post("/env/:name", async function (req, res, next) {
  try {
    const name = req.params.name;
    if (!name) {
      next(new Error("name is required"));
    }
    const env = await new Promise((res, rej) => {
      const contentType = req.headers["content-type"] || "",
        mime = contentType.split(";")[0];

      if (mime != "text/plain") {
        return rej(new Error("payload is wrong format"));
      }

      let data = "";
      req.setEncoding("utf8");
      req.on("data", function (chunk) {
        data += chunk;
      });
      req.on("end", function () {
        res(data);
      });
      req.on("error", function () {
        rej(err);
      });
    }).catch((err) => {
      throw err;
    });

    if (env) {
      await Env.save({
        repo_name: req.params.name,
        content: env,
      });
    }

    res.json({ status: 1 });
  } catch (err) {
    res.json({ status: 1, message: err.message });
  }
});

app.post("/form-submit", async function (req, res, next) {
  let {
    repo_name,
    repo_url,
    loc,
    type,
    env,
    repo_branch,
    template_name,
    deploy_template,
  } = req.body;
  if (template_name && deploy_template) {
    deploy_template = deploy_template.trim();
    template_name = template_name.trim();

    // console.log(152, JSON.stringify(deploy_template));

    await Template.save(template_name, deploy_template);
  }

  // throw new Error("pause");

  if (env) {
    repo_name = repo_name.trim();
    repo_branch = repo_branch.trim();
    env = env.trim();
    await Env.save({
      repo_name: `${repo_name}-${repo_branch}`,
      content: env,
    });
  }

  repo_url = `--branch ${repo_branch} ${repo_url}`;

  if (type == "static") {
    if (!(repo_url && repo_name && template_name)) {
      return next(
        new Error(
          `repo_url-${repo_url} && repo_name-${repo_name} && template_name-${template_name} is missing`
        )
      );
    }

    repo_url = repo_url.trim();
    repo_name = repo_name.trim();
    template_name = template_name.trim();

    queue(async () => {
      return staticDeploy({
        repo_url: repo_url,
        repo_name: repo_name,
        template: template_name,
      });
    });
  } else {
    if (!(repo_url && repo_name && template_name && repo_branch)) {
      return next(
        new Error(
          `repo_url-${repo_url} && repo_name-${repo_name} && template_name-${template_name} && repo_branch-${repo_branch} is missing`
        )
      );
    }
    repo_url = repo_url.trim();
    repo_name = repo_name.trim();
    template_name = template_name.trim();
    repo_branch = repo_branch.trim();

    queue(async () => {
      return nodeDeploy({
        repo_url: repo_url,
        repo_name: repo_name,
        template: template_name,
        loc: loc,
        repo_branch: repo_branch,
      });
    });
  }

  return res.json({ status: 1 });
});

app.post("/login-submit", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!(username && password)) {
      throw new Error("incomplete");
    }

    if (username == process.env.USER_NAME && password == process.env.PASSWORD) {
      const token = jwt.sign(
        {
          exp: Math.floor(Date.now() / 1000) + 60 * 60,
          username,
        },
        process.env.SECRET
      );

      console.log(252, token);

      setCache(username, token);

      res.cookie("x-token", token, { secure: true, httpOnly: true });

      console.log("redirect to http://62.72.6.44:8990/");
      res.redirect("http://62.72.6.44:8990/");
    } else {
      console.log(err);
      throw new Error("not found");
    }
  } catch (err) {
    res.redirect("/login");
  }
});

app.use("/login", express.static(path.join(__dirname, "/public/login.html")));

app.use(
  "/",
  (req, res, next) => {
    try {
      const cookies = { ...req.cookies };

      if (!cookies["x-token"]) {
        res.redirect("/login");
      } else {
        const token = cookies["x-token"];
        console.log(274, token);

        const verify = jwt.verify(token, process.env.SECRET);
        const username = verify.username;

        console.log(275, getCache(username));

        if (!getCache(username)) {
          return res.redirect("/login");
        }

        next();
      }
    } catch (err) {
      next(err);
    }
  },
  express.static(path.join(__dirname, "/public"))
);

server.listen(PORT, function (err) {
  if (err) {
    console.error(err);
  } else {
    console.log("listening to port ", PORT);
  }
});

require("./socket")(server);

app.use((error, req, res, next) => {
  console.log(88, error);
  if (error) {
    res.json({ status: 0, message: error.message });
  }
});
