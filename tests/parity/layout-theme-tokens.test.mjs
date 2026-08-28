import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const EXPECTED_LIGHT_BORDERS = {
  accent: "#7553ff",
  danger: "#ff002b",
  muted: "#e6e6e9",
  primary: "#dad9de",
  promotion: "#ff70bc",
  secondary: "#e6e6e9",
  success: "#00f261",
  warning: "#ffce00",
};

const EXPECTED_DARK_BORDERS = {
  accent: "#7553ff",
  danger: "#ff002b",
  muted: "#1b1821",
  primary: "#141119",
  promotion: "#ff45a8",
  secondary: "#1b1821",
  success: "#00f261",
  warning: "#ffce00",
};

function readBorderAliases(cssBlock) {
  return Object.fromEntries(
    [...cssBlock.matchAll(/--scraps-theme-border-([a-z]+):\s*(#[0-9a-f]+);/g)].map(
      ([, name, value]) => [name, value],
    ),
  );
}

test("layout border aliases exactly match the pinned light and dark themes", async () => {
  const globals = await readFile("src/app/globals.css", "utf8");
  const darkStart = globals.indexOf(".dark {");

  assert.notEqual(darkStart, -1);
  assert.deepEqual(readBorderAliases(globals.slice(0, darkStart)), EXPECTED_LIGHT_BORDERS);
  assert.deepEqual(readBorderAliases(globals.slice(darkStart)), EXPECTED_DARK_BORDERS);
});
