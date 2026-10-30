import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from "react-router-dom"
import { ToastContainer } from "react-toastify";
import { ThemeProvider } from './theme';

// Fonts
import '@fontsource-variable/dm-sans';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow/700.css';
import '@fontsource/barlow/800.css';

// Icon + toast styles
import '@fortawesome/fontawesome-free/css/all.min.css'
import 'react-toastify/dist/ReactToastify.css'

import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <BrowserRouter>
      <App />
      <ToastContainer position="top-right" />
    </BrowserRouter>
  </ThemeProvider>
)
