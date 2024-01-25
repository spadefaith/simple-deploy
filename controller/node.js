const format = require("string-template");
const fs = require("fs");
const { exec, spawn } = require("child_process");
const path = require("path");
const { get } = require("./template");
const ReadEnv = require("../services/ReadEnv");
const loki = require("lokijs");
const db = new loki("db.json").addCollection("applications");
const shell = require("shelljs");

const { getSocket } = require("../store");
async function deploy({
  repo_url,
  repo_name,
  template_name,
  loc,
  repo_branch,
}) {
  if (!repo_branch) {
    throw new Error("branch is required");
  }
  const templatePath = path.join(
    __dirname,
    `../config/templates/${template_name}.sh`
  );

  const envPath = path.join(
    __dirname,
    `../config/${repo_name}-${repo_branch}/.env`
  );

  let envObj = await ReadEnv(envPath);

  envObj = Object.keys(envObj).reduce((accu, key) => {
    const value = envObj[key];
    accu[String(key).toUpperCase()] = value;
    return accu;
  }, {});

  console.log(33, envObj);

  if (!fs.existsSync(templatePath)) {
    throw new Error("template not found");
  }
  const t = fs.readFileSync(templatePath, { encoding: "utf8", flag: "r" });

  if (!t) {
    throw new Error(`template ${template} not found`);
  }

  const str = format(t, {
    repo_url,
    repo_name,
    dir: "simple-deploy-out-node",
    loc: loc || "",
    repo_branch,
  });

  if (str.includes("{")) {
    throw new Error("not parsed");
  }

  console.log(27, str);

  return new Promise((resolve, reject) => {
    const dir = spawn(`bash dir.sh`, [], {
      shell: true,
      cwd: process.cwd(),
      env: process.env,
      stdio: ["inherit"],
      encoding: "utf-8",
    });

    dir.on("close", async (code) => {
      fs.writeFile(`dist/deploy-${repo_name}.sh`, str, function (err) {
        if (err) {
          return reject(err);
        }

        console.log(75, {
          shell: true,
          cwd: process.cwd(),
          env: { ...process.env, ...(envObj || {}) },
          stdio: ["inherit"],
          encoding: "utf-8",
        });

        const child = spawn(`bash dist/deploy-${repo_name}.sh`, [], {
          shell: true,
          cwd: process.cwd(),
          env: { ...process.env, ...(envObj || {}) },
          stdio: ["inherit"],
          encoding: "utf-8",
        });
        child.stdout.on("data", async (data) => {
          data = data.toString();
          console.log(data);
          const socket = getSocket();
          socket && socket.emit("message", data);
        });
        child.stderr.on("data", async (data) => {
          data = data.toString();
          console.log(data);
          const socket = getSocket();
          socket && socket.emit("message", data);
        });
        child.on("close", async (code) => {
          // console.log(output);
          const t = `child process exited with code ${code}`;
          const socket = getSocket();
          socket && socket.emit("message", t);
          resolve(t);
        });
      });
    });
  });
}

module.exports = deploy;
