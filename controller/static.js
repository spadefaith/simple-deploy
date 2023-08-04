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

  // console.log(13, repo_url, repo_name, template);

  let str = format(t, {
    repo_url,
    repo_name,
    dir: "simple-deploy-out-static",
  });

  if (str.includes("{")) {
    throw new Error("not parsed");
  }

  str = str.trim();

  // console.log(1);
  console.log(str);
  console.log("---------------- end string -----------------");

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
          console.log(53, data);
        });
        child.stderr.on("data", async (data) => {
          data = data.toString();
          console.log(54, data);
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
