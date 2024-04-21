import fs from 'node:fs/promises'
import showdown from 'showdown'
import { mkdirIfNecessary } from './file.js'
import Mustache from 'mustache'
// import { pp } from 'passprint'

const converter = new showdown.Converter({ tables: true })

// Read metadata from JSON files
const pageMetadata = JSON.parse(await fs.readFile('content/page_metadata.json'))
const postMetadata = JSON.parse(await fs.readFile('content/post_metadata.json'))

const siteDir = '_site'
await mkdirIfNecessary(siteDir)

const head = await fs.readFile('layout/head.html', 'utf8')

async function renderWrite (markdown, slug, template, title, created, prev, next) {
  const contentHtml = converter.makeHtml(markdown)
  const rendered = Mustache.render(template, { contentHtml, slug, title, created, prev, next, pageMetadata }, { head })
  await fs.writeFile(`${siteDir}/${slug}.html`, rendered)
}

async function readRenderWrite (slug, template, title, created, prev, next) {
  const markdown = await fs.readFile(`content/markdown/${slug}.md`, 'utf8')
  await renderWrite(markdown, slug, template, title, created, prev, next)
}

const pageTemplate = await fs.readFile('layout/page.html', 'utf8')
const postTemplate = await fs.readFile('layout/post.html', 'utf8')
const homeTemplate = await fs.readFile('layout/home.html', 'utf8')

// Convert markdown to HTML and write to site directory
for (const { slug, title } of pageMetadata) {
  await readRenderWrite(slug, pageTemplate, title)
}
for (let i = 0; i < postMetadata.length; i++) {
  const { slug, title, created } = postMetadata[i]
  await readRenderWrite(slug, postTemplate, title, created, postMetadata[i - 1], postMetadata[i + 1])
}

// Generate home page
let homeContent = ''
for (const { slug, title, created } of postMetadata) {
  homeContent += `* [${title}](${slug}.html) - <time>${created}</time>\n`
}
await renderWrite(homeContent, 'index', homeTemplate, 'Blog') // Replace 'Blog' with the actual blog title
