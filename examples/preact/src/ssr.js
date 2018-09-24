import { h } from 'preact'
import { render } from 'preact-render-to-string'
import App from './App'

export default url => {
  const { JSDOM } = require('jsdom')
  const dom = new JSDOM(``, {
    url: `https://example.org${url}`,
  })
  global.window = dom.window
  return render(<App />)
}
