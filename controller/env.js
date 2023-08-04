const fs = require("fs");
const format = require("string-template");
const { exec, spawn } = require("child_process");
exports.save = ({ repo_name, content }) => {
  const t = `
        #mkdir
        REPO_DIR={repo_name}

        mkdir ~/{dir}
        mkdir ~/{dir}/$REPO_DIR
        echo "done mkdir"

        echo "cd ~/{dir}/$REPO_DIR"
        cd ~/{dir}/$REPO_DIR

        echo '{content}' > .env
    `;
  const str = format(t, {
    repo_name,
    content,
    dir: "simple-deploy-out-node",
  });

  return new Promise((resolve, reject) => {
    const dir = spawn(`bash dir.sh`, [], {
      shell: true,
      cwd: process.cwd(),
      env: process.env,
      stdio: ["inherit"],
      encoding: "utf-8",
    });

    dir.on("close", async (code) => {
      fs.writeFile(`dist/env-${repo_name}.sh`, str, function (err) {
        if (err) {
          return reject(err);
        }
        const child = spawn(`bash dist/env-${repo_name}.sh`, [], {
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
};
