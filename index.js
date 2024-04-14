import Database from 'better-sqlite3'
import fs from 'node:fs/promises'

const db = new Database('writefreely.db', { readonly: true, fileMustExist: true })

const stmt = db.prepare('SELECT slug, content FROM posts')

const markdown = 'markdown'

try {
  await fs.access(markdown)
} catch (error) {
  await fs.mkdir(markdown)
}

const promises = []
for (const row of stmt.iterate()) {
  promises.push(fs.writeFile(markdown + '/' + row.slug + '.md', row.content))
}

await Promise.all(promises)
