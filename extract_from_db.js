import Database from 'better-sqlite3'
import fs from 'node:fs/promises'
import { mkdirIfNecessary } from './file.js'

const db = new Database('writefreely.db', { readonly: true, fileMustExist: true })

const stmt = db.prepare('SELECT id, slug, title, created, content FROM posts ORDER BY created DESC')

const markdownDir = 'markdown'
await mkdirIfNecessary(markdownDir)

// Extract maekdown from DB and write to separate files, one per post,
// with all the writes happening aynchronously in parallel
const promises = []
const postMetadata = []
for (const { id, slug, title, created, content } of stmt.iterate()) {
  promises.push(fs.writeFile(`${markdownDir}/${slug}-${id}.md`, content))
  postMetadata.push({ id, slug, title, created })
}
promises.push(fs.writeFile('post_metadata.json', JSON.stringify(postMetadata, null, 2)))

await Promise.all(promises)
