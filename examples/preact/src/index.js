import { h, render } from 'preact'
import App from './App'

const app = document.querySelector('#root')
render(<App />, app, app.lastChild)
