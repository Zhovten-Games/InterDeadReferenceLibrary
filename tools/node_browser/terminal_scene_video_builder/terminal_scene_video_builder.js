#!/usr/bin/env node
import { CliApp } from './src/cli/cli-app.js';

const app = new CliApp({
  argv: process.argv.slice(2),
  cwd: process.cwd(),
});

app.run().catch((error) => {
  console.error(`[ERROR] ${error.message}`);
  process.exit(1);
});
