import fs from 'node:fs/promises'
import showdown from 'showdown'

const converter = new showdown.Converter()

export async function writeFile (siteDir, { slug, content }) {
  const html = converter.makeHtml(content)
  return await fs.writeFile(siteDir + '/' + slug + '.html', html)
}
