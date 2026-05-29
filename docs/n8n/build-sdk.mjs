/**
 * Emits workflow.sdk.ts — n8n Workflow SDK code with engine.js embedded as the
 * Code node's jsCode. Run: `node docs/n8n/build-sdk.mjs`
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const engine = readFileSync(join(here, "engine.js"), "utf8");

const code = `import { workflow, trigger, node } from '@n8n/workflow-sdk';

const webhook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Webhook',
    parameters: {
      httpMethod: 'POST',
      path: '06eb28a9-0438-4ab0-b82a-b9d9e81e8f04',
      responseMode: 'responseNode',
      options: {}
    },
    position: [0, 0]
  },
  output: [{ body: { user_id: 'uuid', mode: 'surprise', surprise: true } }]
});

const engineNode = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Engine',
    parameters: {
      jsCode: ${JSON.stringify(engine)}
    },
    position: [260, 0]
  },
  output: [{ type: 'recipe', dish_name: 'Scrambled Eggs & Toast', cuisine: 'american', est_time_mins: 10, est_cost_range: '$2-4', deep_link: null, recipe_steps: ['Crack eggs'], rating: { score: 4.8, scale: 5, source: 'first_party', votes: 23 }, rank: 1 }]
});

const respond = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.1,
  config: {
    name: 'Respond to Webhook',
    parameters: {
      respondWith: 'allIncomingItems',
      options: {}
    },
    position: [520, 0]
  },
  output: [{}]
});

export default workflow('ScDcVTDSW1KXHtUv', 'imhungry')
  .add(webhook)
  .to(engineNode)
  .to(respond);
`;

writeFileSync(join(here, "workflow.sdk.ts"), code);
console.log("Wrote workflow.sdk.ts (" + code.length + " bytes)");
