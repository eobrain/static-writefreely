import Database from 'better-sqlite3'
import fs from 'node:fs/promises'
import { writeFile } from './file.js'

const db = new Database('writefreely.db', { readonly: true, fileMustExist: true })

const stmt = db.prepare('SELECT slug, content FROM posts')

const siteDir = 'site'

try {
  await fs.access(siteDir)
} catch (error) {
  await fs.mkdir(siteDir)
}

const promises = []
for (const row of stmt.iterate()) {
  promises.push(writeFile(siteDir, row))
}

await Promise.all(promises)
