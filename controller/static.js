const format = require("string-template");
const fs = require("fs");
const { exec, spawn } = require("child_process");
const path = require("path");
const { get } = require("./template");
async function deploy({ repo_url, repo_name, template }) {
  const t = await get(template);

  if (!t) {
    throw new Error(`template ${template} not found`);
  }

  const str = format(t.template, {
    repo_url,
    repo_name,
    dir: "simple-deploy-out-static",
  });

  if (str.includes("{")) {
    throw new Error("not parsed");
  }

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
        const child = spawn(`bash dist/deploy-${repo_name}.sh`, [], {
          shell: true,
          cwd: process.cwd(),
          env: process.env,
          stdio: ["inherit"],
          encoding: "utf-8",
        });
        child.stdout.on("data", async (data) => {
          data = data.toString();
          console.log(data);
        });
        child.stderr.on("data", async (data) => {
          data = data.toString();
          console.log(data);
        });
        child.on("close", async (code) => {
          // console.log(output);
          resolve(`child process exited with code ${code}`);
        });
      });
    });
  });
}

module.exports = deploy;
