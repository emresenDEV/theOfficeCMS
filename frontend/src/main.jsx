import { StrictMode } from 'react' //for development, catches bugs early/depreciated APIs.
import { createRoot } from 'react-dom/client' //future-proof, improve performance, enables React18. Alternative to using ReactDOM.render (which updates one at a time), batches updates into one render-more efficient. 
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
