import React from 'react'
import { Link } from '@reach/router'
import './About.css'

export default function About() {
  return (
    <div>
      <Link to="/">Home</Link> <span className="about">About</span>
    </div>
  )
}
