import fs from 'node:fs/promises'
import { glob } from 'glob'

export async function mkdirIfNecessary (dir) {
  try {
    await fs.access(dir)
  } catch (error) {
    await fs.mkdir(dir)
  }
}

export async function find (name) {
  for (const root of ['.', '../**', '../../**/**']) {
    const matches = await glob(`${root}/${name}`)
    if (matches.length > 0) {
      return matches[0]
    }
  }
  throw new Error(`Could not find "${name}" in any of the expected locations`)
}
