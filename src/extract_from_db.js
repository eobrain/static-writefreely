import Database from 'better-sqlite3'
import fs from 'node:fs/promises'
import { parse } from 'ini'

import { mkdirIfNecessary, find } from './file.js'
// import { pp } from 'passprint'

const databasePath = await find('writefreely.db')
const configPath = databasePath.replace(/writefreely\.db$/, 'config.ini')
console.log(`Database path: ${databasePath}`)

const configText = await fs.readFile(configPath, { encoding: 'utf-8' })
const configIni = parse(configText)
const config = {
  siteName: configIni.app.site_name,
  siteDescription: configIni.app.site_description,
  host: configIni.app.host
}

const db = new Database(databasePath, { readonly: true, fileMustExist: true })

const selectPosts = db.prepare(`
SELECT id, slug, title, created, content
FROM posts
WHERE pinned_position IS NULL AND slug IS NOT NULL
ORDER BY created DESC
`)
const selectDrafts = db.prepare(`
SELECT id, slug, title, created, content
FROM posts
WHERE pinned_position IS NULL AND slug IS NULL
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

function extractFrontMatter (inputMarkdown) {
  const lines = inputMarkdown.split('\n')
  const frontMatter = {}
  let i = 0
  if (lines[i] === '---') {
    i++
    while (lines[i] !== '---') {
      const [key, value] = lines[i].split(': ')
      frontMatter[key] = value
      i++
    }
    i++
  }
  const markdown = lines.slice(i).join('\n')
  return { frontMatter, markdown }
}

// Extract maekdown from DB and write to separate files, one per post,
// with all the writes happening aynchronously in parallel
const promises = []
promises.push(fs.writeFile(`${contentDir}/config.json`, JSON.stringify(config, null, 2)))

const pageMetadata = []
for (const { id, slug, title, content } of selectPages.iterate()) {
  const { frontMatter, markdown } = extractFrontMatter(content)
  const actualSlug = uniqueSlug(slug || frontMatter.slug, id)
  const actualTitle = title || frontMatter.title || slug || 'Post'
  promises.push(fs.writeFile(`${markdownDir}/${actualSlug}.md`, markdown))
  pageMetadata.push({ slug: actualSlug, title: actualTitle })
}
promises.push(fs.writeFile(`${contentDir}/page_metadata.json`, JSON.stringify(pageMetadata, null, 2)))

const postMetadata = []
for (const { id, slug, title, created, content } of selectPosts.iterate()) {
  const { frontMatter, markdown } = extractFrontMatter(content)
  const actualSlug = uniqueSlug(slug || frontMatter.slug, id)
  const actualTitle = title || frontMatter.title || slug || 'Post'
  promises.push(fs.writeFile(`${markdownDir}/${actualSlug}.md`, markdown))
  postMetadata.push({ slug: actualSlug, title: actualTitle, created: created || frontMatter.date })
}
promises.push(fs.writeFile(`${contentDir}/post_metadata.json`, JSON.stringify(postMetadata, null, 2)))

const draftMetadata = []
for (const { id, slug, title, created, content } of selectDrafts.iterate()) {
  const { frontMatter, markdown } = extractFrontMatter(content)
  const actualSlug = uniqueSlug(slug || frontMatter.slug, id)
  const actualTitle = title || frontMatter.title || slug || 'Post'
  promises.push(fs.writeFile(`${markdownDir}/${actualSlug}.md`, markdown))
  draftMetadata.push({ slug: actualSlug, title: actualTitle, created: created || frontMatter.date })
}
promises.push(fs.writeFile(`${contentDir}/draft_metadata.json`, JSON.stringify(draftMetadata, null, 2)))

await Promise.all(promises)
