import React from 'react'
import { hydrate } from 'react-dom'
import Loadable from '@7rulnik/react-loadable'
import App from './App'

Loadable.preloadReady().then(() => {
  const app = document.querySelector('#root')
  hydrate(<App />, app)
})
