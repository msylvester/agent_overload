#!/usr/bin/env npx tsx

/**
 * Mermaid Diagram Generator for LangGraph Workflows
 *
 * Usage: npx tsx mermaid_run.ts <workflow_file.ts>
 *
 * This script:
 * 1. Imports the specified workflow file
 * 2. Extracts the compiled graph
 * 3. Generates a Mermaid diagram
 * 4. Saves it as both .mmd and .png files
 */

import { execSync } from "child_process";
import fs from "fs/promises";
import path from "path";

async function generateMermaidDiagram(workflowPath: string) {
  try {
    // Resolve the absolute path
    const absolutePath = path.resolve(process.cwd(), workflowPath);
    const workflowDir = path.dirname(absolutePath);
    const workflowName = path.basename(
      absolutePath,
      path.extname(absolutePath)
    );

    console.log(`📊 Generating Mermaid diagram for: ${workflowName}`);
    console.log(`📁 Workflow path: ${absolutePath}`);

    // Dynamically import the workflow file
    const workflowModule = await import(absolutePath);

    // Find the compiled graph (look for common export names)
    let graph = null;
    const possibleExports = [
      "app",
      "workflow",
      "graph",
      "agenticApp",
      "default",
    ];

    for (const exportName of possibleExports) {
      if (workflowModule[exportName]) {
        graph = workflowModule[exportName];
        console.log(`✓ Found graph export: "${exportName}"`);
        break;
      }
    }

    if (!graph) {
      console.error("❌ Could not find compiled graph in the workflow file.");
      console.error(
        "   Expected exports: app, workflow, graph, agenticApp, or default"
      );
      console.error("   Available exports:", Object.keys(workflowModule));
      process.exit(1);
    }

    // Check if it's a compiled graph with getGraph method
    if (typeof graph.getGraph !== "function") {
      console.error(
        "❌ The exported object does not have a getGraph() method."
      );
      console.error(
        "   Make sure to export the compiled graph (workflow.compile())"
      );
      process.exit(1);
    }

    // Generate Mermaid diagram
    console.log("🎨 Generating Mermaid syntax...");
    const mermaidSyntax = graph.getGraph().drawMermaid();

    // Save Mermaid syntax to .mmd file
    const mmdPath = path.join(workflowDir, `${workflowName}.mmd`);
    await fs.writeFile(mmdPath, mermaidSyntax, "utf-8");
    console.log(`✓ Saved Mermaid syntax: ${mmdPath}`);

    // Try to convert to PNG using mermaid-cli
    const pngPath = path.join(workflowDir, `${workflowName}.png`);

    try {
      console.log("🖼️  Converting to PNG...");

      // Check if mmdc is installed
      try {
        execSync("npx -y @mermaid-js/mermaid-cli --version", { stdio: "pipe" });
      } catch {
        console.log("📦 Installing @mermaid-js/mermaid-cli...");
      }

      // Generate PNG using mmdc
      execSync(
        `npx -y @mermaid-js/mermaid-cli@latest -i "${mmdPath}" -o "${pngPath}" -b transparent`,
        { stdio: "inherit" }
      );

      console.log(`✓ Saved PNG diagram: ${pngPath}`);
    } catch (error) {
      console.warn(
        "⚠️  Could not convert to PNG. The .mmd file has been saved."
      );
      console.warn("   To convert manually, install mermaid-cli:");
      console.warn("   npm install -g @mermaid-js/mermaid-cli");
      console.warn(`   mmdc -i "${mmdPath}" -o "${pngPath}"`);
    }

    // Also save as SVG (better quality)
    try {
      const svgPath = path.join(workflowDir, `${workflowName}.svg`);
      execSync(
        `npx -y @mermaid-js/mermaid-cli@latest -i "${mmdPath}" -o "${svgPath}" -b transparent`,
        { stdio: "inherit" }
      );
      console.log(`✓ Saved SVG diagram: ${svgPath}`);
    } catch (error) {
      // SVG generation failed, but that's okay
    }

    console.log("\n✨ Done! Files generated:");
    console.log(`   - ${mmdPath} (Mermaid source)`);
    console.log(`   - ${pngPath} (PNG image)`);
    console.log(
      `   - ${path.join(workflowDir, `${workflowName}.svg`)} (SVG image)`
    );
  } catch (error) {
    console.error("❌ Error generating Mermaid diagram:");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      if (error.stack) {
        console.error("\nStack trace:");
        console.error(error.stack);
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// Parse command-line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: npx tsx mermaid_run.ts <workflow_file.ts>");
  console.error("\nExample:");
  console.error(
    "  npx tsx mermaid_run.ts temporal_router_integration_workflow.ts"
  );
  process.exit(1);
}

const workflowPath = args[0];

// Run the generator
generateMermaidDiagram(workflowPath);
