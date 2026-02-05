import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, Activity, ShieldCheck, Trash2, PlusCircle, AlertCircle } from 'lucide-react';

const INITIAL_RESOURCES = [15, 12, 10];

export default function DeadlockApp() {
  const [mode, setMode] = useState('Hybrid'); 
  const [processes, setProcesses] = useState([
    { id: 0, status: 'Active', allocation: [2, 1, 1], max: [5, 4, 3], timestamp: 1000 },
    { id: 1, status: 'Active', allocation: [1, 2, 1], max: [3, 5, 2], timestamp: 1010 },
  ]);
  const [available, setAvailable] = useState([12, 9, 8]);
  const [logs, setLogs] = useState([{ msg: "System live. Mode: Hybrid", type: "info" }]);
  const [perfData, setPerfData] = useState([]);

  // --- The Validation Engine ---
  const checkSafety = (currAvail, currProcs) => {
    let work = [...currAvail];
    let finish = currProcs.map(p => p.status !== 'Active');
    let ops = 0;
    while (true) {
      let found = false;
      for (let i = 0; i < currProcs.length; i++) {
        ops++;
        if (!finish[i]) {
          const p = currProcs[i];
          const need = p.max.map((m, idx) => m - p.allocation[idx]);
          if (need.every((val, idx) => val <= work[idx])) {
            work = work.map((v, idx) => v + p.allocation[idx]);
            finish[i] = true;
            found = true;
          }
        }
      }
      if (!found) break;
    }
    return { isSafe: finish.every(v => v), ops };
  };

  const handleRequest = (pid) => {
    const req = [1, 1, 1]; // Standard request unit
    let newProcs = JSON.parse(JSON.stringify(processes));
    let target = newProcs.find(p => p.id === pid);
    let newAvail = available.map((v, i) => v - req[i]);

    if (newAvail.some(v => v < 0)) {
      addLog(`P${pid} Denied: Resources Exhausted`, "error");
      return;
    }

    target.allocation = target.allocation.map((v, i) => v + req[i]);
    const { isSafe, ops } = checkSafety(newAvail, newProcs);

    setPerfData(prev => [...prev.slice(-19), { time: prev.length, ops }]);

    if (isSafe) {
      setAvailable(newAvail);
      setProcesses(newProcs);
      addLog(`P${pid} Granted (Verified in ${ops} ops)`, "success");
    } else {
      addLog(`P${pid} Denied: Safety Risk (${ops} ops)`, "warning");
    }
  };

  const runStressTest = () => {
    const newBatch = Array.from({ length: 10 }, (_, i) => ({
      id: processes.length + i,
      status: 'Active',
      allocation: [0, 0, 0],
      max: [Math.floor(Math.random() * 5) + 1, Math.floor(Math.random() * 5) + 1, Math.floor(Math.random() * 5) + 1],
      timestamp: Date.now() + i
    }));
    setProcesses([...processes, ...newBatch]);
    addLog("Stress Test: 10 Processes Injected", "info");
  };

  const addLog = (msg, type) => {
    setLogs(prev => [{ msg, type, t: new Date().toLocaleTimeString().split(' ')[0] }, ...prev].slice(0, 8));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white">DEADLOCK<span className="text-blue-500">ENGINE</span></h1>
            <p className="text-slate-500 text-sm">Hybrid Strategy Validation Labs</p>
          </div>
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            {['Banker', 'Hybrid'].map(m => (
              <button key={m} onClick={() => setMode(m)} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === m ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>{m}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Stats Section */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-500"/> System Resources
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {available.map((v, i) => (
                  <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
                    <div className="text-[10px] text-slate-600 mb-1">RES R{i}</div>
                    <div className="text-2xl font-mono font-bold text-blue-400">{v}</div>
                  </div>
                ))}
              </div>
              <button onClick={runStressTest} className="w-full mt-8 bg-slate-800 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                <PlusCircle size={18}/> Run Stress Test
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-64 overflow-hidden">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Event Stream</h3>
              <div className="space-y-2">
                {logs.map((l, i) => (
                  <div key={i} className="text-[11px] font-mono flex justify-between border-b border-slate-800/50 pb-1">
                    <span className={l.type === 'error' ? 'text-red-400' : l.type === 'success' ? 'text-emerald-400' : 'text-blue-400'}>{l.msg}</span>
                    <span className="text-slate-600">{l.t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Visualization Section */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Activity size={16} className="text-blue-500"/> Computation Complexity (Ops/Request)
                </h3>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={perfData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis stroke="#475569" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                    <Area type="step" dataKey="ops" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {processes.slice(0, 6).map(p => (
                <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-center group hover:border-blue-500 transition-all">
                  <div>
                    <div className="text-sm font-bold">Process P{p.id}</div>
                    <div className="text-[10px] text-slate-500 font-mono">Max Claim: [{p.max.join(',')}]</div>
                  </div>
                  <button onClick={() => handleRequest(p.id)} className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition">
                    <Zap size={14}/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}