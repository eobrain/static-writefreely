import fs from 'node:fs/promises'

export async function mkdirIfNecessary (dir) {
  try {
    await fs.access(dir)
  } catch (error) {
    await fs.mkdir(dir)
  }
}
