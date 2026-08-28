import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const roots = [".next/static", ".next/server"];
const prohibited = [
  "figmacapture",
  "mcp.figma.com/mcp/html-to-design/capture.js",
  "figma-capture-script",
];

for (const root of roots) {
  const files = await readdir(root, { recursive: true });
  for (const file of files.filter((entry) => entry.endsWith(".js"))) {
    const contents = await readFile(path.join(root, file), "utf8");
    const match = prohibited.find((value) => contents.includes(value));
    if (match) throw new Error(`Production artifact ${path.join(root, file)} contains ${match}`);
  }
}

process.stdout.write("Production runtime JavaScript excludes the Figma capture loader.\n");
