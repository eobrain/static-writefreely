import Database from 'better-sqlite3'
const db = new Database('writefreely.db', { readonly: true, fileMustExist: true })

const stmt = db.prepare('SELECT slug FROM posts')

for (const row of stmt.iterate()) {
  console.log(row.slug)
}
