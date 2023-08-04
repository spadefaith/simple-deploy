#mkdir
REPO_DIR={repo_name}-{repo_branch}

mkdir ~/{dir}
mkdir ~/{dir}/$REPO_DIR
echo "done mkdir"

echo "cd ~/{dir}/$REPO_DIR"
cd ~/{dir}/$REPO_DIR

echo {content} > .env