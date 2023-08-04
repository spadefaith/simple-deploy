const format = require("string-template");
const fs = require("fs");
const {exec, spawn} = require('child_process');
const path = require('path');
function deploy({
    repo_url,
    repo_name
}){
    const str = format(`
      #mkdir
      mkdir ~/simple-deploy-out
      mkdir ~/simple-deploy-out/{repo_name}
      cd ~/simple-deploy-out/{repo_name}
      echo "done mkdir"

      #clone the repository
      echo "clone"
      git clone {repo_url} .
      echo "done cloning"

      #install and build
      echo "pnpm install"
      pnpm install
      echo "pnpm build"
      pnpm build

      echo "done build"

      #add to nginx
      sudo rm -rf /var/www/{repo_name}
      echo "done output clear"
      sudo mkdir /var/www/{repo_name}
      echo "done output mkdir"
      sudo cp -r dist/* /var/www/{repo_name}
      echo "done output copy"
      sudo chown -R www-data:www-data /var/www/{repo_name}
      echo "done output change user access"
      #remove the url
      sudo rm -rf cd ~/simple-deploy-out/{repo_name}
      echo "done src remove"
  `, {
      repo_url,repo_name
  });

  return new Promise((resolve, reject) => {

    const dir = spawn(`bash dir.sh`,[], {
      shell: true,
      cwd: process.cwd(),
      env: process.env,
      stdio: ['inherit'],
      encoding: 'utf-8',
    });

    dir.on('close', async (code) => {
      fs.writeFile(`dist/deploy-${repo_name}.sh`, str, function (err) {
        if (err){
          return reject(err);
        };
        const child = spawn(`bash dist/deploy-${repo_name}.sh`,[], {
            shell: true,
            cwd: process.cwd(),
            env: process.env,
            stdio: ['inherit'],
            encoding: 'utf-8',
          });
          child.stdout.on('data', async (data) => {
            data = data.toString();
            console.log(data);
            
          });
          child.stderr.on('data', async (data) => {
            data = data.toString();
            console.log(data);
          });
          child.on('close', async (code) => {
              // console.log(output);
              resolve(`child process exited with code ${code}`);
          });
    })
  });




  })
};


module.exports = deploy;

