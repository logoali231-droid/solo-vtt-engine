import { mkdirSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const templatesDir = fileURLToPath(
  new URL(
    "../node_modules/convex/dist/esm/cli/codegen_templates/",
    import.meta.url,
  ),
);

const { apiCodegen } = await import(join(templatesDir, "api.js"));
const { serverCodegen } = await import(join(templatesDir, "server.js"));

// dataModel.js / readme.js transitively import optional deps not needed for
// codegen, so we reproduce the dynamic data model template inline. This matches
// what `npx convex dev` emits when generating from a local schema.ts.
function header(oneLineDescription) {
  return `/* eslint-disable */
  /**
   * ${oneLineDescription}
   *
   * THIS CODE IS AUTOMATICALLY GENERATED.
   *
   * To regenerate, run \`npx convex dev\`.
   * @module
   */
  `;
}
function dynamicDataModelDTS() {
  return `
  ${header("Generated data model types.")}
  import type { DataModelFromSchemaDefinition, DocumentByName, TableNamesInDataModel, SystemTableNames } from "convex/server";
  import type { GenericId } from "convex/values";
  import schema from "../schema.js";

  /**
   * The names of all of your Convex tables.
   */
  export type TableNames = TableNamesInDataModel<DataModel>;

  /**
   * The type of a document stored in Convex.
   *
   * @typeParam TableName - A string literal type of the table name (like "users").
   */
  export type Doc<TableName extends TableNames> = DocumentByName<DataModel, TableName>;

  /**
   * An identifier for a document in Convex.
   *
   * Convex documents are uniquely identified by their \`Id\`, which is accessible
   * on the \`_id\` field. To learn more, see [Document IDs](https://docs.convex.dev/using/document-ids).
   *
   * Documents can be loaded using \`db.get(tableName, id)\` in query and mutation functions.
   *
   * IDs are just strings at runtime, but this type can be used to distinguish them from other
   * strings when type checking.
   *
   * @typeParam TableName - A string literal type of the table name (like "users").
   */
  export type Id<TableName extends TableNames | SystemTableNames> = GenericId<TableName>;

  /**
   * A type describing your Convex data model.
   *
   * This type includes information about what tables you have, the type of
   * documents stored in those tables, and the indexes defined on them.
   *
   * This type is used to parameterize methods like \`queryGeneric\` and
   * \`mutationGeneric\` to make them type-safe.
   */
  export type DataModel = DataModelFromSchemaDefinition<typeof schema>;
  `;
}

const convexDir = fileURLToPath(new URL("../src/convex/", import.meta.url));
const outDir = join(convexDir, "_generated");
mkdirSync(outDir, { recursive: true });

// Discover function modules (mirrors `npx convex dev`): all .ts/.js files under
// the functions dir, excluding _generated, schema, auth.config, tsconfig, and
// declaration files.
const EXCLUDE_BASENAMES = new Set(["schema", "auth.config", "tsconfig"]);
const modulePaths = [];
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    if (statSync(abs).isDirectory()) {
      if (entry === "_generated") continue;
      walk(abs);
      continue;
    }
    if (!/\.(ts|js)$/.test(entry)) continue;
    if (entry.endsWith(".d.ts")) continue;
    const rel = relative(convexDir, abs);
    const base = rel.replace(/\.(ts|js)$/, "");
    if (EXCLUDE_BASENAMES.has(base)) continue;
    modulePaths.push(rel);
  }
}
walk(convexDir);
modulePaths.sort();

const api = apiCodegen(modulePaths, { useTypeScript: false });
writeFileSync(join(outDir, "api.d.ts"), api.DTS);
writeFileSync(join(outDir, "api.js"), api.JS);

const server = serverCodegen({ useTypeScript: false });
writeFileSync(join(outDir, "server.d.ts"), server.DTS);
writeFileSync(join(outDir, "server.js"), server.JS);

writeFileSync(join(outDir, "dataModel.d.ts"), dynamicDataModelDTS());

console.log("[gen-convex] modules:", modulePaths.join(", "));
console.log("[gen-convex] wrote files to", outDir);
