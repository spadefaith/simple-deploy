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
const Env = require("./services/write");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

const db = require("./db");

const VerifySessionMiddleware = require("./middleware//VerifySession");

const { setCache, getCache, setSocket, getSocket } = require("./store");
const fs = require("fs");

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

      setCache(username, token);
      console.log(50, token);

      res.cookie("x-token", token, { httpOnly: true });
      res.redirect("/");
    } else {
      console.log(err);
      throw new Error("not found");
    }
  } catch (err) {
    res.redirect("/login");
  }
});

app.use("/login", express.static(path.join(__dirname, "/public/login.html")));

app.post(
  "/form-submit",
  VerifySessionMiddleware,
  async function (req, res, next) {
    try {
      let {
        repo_name,
        repo_url,
        loc,
        type,
        repo_branch,
        env,
        template_name,
        deploy_template,
      } = req.body;

      if (
        type == "node" &&
        !(repo_url && repo_name && template_name && repo_branch)
      ) {
        return next(
          new Error(
            `repo_url-${repo_url} && repo_name-${repo_name} && template_name-${template_name} && repo_branch-${repo_branch} is missing`
          )
        );
      }

      if (type == "static" && !(repo_url && repo_name && template_name)) {
        return next(
          new Error(
            `repo_url-${repo_url} && repo_name-${repo_name} && template_name-${template_name} is missing`
          )
        );
      }

      if (!fs.existsSync("config")) {
        fs.mkdirSync("config");
      }
      if (!fs.existsSync(`config/${repo_name}-${repo_branch}`)) {
        fs.mkdirSync(`config/${repo_name}-${repo_branch}`);
      }

      if (!fs.existsSync(`config/templates`)) {
        fs.mkdirSync(`config/templates`);
      }

      if (template_name && deploy_template) {
        fs.writeFileSync(
          `config/templates/${template_name}.sh`,
          deploy_template.replace(/[\r\n]/gm, "\n")
        );
      }

      if (env) {
        console.log(119, `config/${repo_name}-${repo_branch}/.env`);
        fs.writeFileSync(`config/${repo_name}-${repo_branch}/env`, env);
        fs.writeFileSync(`config/${repo_name}-${repo_branch}/.env`, env);
      }

      await db.save({
        repo_name: repo_name.trim(),
        repo_url: `--branch ${repo_branch.trim()} ${repo_url.trim()}`,
        loc: loc.trim(),
        type: type.trim(),
        repo_branch: repo_branch.trim(),
        template_name,
      });

      if (type == "static") {
        queue(async () => {
          return staticDeploy({
            repo_url,
            repo_name,
            template_name,
            repo_branch,
          });
        });
      } else {
        queue(async () => {
          return nodeDeploy({
            repo_url,
            repo_name,
            template_name,
            loc,
            repo_branch,
          });
        });
      }

      return res.json({ status: 1 });
    } catch (err) {
      console.log(154, err);
      return res.json({ status: 0 });
    }
  }
);

app.post("/deploy", async function (req, res, next) {
  let { repo_name, repo_branch } = req.query;

  const find = await db.get(`${repo_name}-${repo_branch}`);

  if (!find) {
    return next(new Error(`${repo_name} ${repo_branch} is not found`));
  }

  const { repo_url, loc, type, template_name } = find;

  if (type == "static") {
    queue(async () => {
      return staticDeploy({
        repo_url,
        repo_name,
        template_name,
        repo_branch,
      });
    });
  } else {
    queue(async () => {
      return nodeDeploy({
        repo_url,
        repo_name,
        template_name,
        loc,
        repo_branch,
      });
    });
  }
  res.json({ status: 1 });
});

app.post(
  "/manual-deploy",
  VerifySessionMiddleware,
  async function (req, res, next) {
    let { repo_name, repo_branch } = req.query;

    const find = await db.get(`${repo_name}-${repo_branch}`);

    if (!find) {
      return next(new Error(`${repo_name} ${repo_branch} is not found`));
    }

    const { repo_url, loc, type, template_name } = find;

    if (type == "static") {
      queue(async () => {
        return staticDeploy({
          repo_url,
          repo_name,
          template_name,
          repo_branch,
        });
      });
    } else {
      queue(async () => {
        return nodeDeploy({
          repo_url,
          repo_name,
          template_name,
          loc,
          repo_branch,
        });
      });
    }
    res.json({ status: 1 });
  }
);

app.use(
  "/create",
  VerifySessionMiddleware,
  express.static(path.join(__dirname, "/public"))
);

app.use("/", VerifySessionMiddleware, async (req, res) => {
  const findAll = await db.instance.allDocs({ include_docs: true });

  const rows = findAll.rows.map((item) => item.doc);

  res.render("pages/list", { rows });
});

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
