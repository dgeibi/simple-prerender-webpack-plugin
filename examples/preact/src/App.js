import { h } from 'preact'

export default function App() {
  return (
    <div>
      OH! {window.location.href} {process.env.NODE_ENV}
    </div>
  )
}
