require("dotenv").config();
const PORT = process.env.PORT;
const express = require("express");
const app = express();
const path = require("path");
const nodeDeploy = require("./controller/node");
const staticDeploy = require("./controller/static");
const queue = require("./services/QueService.js");

const Template = require("./controller/template");
const Env = require("./controller/env");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

  if (deploy_template) {
    await Template.save(repo_name, deploy_template);
  }

  if (env) {
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

app.use("/", express.static(path.join(__dirname, "/public")));

app.listen(PORT, function (err) {
  if (err) {
    console.error(err);
  } else {
    console.log("listening to port ", PORT);
  }
});

app.use((error, req, res, next) => {
  console.log(88, error);
  if (error) {
    res.json({ status: 0, message: error.message });
  }
});
