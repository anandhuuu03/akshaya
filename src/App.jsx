import { useState } from 'react'
import './App.css'
import { Route , Routes } from 'react-router-dom'
import SignUpPage from './login/page'
import SimulationPage from './simulation/page'
import Quiz from './Components/Quiz/Quiz'
import AboutUs from './AboutUs/aboutus'
import QuizResult from './results/results'
import Homepage from './homepage/home'
import RegistrationPage from './registration/RegistrationPage'
import Resources from './resources/rpage'
import MockTest from './mocktest/mocktest'
import UniqueViewFeedback from './viewfeedback/page'
import FeedbackForm from './feedback/Feedback'
import ForgotPasswordPage from './login/ForgotPasswordPage'
import AdminModule from './admindash/AdminModule'
import UserPage from './userdetails/userpage'
import MockTestPage from './mocktestpage/mocktestpage'
import AdminLogin from './adminlogin/page'
import AdminResultsPage from './adminresults/adminresultpage'
function App() {
  const [count, setCount] = useState(0)

  return (
    <Routes>
      <Route path='/' element = {<SignUpPage/>}></Route>
      <Route path='simulation' element = {<SimulationPage/>}></Route>
      <Route path='Quiz' element = {<Quiz/>}></Route>
      <Route path='aboutus' element ={<AboutUs/>}></Route>
      <Route path='result' element ={<QuizResult/>}></Route>
      <Route path='forgot-password' element={<ForgotPasswordPage/>}></Route>
      <Route path='home' element = {<Homepage/>}></Route>
      <Route path='feedback' element = {<FeedbackForm/>}></Route>
      <Route path='viewfeedback' element = {<UniqueViewFeedback/>}></Route>
      <Route path='resources' element = {<Resources/>}></Route>
      <Route path='mocktest' element = {<MockTest/>}></Route>
      <Route path='registration' element = {<RegistrationPage/>}></Route>
      <Route path='admindash' element={<AdminModule/>}></Route>
      <Route path='userdata' element={<UserPage/>}></Route>
      <Route path='adminlogin' element={<AdminLogin/>}></Route>
      <Route path='mocktestpage' element={<MockTestPage/>}></Route>
      <Route path='adminresults' element={<AdminResultsPage/>}></Route>
    </Routes>
    
  )
}

export default App
