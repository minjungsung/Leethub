import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App/App'
import { HashRouter as Router, Route, Routes } from 'react-router-dom' // Use HashRouter
import Welcome from '../components/Welcome'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route
          path='/welcome'
          element={<Welcome />}
        />
        <Route
          path='*'
          element={<App />}
        />
        {/* Define other routes */}
      </Routes>
    </Router>
  </React.StrictMode>
)
