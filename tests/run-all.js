// Runs every test. Usage: node tests/run-all.js
const { spawnSync } = require("child_process");
const path = require("path");
let bad = 0;
for (const f of ["check-site.js", "test-notify.js"]) {
  console.log("\n===== " + f + " =====");
  const r = spawnSync(process.execPath, [path.join(__dirname, f)], { stdio: "inherit" });
  if (r.status !== 0) bad++;
}
console.log("\n" + (bad ? "SOMETHING FAILED" : "EVERYTHING PASSED"));
process.exit(bad ? 1 : 0);
