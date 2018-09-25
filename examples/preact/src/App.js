import { h } from 'preact'

export default function App({ value }) {
  return (
    <div>
      OH! {window.location.href} {process.env.NODE_ENV} {value}
    </div>
  )
}
