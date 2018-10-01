/* eslint-disable no-param-reassign */
import 'raf/polyfill'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { ServerLocation } from '@reach/router'
import Loadable from 'react-loadable'
import getDynamicAssets from '../build/getDynamicAssets'
import App from './App'

const normailizeURL = outputName => outputName.replace(/index.html$/, '')

const preloadPromise = Loadable.preloadAll()
export default async ({ assets, compilation, outputName }) => {
  await preloadPromise
  const moduleIds = []
  const ret = renderToString(
    <Loadable.Capture report={id => moduleIds.push(id)}>
      <ServerLocation url={normailizeURL(outputName)}>
        <App />
      </ServerLocation>
    </Loadable.Capture>
  )
  const dynamicAssets = getDynamicAssets(
    compilation,
    moduleIds,
    assets.publicPath
  )
  assets.js = dynamicAssets.js.concat(assets.js)
  assets.css = assets.css.concat(dynamicAssets.css)
  return ret
}
