import React from 'react'
import { Routes, Route } from 'react-router-dom'

import Landing from './Pages/landing'
import Home    from './Pages/home'
import Signup  from './Pages/signup'
import Login   from './Pages/login'

const App = () => {
  return (
    <Routes>
      <Route path='/'       element={<Landing />} />
      <Route path='/home'   element={<Home />} />
      <Route path='/signup' element={<Signup />} />
      <Route path='/login'  element={<Login />} />
    </Routes>
  )
}

export default App