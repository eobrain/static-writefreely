import fs from 'node:fs/promises'
import showdown from 'showdown'
import { mkdirIfNecessary } from './file.js'

const converter = new showdown.Converter()

// Read post metadata from JSON file
const postMetadata = JSON.parse(await fs.readFile('post_metadata.json'))

const siteDir = '_site'
await mkdirIfNecessary(siteDir)

// Convert markdown to HTML and write to site directory
for (const { slug, id } of postMetadata) {
  const markdown = await fs.readFile(`markdown/${slug}-${id}.md`, 'utf8')
  const html = converter.makeHtml(markdown)
  await fs.writeFile(`${siteDir}/${slug}-${id}.html`, html)
}
