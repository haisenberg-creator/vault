#!/usr/bin/env node

/**
 * Graphify — Repository AST & Dependency Knowledge Graph Generator
 *
 * Scans TypeScript/React and Rust sources to build a comprehensive module graph
 * mapping imports, exports, components, services, hooks, and Tauri IPC commands.
 *
 * Usage:
 *   node scripts/graphify.js [--stats] [--query <module-name>] [--output <filepath>]
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT_DIR, "src");
const TAURI_SRC_DIR = path.join(ROOT_DIR, "src-tauri", "src");

function normalizeRelativePath(filePath) {
  return path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");
}

function scanFiles(dir, extensions) {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        !["node_modules", "dist", "target", ".git", ".scratch"].includes(
          entry.name
        )
      ) {
        results = results.concat(scanFiles(fullPath, extensions));
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (extensions.includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

function parseTypeScriptFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const relPath = normalizeRelativePath(filePath);
  const fileName = path.basename(filePath, path.extname(filePath));
  const lines = content.split("\n");

  const imports = [];
  const exports = [];

  // Match import statements: import ... from "..."
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  // Match named exports: export const/function/interface/type/class ...
  const exportRegex =
    /export\s+(?:const|function|interface|type|class|enum)\s+([a-zA-Z0-9_]+)/g;
  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  if (content.includes("export default")) {
    exports.push("default");
  }

  let type = "util";
  if (relPath.includes("/components/")) type = "component";
  else if (relPath.includes("/services/")) type = "service";
  else if (relPath.includes("/hooks/")) type = "hook";
  else if (relPath.includes("/types/")) type = "type";
  else if (relPath.endsWith(".css")) type = "style";

  return {
    id: relPath,
    name: fileName,
    type,
    path: relPath,
    imports,
    exports,
    dependencies: [],
    dependents: [],
    loc: lines.length,
  };
}

function parseRustFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const relPath = normalizeRelativePath(filePath);
  const nodes = [];

  // Match tauri commands: #[tauri::command]\nfn <name>
  const commandRegex =
    /#\[tauri::command\]\s*(?:async\s+)?fn\s+([a-zA-Z0-9_]+)/g;
  let match;
  const commands = [];
  while ((match = commandRegex.exec(content)) !== null) {
    commands.push(match[1]);
  }

  nodes.push({
    id: relPath,
    name: path.basename(filePath),
    type: "rust-command",
    path: relPath,
    imports: [],
    exports: commands,
    dependencies: [],
    dependents: [],
    loc: content.split("\n").length,
  });

  return nodes;
}

export function buildGraph() {
  const tsFiles = scanFiles(SRC_DIR, [".ts", ".tsx", ".css"]);
  const rustFiles = scanFiles(TAURI_SRC_DIR, [".rs"]);

  const nodeMap = {};

  for (const file of tsFiles) {
    const node = parseTypeScriptFile(file);
    nodeMap[node.id] = node;
  }

  for (const file of rustFiles) {
    const rNodes = parseRustFile(file);
    for (const rNode of rNodes) {
      nodeMap[rNode.id] = rNode;
    }
  }

  // Resolve dependencies & dependents
  let totalEdges = 0;
  for (const node of Object.values(nodeMap)) {
    for (const imp of node.imports) {
      if (imp.startsWith(".")) {
        const fileDir = path.dirname(node.path);
        const resolvedBase = path
          .normalize(path.join(fileDir, imp))
          .replace(/\\/g, "/");

        const candidates = [
          resolvedBase,
          `${resolvedBase}.ts`,
          `${resolvedBase}.tsx`,
          `${resolvedBase}.d.ts`,
          `${resolvedBase}/index.ts`,
          `${resolvedBase}/index.tsx`,
          `${resolvedBase}.css`,
        ];

        for (const cand of candidates) {
          if (nodeMap[cand]) {
            if (!node.dependencies.includes(cand)) {
              node.dependencies.push(cand);
              totalEdges++;
            }
            if (!nodeMap[cand].dependents.includes(node.id)) {
              nodeMap[cand].dependents.push(node.id);
            }
            break;
          }
        }
      }
    }
  }

  const nodes = Object.values(nodeMap);
  const stats = {
    totalFiles: nodes.length,
    totalEdges,
    components: nodes.filter((n) => n.type === "component").length,
    services: nodes.filter((n) => n.type === "service").length,
    hooks: nodes.filter((n) => n.type === "hook").length,
    types: nodes.filter((n) => n.type === "type").length,
    rustCommands: nodes.filter((n) => n.type === "rust-command").length,
  };

  return {
    generatedAt: new Date().toISOString(),
    stats,
    nodes: nodeMap,
  };
}

// CLI Execution
const args = process.argv.slice(2);
const graph = buildGraph();

if (args.includes("--stats") || args.length === 0) {
  console.log("\n=== Vault Codebase Knowledge Graph ===");
  console.log(`Generated At: ${graph.generatedAt}`);
  console.log(`Total Files:   ${graph.stats.totalFiles}`);
  console.log(`Total Edges:   ${graph.stats.totalEdges}`);
  console.log(`Components:    ${graph.stats.components}`);
  console.log(`Services:      ${graph.stats.services}`);
  console.log(`Hooks:         ${graph.stats.hooks}`);
  console.log(`Types:         ${graph.stats.types}`);
  console.log(`Rust Modules:  ${graph.stats.rustCommands}`);
  console.log("======================================\n");
}

const queryIdx = args.indexOf("--query");
if (queryIdx !== -1 && args[queryIdx + 1]) {
  const query = args[queryIdx + 1].toLowerCase();
  const matched = Object.values(graph.nodes).filter(
    (n) =>
      n.name.toLowerCase().includes(query) || n.id.toLowerCase().includes(query)
  );

  console.log(`\nQuery results for "${query}":`);
  for (const m of matched) {
    console.log(`\n- [${m.type.toUpperCase()}] ${m.id} (${m.loc} lines)`);
    console.log(`  Exports:      ${m.exports.join(", ") || "(none)"}`);
    console.log(`  Dependencies: ${m.dependencies.join(", ") || "(none)"}`);
    console.log(`  Dependents:   ${m.dependents.join(", ") || "(none)"}`);
  }
}

const outIdx = args.indexOf("--output");
const outputPath =
  outIdx !== -1 && args[outIdx + 1]
    ? args[outIdx + 1]
    : path.join(ROOT_DIR, "graphify.json");
fs.writeFileSync(outputPath, JSON.stringify(graph, null, 2), "utf-8");
console.log(
  `Knowledge graph written to: ${path.relative(ROOT_DIR, outputPath)}\n`
);
