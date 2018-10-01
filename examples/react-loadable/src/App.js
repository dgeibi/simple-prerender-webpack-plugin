import React from 'react'
import Loadable from 'react-loadable'
import { Router } from '@reach/router'

const Home = Loadable({
  loader: () => import('./pages/Home'),
  loading: () => 'loading...',
})

const About = Loadable({
  loader: () => import('./pages/About'),
  loading: () => 'loading...',
})

export default function App() {
  return (
    <Router>
      <Home path="/" />
      <About path="about" />
    </Router>
  )
}
