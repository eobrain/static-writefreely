import fs from 'node:fs/promises'
import showdown from 'showdown'
import { mkdirIfNecessary } from './file.js'
import Mustache from 'mustache'

const converter = new showdown.Converter()

// Read post metadata from JSON file
const postMetadata = JSON.parse(await fs.readFile('post_metadata.json'))

const siteDir = '_site'
await mkdirIfNecessary(siteDir)

const postTemplate = await fs.readFile('layout/post.html', 'utf8')

// Convert markdown to HTML and write to site directory
for (const { slug, title, created } of postMetadata) {
  const markdown = await fs.readFile(`markdown/${slug}.md`, 'utf8')
  const contentHtml = converter.makeHtml(markdown)
  const rendered = Mustache.render(postTemplate, { contentHtml, slug, title, created })
  await fs.writeFile(`${siteDir}/${slug}.html`, rendered)
}
