import { useState } from 'react';
import Landing from './components/Landing.tsx';
import Simulator from './components/Simulator.tsx';
import './styles/effects.css';

type View = 'landing' | 'game';

export default function App() {
  const [view, setView] = useState<View>('landing');

  return (
    <div className="min-h-screen bg-[#F5F8FF] text-slate-800 selection:bg-blue-200">
      {view === 'landing' ? <Landing onStart={() => setView('game')} /> : <Simulator onExit={() => setView('landing')} />}
    </div>
  );
}
