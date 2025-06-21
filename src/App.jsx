import { useState } from 'react'
import './App.css'
import { Route , Routes } from 'react-router-dom'

import Homepage from './homepage/home'
import EditHistory from './history/editpage' 
import DailyReport from './reports/reportpage'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Routes>
      <Route path='/' element = {<Homepage/>}></Route>
      <Route path='history' element = {<EditHistory/>}></Route>
       <Route path='report' element = {<DailyReport/>}></Route>
    </Routes>
    
  )
}

export default App
