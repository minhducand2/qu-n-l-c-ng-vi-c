import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src=readFileSync(new URL('../lib/shared-task-workflow.ts',import.meta.url),'utf8');
// Static checks only. Run tsc for compilation, and perform API role tests separately.
for(const term of ['canTransition','applyReviewDecision','assessSharedTask','completedAt','reviewedBy'])assert.ok(src.includes(term));
console.log('Workflow source checks passed (not an API security test).');
