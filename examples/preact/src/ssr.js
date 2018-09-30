import { h } from 'preact'
import { render } from 'preact-render-to-string'
import App from './App'

export default async ({ plugin }) => {
  const { JSDOM } = require('jsdom')
  const dom = new JSDOM(``, {
    url: `https://example.org/${plugin.options.filename}`,
  })
  global.window = dom.window
  const value = await import('./base32').then(x => x.default())
  return render(<App value={value} />)
}
