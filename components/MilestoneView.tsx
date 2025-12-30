
import React, { useState } from 'react';
import { Milestone, ViewType, ScaleType } from '../types';

interface MilestoneViewProps {
  milestones: Milestone[];
  onAdd: (m: Milestone) => void;
}

export const MilestoneView: React.FC<MilestoneViewProps> = ({ milestones, onAdd }) => {
  const [view, setView] = useState<ViewType>('LIST');
  const [scale, setScale] = useState<ScaleType>('MONTH');
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');

  const handleAdd = () => {
    if (!newTitle || !newStart || !newEnd) return;
    onAdd({
      id: Math.random().toString(36).substr(2, 9),
      title: newTitle,
      startDate: newStart,
      endDate: newEnd,
      status: 'UPCOMING'
    });
    setShowAdd(false);
    setNewTitle('');
    setNewStart('');
    setNewEnd('');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4 bg-slate-50/50">
        <div className="flex gap-2 p-1 bg-slate-200/50 rounded-lg">
          {(['LIST', 'CALENDAR', 'GANTT'] as ViewType[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                view === v ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        
        {view === 'GANTT' && (
          <div className="flex gap-1">
            {(['DAY', 'MONTH', 'QUARTER', 'YEAR'] as ScaleType[]).map(s => (
              <button
                key={s}
                onClick={() => setScale(s)}
                className={`px-3 py-1 text-[10px] rounded border ${
                  scale === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <button 
          onClick={() => setShowAdd(true)}
          className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>+</span> New Milestone
        </button>
      </div>

      <div className="p-6 overflow-x-auto min-h-[400px]">
        {view === 'LIST' && (
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wider">
                <th className="pb-4 font-semibold">마일스톤명</th>
                <th className="pb-4 font-semibold">시작일</th>
                <th className="pb-4 font-semibold">종료일</th>
                <th className="pb-4 font-semibold">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {milestones.map(m => (
                <tr key={m.id} className="text-sm group hover:bg-slate-50 transition-colors">
                  <td className="py-4 font-medium">{m.title}</td>
                  <td className="py-4 text-slate-500">{m.startDate}</td>
                  <td className="py-4 text-slate-500">{m.endDate}</td>
                  <td className="py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      m.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                      m.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {view === 'CALENDAR' && (
           <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
             {['일', '월', '화', '수', '목', '금', '토'].map(d => (
               <div key={d} className="bg-slate-50 p-2 text-center text-xs font-bold text-slate-400">{d}</div>
             ))}
             {Array.from({ length: 35 }).map((_, i) => (
               <div key={i} className="bg-white min-h-[100px] p-2 relative">
                 <span className="text-xs text-slate-300">{i + 1}</span>
                 {i === 15 && (
                    <div className="mt-1 p-1 bg-blue-100 text-[10px] text-blue-700 rounded border border-blue-200 truncate">
                      {milestones[0]?.title}
                    </div>
                 )}
               </div>
             ))}
           </div>
        )}

        {view === 'GANTT' && (
          <div className="relative min-w-[800px]">
            <div className="flex border-b border-slate-200 mb-4 bg-slate-50 p-2">
              <div className="w-1/4 font-semibold text-xs text-slate-400">태스크</div>
              <div className="flex-1 font-semibold text-xs text-slate-400 text-center">타임라인 ({scale})</div>
            </div>
            <div className="space-y-6">
              {milestones.map((m, idx) => (
                <div key={m.id} className="flex items-center group">
                  <div className="w-1/4 pr-4">
                    <div className="text-sm font-medium truncate">{m.title}</div>
                    <div className="text-[10px] text-slate-400">{m.startDate} ~ {m.endDate}</div>
                  </div>
                  <div className="flex-1 h-8 bg-slate-50 rounded-full relative overflow-hidden gantt-grid border border-slate-100">
                    <div 
                      className="absolute top-0 bottom-0 bg-blue-500 rounded-full flex items-center px-4 text-[10px] text-white font-bold transition-all duration-500 shadow-lg"
                      style={{ 
                        left: `${(idx * 15) + 5}%`, 
                        width: `${20 + (idx * 5)}%`,
                        opacity: 0.9
                      }}
                    >
                      {m.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold">새 마일스톤 추가</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">제목</label>
                <input 
                  type="text" 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="예: 기획서 완료"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">시작일</label>
                  <input 
                    type="date" 
                    value={newStart} 
                    onChange={e => setNewStart(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">종료일</label>
                  <input 
                    type="date" 
                    value={newEnd} 
                    onChange={e => setNewEnd(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">취소</button>
              <button onClick={handleAdd} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg hover:bg-blue-700">추가하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
