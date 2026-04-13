import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Room from './pages/Room';
import Prefs from './pages/Prefs';
import Results from './pages/Results';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:code" element={<Room />} />
        <Route path="/room/:code/prefs" element={<Prefs />} />
        <Route path="/room/:code/results" element={<Results />} />
      </Routes>
    </BrowserRouter>
  );
}
