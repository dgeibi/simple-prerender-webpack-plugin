import { h, render } from 'preact'

function App() {
  return <div>OH! {window.location.href}</div>
}

// eslint-disable-next-line
let exports

if (process.env.isSSR) {
  exports = url => {
    const { JSDOM } = require('jsdom')
    const dom = new JSDOM(``, {
      url: `https://example.org${url}`,
    })
    global.window = dom.window
    const renderToString = require('preact-render-to-string').render
    return renderToString(<App />)
  }
} else {
  const app = document.querySelector('#root')
  render(<App />, app, app.lastChild)
}

export default exports
