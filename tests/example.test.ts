import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { RecordStore } from '../server/store';
import { auditRecords } from '../shared/audit';
import { indexRepository } from '../server/repository';
test('Emberfall fixture contains valid connected records and inspectable Rust sources', async()=>{
  const root=resolve('examples/emberfall');
  const data=await (await RecordStore.open(resolve(root,'.prism'))).list();
  assert.equal(data.errors.length,0);
  assert.equal(data.records.length,19);
  assert.deepEqual(auditRecords(data.records),[]);
  const {files}=await indexRepository(root);
  for(const path of ['Cargo.toml','src/main.rs','src/lib.rs','docs/game-design.md','tests/exploration.rs'])assert.ok(files.some(f=>f.path===path),path);
});
