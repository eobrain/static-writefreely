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

async function renderMarkdown (markdown, slug, template, title, created) {
  const contentHtml = converter.makeHtml(markdown)
  const rendered = Mustache.render(template, { contentHtml, slug, title, created })
  await fs.writeFile(`${siteDir}/${slug}.html`, rendered)
}

async function render (slug, template, title, created) {
  const markdown = await fs.readFile(`content/markdown/${slug}.md`, 'utf8')
  renderMarkdown(markdown, slug, template, title, created)
}

const postTemplate = await fs.readFile('layout/post.html', 'utf8')
const pageTemplate = postTemplate // TODO: Create a separate layout for pages
const homeTemplate = postTemplate // TODO: Create a separate layout for the home page

// Convert markdown to HTML and write to site directory
for (const { slug, title } of pageMetadata) {
  await render(slug, pageTemplate, { slug, title })
}
for (const { slug, title, created } of postMetadata) {
  await render(slug, postTemplate, { slug, title, created })
}

// Generate home page
let homeContent = ''
for (const { slug, title, created } of postMetadata) {
  homeContent += `* [${title}](${slug}.html) - ${created}\n`
  await render(slug, postTemplate, { slug, title, created })
}
renderMarkdown(homeContent, 'index', homeTemplate, 'Blog') // Replace 'Blog' with the actual blog title
