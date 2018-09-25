import { h, render } from 'preact'
import App from './App'

import('./base32')
  .then(x => x.default())
  .then(value => {
    const app = document.querySelector('#root')
    render(<App value={value} />, app, app.lastChild)
  })
