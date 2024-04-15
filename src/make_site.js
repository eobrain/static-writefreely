import fs from 'node:fs/promises'
import showdown from 'showdown'
import { mkdirIfNecessary } from './file.js'
import Mustache from 'mustache'

const converter = new showdown.Converter()

// Read metadata from JSON files
const pageMetadata = JSON.parse(await fs.readFile('content/page_metadata.json'))
const postMetadata = JSON.parse(await fs.readFile('content/post_metadata.json'))

const siteDir = '_site'
await mkdirIfNecessary(siteDir)

async function render (slug, template, title, created) {
  const markdown = await fs.readFile(`content/markdown/${slug}.md`, 'utf8')
  const contentHtml = converter.makeHtml(markdown)
  const rendered = Mustache.render(template, { contentHtml, slug, title, created })
  await fs.writeFile(`${siteDir}/${slug}.html`, rendered)
}

const postTemplate = await fs.readFile('layout/post.html', 'utf8')
const pageTemplate = postTemplate // TODO: Create a separate layout for pages

// Convert markdown to HTML and write to site directory
for (const { slug, title } of pageMetadata) {
  await render(slug, pageTemplate, { slug, title })
}
for (const { slug, title, created } of postMetadata) {
  await render(slug, postTemplate, { slug, title, created })
}
