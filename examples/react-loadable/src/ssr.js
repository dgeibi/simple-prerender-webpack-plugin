/* eslint-disable no-param-reassign */
import 'raf/polyfill'
import React from 'react'
import url from 'url'
import { renderToString } from 'react-dom/server'
import { ServerLocation } from '@reach/router'
import Loadable from '@7rulnik/react-loadable'
import getDynamicAssets from '../build/getDynamicAssets'
import App from './App'

const normailizeURL = filename =>
  url.resolve('/', filename).replace(/index.html$/, '')

const preloadPromise = Loadable.preloadAll()
export default async ({ assets, compilation, plugin }) => {
  await preloadPromise
  const modules = []
  const ret = renderToString(
    <Loadable.Capture report={moduleName => modules.push(moduleName)}>
      <ServerLocation url={normailizeURL(plugin.options.filename)}>
        <App />
      </ServerLocation>
    </Loadable.Capture>
  )
  const dynamicAssets = getDynamicAssets(compilation, modules)
  assets.js = dynamicAssets.js.concat(assets.js)
  assets.css = assets.css.concat(dynamicAssets.css)
  return ret
}
