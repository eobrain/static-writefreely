import Database from 'better-sqlite3'
import fs from 'node:fs/promises'

import { mkdirIfNecessary, find } from './file.js'
// import { pp } from 'passprint'

const databasePath = await find('writefreely.db')
console.log(`Database path: ${databasePath}`)

const db = new Database(databasePath, { readonly: true, fileMustExist: true })

const selectPosts = db.prepare(`
SELECT id, slug, title, created, content
FROM posts
WHERE pinned_position IS NULL
ORDER BY created DESC
`)
const selectPages = db.prepare(`
SELECT id, slug, title, content
FROM posts
WHERE pinned_position IS NOT NULL
ORDER BY pinned_position
`)

const contentDir = 'content'
const markdownDir = `${contentDir}/markdown`
await mkdirIfNecessary(contentDir)
await mkdirIfNecessary(markdownDir)

const slugSet = new Set()
function uniqueSlug (slug, id) {
  let actualSlug = slug || id // Use id if slug is empty
  while (slugSet.has(actualSlug)) {
    actualSlug += '_'
  }
  slugSet.add(actualSlug)
  return actualSlug
}

// Extract maekdown from DB and write to separate files, one per post,
// with all the writes happening aynchronously in parallel
const promises = []

const pageMetadata = []
for (const { id, slug, title, content } of selectPages.iterate()) {
  const actualSlug = uniqueSlug(slug, id)
  const actualTitle = title || slug || 'Page'
  promises.push(fs.writeFile(`${markdownDir}/${actualSlug}.md`, content))
  pageMetadata.push({ slug: actualSlug, title: actualTitle })
}
promises.push(fs.writeFile(`${contentDir}/page_metadata.json`, JSON.stringify(pageMetadata, null, 2)))

const postMetadata = []
for (const { id, slug, title, created, content } of selectPosts.iterate()) {
  const actualSlug = uniqueSlug(slug, id)
  const actualTitle = title || slug || 'Post'
  promises.push(fs.writeFile(`${markdownDir}/${actualSlug}.md`, content))
  postMetadata.push({ slug: actualSlug, title: actualTitle, created })
}
promises.push(fs.writeFile(`${contentDir}/post_metadata.json`, JSON.stringify(postMetadata, null, 2)))

await Promise.all(promises)
