// @indwella/sdk is a private repo installed as a git dependency (see
// package.json). Netlify's automatic "Install dependencies" step runs
// `yarn install` directly - there is no dashboard hook to run a command
// before it - so this has to happen as an npm/yarn lifecycle script instead.
// `preinstall` is the earliest one available, and runs before any
// dependency (including this git one) is fetched.
//
// Locally, developers already have their own GitHub credentials cached
// (SSH key or HTTPS credential helper), so this is a no-op unless
// SDK_GIT_TOKEN is set - only true inside CI (Netlify, or any future CI for
// the native apps), where it's a fine-grained GitHub PAT scoped read-only
// to the indwella-sdk repo, set as a CI environment variable, never
// committed anywhere.
const { execSync } = require('child_process');

const token = process.env.SDK_GIT_TOKEN;
if (!token) process.exit(0);

execSync(
  `git config --global url."https://${token}@github.com/".insteadOf "https://github.com/"`,
  { stdio: 'inherit' },
);
