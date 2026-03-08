import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from "react-router-dom"
import { ToastContainer } from "react-toastify";

import 'bootstrap/dist/css/bootstrap.min.css'
import 'admin-lte/dist/css/adminlte.min.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import 'react-toastify/dist/ReactToastify.css'

import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'admin-lte/dist/js/adminlte.min.js'

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <BrowserRouter>
//     <App />
//     <ToastContainer position="top-right" />
//     </BrowserRouter>
//   </React.StrictMode>,
// )

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
    <ToastContainer position="top-right" />
  </BrowserRouter>
)
