import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const rootPackage = JSON.parse(await readFile("package.json", "utf8"));
const files = {
  "components.json": JSON.stringify(
    {
      $schema: "https://ui.shadcn.com/schema.json",
      style: "base-nova",
      rsc: true,
      tsx: true,
      tailwind: {
        config: "",
        css: "src/app/globals.css",
        baseColor: "neutral",
        cssVariables: true,
        prefix: "",
      },
      iconLibrary: "lucide",
      aliases: {
        components: "@/components",
        utils: "@/lib/utils",
        ui: "@/components/ui",
        lib: "@/lib",
        hooks: "@/hooks",
      },
    },
    null,
    2,
  ),
  "next-env.d.ts":
    '/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n',
  "package.json": JSON.stringify(
    {
      private: true,
      scripts: { build: "next build", typecheck: "tsc --noEmit" },
      dependencies: {
        clsx: rootPackage.dependencies.clsx,
        next: rootPackage.dependencies.next,
        react: rootPackage.dependencies.react,
        "react-dom": rootPackage.dependencies["react-dom"],
        "tailwind-merge": rootPackage.dependencies["tailwind-merge"],
      },
      devDependencies: {
        "@tailwindcss/postcss": rootPackage.devDependencies["@tailwindcss/postcss"],
        "@types/node": rootPackage.devDependencies["@types/node"],
        "@types/react": rootPackage.devDependencies["@types/react"],
        "@types/react-dom": rootPackage.devDependencies["@types/react-dom"],
        tailwindcss: rootPackage.devDependencies.tailwindcss,
        typescript: rootPackage.devDependencies.typescript,
      },
    },
    null,
    2,
  ),
  "postcss.config.mjs": "export default { plugins: { '@tailwindcss/postcss': {} } };\n",
  "src/app/globals.css": '@import "tailwindcss";\n',
  "src/app/layout.tsx":
    "import './globals.css';\nexport default function Layout({ children }: { children: React.ReactNode }) { return <html><body>{children}</body></html>; }\n",
  "src/app/page.tsx":
    'import { Checkbox } from "@/components/ui/checkbox";\nexport default function Page() { return <main><Checkbox aria-label="Registry proof" checked /></main>; }\n',
  "src/lib/utils.ts":
    'import { clsx, type ClassValue } from "clsx";\nimport { twMerge } from "tailwind-merge";\nexport function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }\n',
  "tsconfig.json": JSON.stringify(
    {
      compilerOptions: {
        target: "ES2017",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: false,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "react-jsx",
        incremental: true,
        plugins: [{ name: "next" }],
        paths: { "@/*": ["./src/*"] },
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"],
    },
    null,
    2,
  ),
};

const server = createServer(async (request, response) => {
  const match = request.url?.match(/^\/r\/([a-z0-9-]+\.json)$/);
  if (!match) {
    response.writeHead(404).end();
    return;
  }
  try {
    response.setHeader("content-type", "application/json");
    response.end(await readFile(path.resolve("public/r", match[1])));
  } catch {
    response.writeHead(404).end();
  }
});

const projectDirectory = await mkdtemp(path.join(tmpdir(), "scrapscn-registry-"));
try {
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(projectDirectory, filePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, `${content}\n`);
  }
  await run("pnpm", ["install", "--no-frozen-lockfile", "--ignore-workspace"], {
    cwd: projectDirectory,
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const shadcn = path.resolve("node_modules/.bin/shadcn");
  for (const itemName of ["sentry-base", "checkbox"]) {
    await run(
      shadcn,
      ["add", `http://127.0.0.1:${port}/r/${itemName}.json`, "--yes", "--overwrite"],
      {
        cwd: projectDirectory,
      },
    );
  }
  await run("pnpm", ["typecheck"], { cwd: projectDirectory });
  await run("pnpm", ["build"], { cwd: projectDirectory });
  process.stdout.write(
    "Installed sentry-base and checkbox into a clean Tailwind project; typecheck and production build passed.\n",
  );
} finally {
  server.close();
  await rm(projectDirectory, { recursive: true, force: true });
}
