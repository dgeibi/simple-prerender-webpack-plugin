import React from 'react'
import { Link } from '@reach/router'

export default function Home() {
  return (
    <div>
      <span>Home</span> <Link to="/about">About</Link>
    </div>
  )
}
