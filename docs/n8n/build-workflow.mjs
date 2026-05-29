/**
 * Generates recommendation-workflow.json (importable into n8n) by embedding
 * engine.js into the Code node. Run: `node docs/n8n/build-workflow.mjs`
 */
import { readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const engine = readFileSync(join(here, "engine.js"), "utf8");

const webhookId = randomUUID();

const workflow = {
  name: "i'm hungry — recommendation engine",
  nodes: [
    {
      parameters: {
        httpMethod: "POST",
        path: "imhungry-recommend",
        responseMode: "responseNode",
        options: {},
      },
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [0, 0],
      id: randomUUID(),
      name: "Webhook",
      webhookId,
    },
    {
      parameters: {
        jsCode: engine,
      },
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [260, 0],
      id: randomUUID(),
      name: "Engine",
    },
    {
      parameters: {
        respondWith: "allIncomingItems",
        options: {},
      },
      type: "n8n-nodes-base.respondToWebhook",
      typeVersion: 1.1,
      position: [520, 0],
      id: randomUUID(),
      name: "Respond to Webhook",
    },
  ],
  connections: {
    Webhook: { main: [[{ node: "Engine", type: "main", index: 0 }]] },
    Engine: {
      main: [[{ node: "Respond to Webhook", type: "main", index: 0 }]],
    },
  },
  settings: { executionOrder: "v1" },
};

writeFileSync(
  join(here, "recommendation-workflow.json"),
  JSON.stringify(workflow, null, 2),
);
console.log("Wrote recommendation-workflow.json");
