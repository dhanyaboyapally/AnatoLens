import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const workingDirectory = resolve(root, "vendor", "Vanatome");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const mode = process.argv[2] === "build" ? "build" : "dev";

function run(command, args) {
  return new Promise((resolveProcess, reject) => {
    const child = spawn(command, args, {
      cwd: workingDirectory,
      env: {
        ...process.env,
        WRANGLER_LOG_PATH: ".wrangler/wrangler.log",
      },
      stdio: "inherit",
    });

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) reject(new Error(`Process stopped with signal ${signal}`));
      else if (code !== 0) reject(new Error(`Process exited with code ${code}`));
      else resolveProcess();
    });
  });
}

try {
  await run(npmCommand, ["run", "package:build"]);
  await run("npx", ["vinext", mode]);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
