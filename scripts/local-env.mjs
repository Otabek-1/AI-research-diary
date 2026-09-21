// Generates .env.local with a correctly escaped bcrypt hash for local verification.
import bcrypt from "bcryptjs";
import { writeFileSync, readFileSync } from "node:fs";

const password = process.argv[2] ?? "fieldnotes";
const hash = bcrypt.hashSync(password, 10);

// Next.js expands `$name` in .env files as a variable reference, and a bcrypt hash
// starts with `$2b$10$`, so the leading segments would be swallowed. Quote the value
// to keep it literal.
writeFileSync(
  ".env.local",
  [
    "# Local-only environment for manual verification. Not used in production.",
    `# Password for /private-editor during local testing: ${password}`,
    `EDITOR_PASSWORD_HASH="${hash}"`,
    "",
  ].join("\n"),
);

const written = readFileSync(".env.local", "utf8")
  .split("\n")
  .find((line) => line.startsWith("EDITOR_PASSWORD_HASH="))
  .slice("EDITOR_PASSWORD_HASH=".length);

console.log("written hash:", written);
console.log("starts with $2b$10$:", written.startsWith("$2b$10$"));
console.log("compareSync:", bcrypt.compareSync(password, written));
console.log(
  "Note: the value is quoted so Next.js does not expand `$2b$10$` as a variable reference.",
);
