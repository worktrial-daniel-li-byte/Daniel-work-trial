import { chromium } from 'playwright'

const SYSTEM_CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta',
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
]

async function tryLaunch(options) {
  return await chromium.launch(options)
}

export async function launchBrowser({ headless = true } = {}) {
  const attempts = []

  try {
    return await tryLaunch({ headless, channel: 'chrome' })
  } catch (err) {
    attempts.push(`channel=chrome: ${err.message.split('\n')[0]}`)
  }

  const fs = await import('node:fs')
  for (const path of SYSTEM_CHROME_PATHS) {
    try {
      if (!fs.existsSync(path)) continue
      return await tryLaunch({ headless, executablePath: path })
    } catch (err) {
      attempts.push(`${path}: ${err.message.split('\n')[0]}`)
    }
  }

  try {
    return await tryLaunch({ headless })
  } catch (err) {
    attempts.push(`bundled chromium: ${err.message.split('\n')[0]}`)
  }

  const msg = [
    'Could not launch a Chromium-based browser.',
    'Tried in order:',
    ...attempts.map((a) => `  - ${a}`),
    '',
    'Fix options:',
    '  1) Install Google Chrome at /Applications/Google Chrome.app, OR',
    '  2) Run: npx playwright install chromium',
  ].join('\n')
  throw new Error(msg)
}
