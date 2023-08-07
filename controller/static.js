const format = require("string-template");
const fs = require("fs");
const { exec, spawn } = require("child_process");
const path = require("path");
const { get } = require("./template");
const { getSocket } = require("../store");
async function deploy({ repo_url, repo_name, template_name, repo_branch }) {
  const templatePath = path.join(
    __dirname,
    `../config/templates/${template_name}.sh`
  );

  if (!fs.existsSync(templatePath)) {
    throw new Error("template not found");
  }
  const t = fs.readFileSync(templatePath, { encoding: "utf8", flag: "r" });

  if (!t) {
    throw new Error(`template ${template} not found`);
  }

  // console.log(13, repo_url, repo_name, template, repo_branch);

  let str = format(t, {
    repo_url,
    repo_name,
    repo_branch,
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

          const socket = getSocket();
          socket && socket.emit("message", data);
        });
        child.stderr.on("data", async (data) => {
          data = data.toString();
          console.log(54, data);

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
