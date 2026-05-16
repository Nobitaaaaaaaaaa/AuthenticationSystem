import React from 'react'
import Navbar from '../components/Navbar.jsx'
import Header from '../components/Header.jsx'

export default function Home() {
  return (
    <div className='flex flex-col items-center justify-center h-screen w-full bg-[url("/bg_img.png")] bg-cover bg-center'>

      <Navbar />
      <Header />

    </div>
  )
}