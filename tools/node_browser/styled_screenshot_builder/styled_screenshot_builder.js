#!/usr/bin/env node

const path = require('node:path');
const { CliApp } = require('./src/cli/cli-app');

const app = new CliApp({
  argv: process.argv.slice(2),
  cwd: process.cwd(),
  env: process.env,
  scriptDir: __dirname,
  path,
});

app.run().catch((error) => {
  console.error(`[ERROR] ${error.message}`);
  process.exit(1);
});
