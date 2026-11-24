import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readdir, readFile, lstat, realpath, rename, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { parse, stringify } from 'yaml';
import { idSchema, metadataSchema, recordSchema, editableSchema, type Editable, type ProjectRecord, type RecordList } from '../shared/records';

export class ConflictError extends Error {}
export class MissingError extends Error {}
export class RecordStore {
  private queue: Promise<unknown> = Promise.resolve();
  private constructor(private dir: string) {}
  static async open(root: string) {
    const dir = resolve(root, 'records');
    await mkdir(dir, { recursive: true });
    if ((await lstat(dir)).isSymbolicLink()) throw new Error('Records directory must not be a symlink');
    return new RecordStore(await realpath(dir));
  }
  private path(id: string) { return join(this.dir, idSchema.parse(id) + '.md'); }
  private serialize<T>(action: () => Promise<T>): Promise<T> {
    const task = this.queue.then(action, action);
    this.queue = task.then(() => undefined, () => undefined);
    return task;
  }
  async get(id: string): Promise<ProjectRecord> {
    const path = this.path(id);
    let raw: string;
    try {
      if (!(await lstat(path)).isFile()) throw new Error('Record must be a regular file');
      raw = await readFile(path, 'utf8');
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') throw new MissingError('Record not found');
      throw e;
    }
    const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(raw);
    if (!match) throw new Error('Missing YAML frontmatter');
    const metadata = metadataSchema.parse(parse(match[1], { maxAliasCount: 0 }));
    if (metadata.id !== id) throw new Error('Record ID does not match filename');
    const record = recordSchema.parse({ ...metadata, body: match[2] });
    return { ...record, revision: createHash('sha256').update(raw).digest('hex') };
  }
  async list(): Promise<RecordList> {
    const records: ProjectRecord[] = [], errors: RecordList['errors'] = [];
    for (const file of (await readdir(this.dir)).sort()) {
      if (!file.endsWith('.md')) continue;
      try { records.push(await this.get(file.slice(0, -3))); }
      catch (e) { errors.push({file, message: e instanceof Error ? e.message : 'Invalid record'}); }
    }
    return { records, errors };
  }
  private async persist(record: unknown) {
    const {body, ...metadata} = recordSchema.parse(record);
    delete metadata.revision;
    const path = this.path(String(metadata.id)), tmp = join(this.dir, '.' + randomUUID() + '.tmp');
    try {
      await writeFile(tmp, '---\n' + stringify(metadata) + '---\n' + body, { flag:'wx', flush:true });
      await rename(tmp, path);
    } finally { await unlink(tmp).catch(() => undefined); }
    return this.get(String(metadata.id));
  }
  create(title: string, type: Editable['type']) {
    return this.serialize(async () => this.persist({
      id: randomUUID(), title, type, status:'Concept', priority:'Normal', accent:'violet', tags:[], relationships:[], body:''
    }));
  }
  update(id: string, revision: string, changes: Editable) {
    return this.serialize(async () => {
      const current = await this.get(id);
      if (current.revision !== revision) throw new ConflictError('Record changed on disk. Reload before saving.');
      const {revision: _, ...previous} = current;
      return this.persist({...previous, ...editableSchema.parse(changes), id});
    });
  }
}
