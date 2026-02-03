/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  
  const [gameState, setGameState] = useState('waiting'); // waiting, flying, crashed
  const [multiplier, setMultiplier] = useState(1.00);
  const [crashPoint, setCrashPoint] = useState(0);
  const [countdown, setCountdown] = useState(5);
  
 
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem('aviator_balance');
    return saved ? parseFloat(saved) : 1000.00;
  });
  const [betAmount, setBetAmount] = useState(10);
  const [hasBet, setHasBet] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('aviator_history');
    return saved ? JSON.parse(saved) : [];
  });

  
  const multiplierRef = useRef(1.00);
  const audioRefs = useRef({
    tick: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
    fly: new Audio('https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3'),
    crash: new Audio('https://assets.mixkit.co/active_storage/sfx/123/123-preview.mp3'),
    win: new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'),
  });

  
  const playSound = (name, loop = false) => {
    if (isMuted) return;
    const sfx = audioRefs.current[name];
    if (sfx) {
      sfx.currentTime = 0;
      sfx.loop = loop;
      sfx.play().catch(() => {}); 
    }
  };

  const stopSound = (name) => {
    const sfx = audioRefs.current[name];
    if (sfx) {
      sfx.pause();
      sfx.currentTime = 0;
    }
  };

  
  useEffect(() => {
    localStorage.setItem('aviator_balance', balance.toString());
    localStorage.setItem('aviator_history', JSON.stringify(history));
  }, [balance, history]);

  
  useEffect(() => {
    let interval;

    const startFlight = () => {
      const isInstantCrash = Math.random() < 0.1;
      const point = isInstantCrash ? 1.00 : (Math.random() * 8) + 1.01;
      setCrashPoint(parseFloat(point.toFixed(2)));
      setGameState('flying');
    };

    const triggerCrash = () => {
      stopSound('fly');
      playSound('crash');
      setGameState('crashed');

      const newEntry = {
        val: multiplierRef.current.toFixed(2),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setHistory(prev => [newEntry, ...prev].slice(0, 20));
      setHasBet(false);

      setTimeout(() => {
        setCountdown(5);
        setGameState('waiting');
      }, 3000);
    };

    if (gameState === 'waiting') {
      stopSound('fly');
      setMultiplier(1.00);
      multiplierRef.current = 1.00;
      setHasCashedOut(false);
      setWinAmount(0);
      
      if (countdown > 0) {
        playSound('tick');
        interval = setInterval(() => setCountdown(prev => prev - 1), 1000);
      } else {
        startFlight();
      }
    } else if (gameState === 'flying') {
      playSound('fly', true);
      interval = setInterval(() => {
        
        multiplierRef.current += 0.01 * (multiplierRef.current * 0.15); 
        const currentMult = parseFloat(multiplierRef.current.toFixed(2));
        
        if (currentMult >= crashPoint) {
          triggerCrash();
        } else {
          setMultiplier(currentMult);
        }
      }, 60);
    }

    return () => clearInterval(interval);
  }, [gameState, countdown, crashPoint]);

  
    

  const handlePlaceBet = () => {
    if (balance >= betAmount && gameState === 'waiting' && !hasBet) {
      setBalance(prev => prev - betAmount);
      setHasBet(true);
      
      playSound('tick');
    }
  };

  const handleCashOut = () => {
    if (gameState === 'flying' && hasBet && !hasCashedOut) {
      const win = betAmount * multiplier;
      setBalance(prev => prev + win);
      setWinAmount(win);
      setHasCashedOut(true);
      playSound('win');
    }
  };

  
  const getHistoryColor = (val) => {
    if (val < 2) return 'text-rose-500';
    if (val < 5) return 'text-amber-400';
    if (val < 10) return 'text-emerald-400';
    return 'text-fuchsia-500 font-bold drop-shadow-sm';
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] text-slate-100 p-4 font-sans flex flex-col items-center">
      <div className="w-full max-w-5xl flex justify-between items-center mb-4 bg-[#161d24] p-4 rounded-2xl border border-white/5">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black italic tracking-tighter text-red-500 flex items-center gap-2">
            <span className="bg-red-500 text-white px-2 rounded-md not-italic text-sm">PRO</span> AVIATOR
          </h1>
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="text-slate-400 hover:text-white transition"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest leading-none mb-1">Total Balance</p>
            <p className="text-xl font-mono text-emerald-400 font-bold">${balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <div className="relative h-[400px] bg-[#161d24] rounded-3xl overflow-hidden border border-white/5 flex items-center justify-center shadow-2xl">
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            <div className="relative z-10 text-center select-none">
              {gameState === 'waiting' && (
                <div className="space-y-2">
                  <p className="text-slate-500 uppercase text-xs font-bold tracking-[0.3em]">Next Round Starting</p>
                  <p className="text-7xl font-black text-white tabular-nums">{countdown}s</p>
                  <div className="w-48 h-1 bg-slate-800 rounded-full mx-auto overflow-hidden">
                    <div 
                      className="h-full bg-red-500 transition-all duration-1000 ease-linear" 
                      style={{ width: `${(countdown / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              
              {gameState === 'flying' && (
                <div className="transform transition-transform">
                  <p className={`text-8xl font-black tracking-tighter ${hasCashedOut ? 'text-emerald-400' : 'text-white'}`}>
                    {multiplier.toFixed(2)}x
                  </p>
                </div>
              )}

              {gameState === 'crashed' && (
                <div className="animate-bounce">
                  <p className="text-rose-500 text-2xl font-black uppercase tracking-widest mb-2">FLEW AWAY!</p>
                  <p className="text-white/20 text-7xl font-black">{multiplier.toFixed(2)}x</p>
                </div>
              )}
            </div>
            {gameState === 'flying' && (
              <div 
                className="absolute transition-all duration-[60ms] ease-linear pointer-events-none"
                style={{ 
                  bottom: `${Math.min(15 + multiplier * 6, 75)}%`, 
                  left: `${Math.min(10 + multiplier * 7, 80)}%` 
                }}
              >
                <div className="relative">
                  <span className="text-5xl block transform -rotate-12 drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]">✈️</span>
                  <div className="absolute top-1/2 right-full w-24 h-[2px] bg-gradient-to-l from-red-500 to-transparent opacity-50 blur-sm"></div>
                </div>
              </div>
            )}
          </div>
          <div className="bg-[#161d24] p-6 rounded-3xl border border-white/5 shadow-xl flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {[10, 25, 50, 100].map(amt => (
                  <button 
                    key={amt}
                    onClick={() => setBetAmount(amt)}
                    className={`py-2 rounded-xl text-xs font-bold transition ${betAmount === amt ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-[#0b0e11] text-slate-400 hover:bg-[#1f2933]'}`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                <input 
                  type="number" 
                  value={betAmount} 
                  onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#0b0e11] border border-white/5 rounded-2xl py-4 pl-8 pr-4 text-2xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-red-500/50 transition"
                />
              </div>
            </div>

            <div className="flex-1">
              {gameState === 'waiting' ? (
                <button 
                  onClick={handlePlaceBet}
                  disabled={hasBet || balance < betAmount}
                  className={`w-full h-full min-h-[100px] rounded-2xl font-black text-2xl transition-all shadow-xl flex flex-col items-center justify-center gap-1
                    ${hasBet 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed uppercase text-sm' 
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 active:scale-[0.98]'}
                  `}
                >
                  {hasBet ? 'Waiting for Round...' : 'BET'}
                </button>
              ) : (
                <button 
                  onClick={handleCashOut}
                  disabled={!hasBet || hasCashedOut || gameState !== 'flying'}
                  className={`w-full h-full min-h-[100px] rounded-2xl font-black text-2xl transition-all shadow-xl flex flex-col items-center justify-center
                    ${(!hasBet || hasCashedOut) 
                      ? 'bg-[#1f2933] text-slate-600' 
                      : 'bg-orange-500 hover:bg-orange-400 text-slate-950 animate-pulse shadow-orange-500/40'}
                  `}
                >
                  {hasCashedOut ? (
                    <>
                      <span className="text-[10px] uppercase tracking-widest opacity-60">You Won</span>
                      <span className="text-3xl font-mono">${winAmount.toFixed(2)}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] uppercase tracking-widest opacity-80">Cash Out</span>
                      <span className="text-3xl font-mono">${(betAmount * multiplier).toFixed(2)}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="bg-[#161d24] rounded-3xl border border-white/5 p-4 flex flex-col h-[550px] lg:h-auto">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">History</h3>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">Last 20</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {history.length === 0 && (
              <div className="h-full flex items-center justify-center text-slate-600 italic text-xs text-center">
                Waiting for game results...
              </div>
            )}
            {history.map((game, i) => (
              <div key={i} className="flex justify-between items-center bg-[#0b0e11] p-3 rounded-xl border border-white/5 hover:border-white/10 transition">
                <span className="text-[10px] font-mono text-slate-500">{game.time}</span>
                <span className={`text-sm font-black ${getHistoryColor(parseFloat(game.val))}`}>
                  {game.val}x
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Luck Rate</p>
                <p className="text-lg font-mono font-bold text-white">
                  {(history.reduce((a, b) => a + parseFloat(b.val), 0) / (history.length || 1)).toFixed(2)}x
                </p>
              </div>
              <div className="text-right">
                <div className="w-12 h-12 rounded-full border-2 border-slate-800 flex items-center justify-center">
                   <span className="text-[10px] font-bold text-slate-500">{history.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1f2933; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;