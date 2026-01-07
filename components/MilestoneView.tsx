
import React, { useState, useMemo } from 'react';
import { Milestone, ViewType, ScaleType } from '../types';

interface MilestoneViewProps {
  milestones: Milestone[];
  onUpdateMilestones: (milestones: Milestone[]) => void;
}

export const MilestoneView: React.FC<MilestoneViewProps> = ({ milestones, onUpdateMilestones }) => {
  const [view, setView] = useState<ViewType>('LIST');
  const [scale, setScale] = useState<ScaleType>('MONTH');
  const [viewDate, setViewDate] = useState(new Date());
  const [ganttBaseDate, setGanttBaseDate] = useState(new Date());
  const [showAdd, setShowAdd] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formStatus, setFormStatus] = useState<Milestone['status']>('UPCOMING');

  const openAddModal = () => { 
    setFormTitle(''); 
    setFormStart(''); 
    setFormEnd(''); 
    setFormStatus('UPCOMING'); 
    setShowAdd(true); 
  };
  
  const openEditModal = (m: Milestone) => { 
    setEditingMilestone(m); 
    setFormTitle(m.title); 
    setFormStart(m.startDate); 
    setFormEnd(m.endDate); 
    setFormStatus(m.status); 
  };

  const handleAdd = () => {
    if (!formTitle || !formStart || !formEnd) {
      alert('모든 필드를 입력해주세요.');
      return;
    }
    const newMilestone: Milestone = { 
      id: Math.random().toString(36).substr(2, 9), 
      title: formTitle, 
      startDate: formStart, 
      endDate: formEnd, 
      status: 'UPCOMING' 
    };
    onUpdateMilestones([...milestones, newMilestone]);
    setShowAdd(false);
  };

  const handleSaveEdit = () => {
    if (!editingMilestone) return;
    const updatedList = milestones.map(m => 
      m.id === editingMilestone.id 
        ? { ...m, title: formTitle, startDate: formStart, endDate: formEnd, status: formStatus } 
        : m
    );
    onUpdateMilestones(updatedList);
    setEditingMilestone(null);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!editingMilestone) return;

    // 브라우저 표준 confirm 대화상자 노출 확인
    const isConfirmed = confirm('이 마일스톤을 삭제하시겠습니까?');
    
    if (isConfirmed) {
      const targetId = editingMilestone.id;
      const filteredList = milestones.filter(m => m.id !== targetId);
      onUpdateMilestones(filteredList);
      setEditingMilestone(null); // 삭제 후 모달 닫기
    }
  };

  const calendarDates = useMemo(() => {
    const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const startDay = start.getDay();
    const startDate = new Date(start);
    startDate.setDate(start.getDate() - startDay);
    return Array.from({ length: 42 }).map((_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      return d;
    });
  }, [viewDate]);

  const ganttConfig = useMemo(() => {
    let units = [];
    let startRange: Date, endRange: Date;
    if (scale === 'DAY') {
      startRange = new Date(ganttBaseDate); startRange.setHours(0,0,0,0);
      for (let i = 0; i < 14; i++) { const d = new Date(startRange); d.setDate(startRange.getDate() + i); units.push(`${d.getMonth()+1}/${d.getDate()}`); }
      endRange = new Date(startRange); endRange.setDate(startRange.getDate() + 14);
    } else if (scale === 'MONTH') {
      startRange = new Date(ganttBaseDate.getFullYear(), 0, 1);
      for (let i = 1; i <= 12; i++) units.push(`${i}월`);
      endRange = new Date(ganttBaseDate.getFullYear(), 11, 31);
    } else {
      startRange = new Date(ganttBaseDate.getFullYear(), 0, 1);
      for (let i = 1; i <= 4; i++) units.push(`${i}Q`);
      endRange = new Date(ganttBaseDate.getFullYear(), 11, 31);
    }
    return { units, startRange, endRange };
  }, [scale, ganttBaseDate]);

  const calculateGanttStyle = (m: Milestone) => {
    const { startRange, endRange } = ganttConfig;
    const mStart = new Date(m.startDate); const mEnd = new Date(m.endDate);
    const total = endRange.getTime() - startRange.getTime();
    let left = ((mStart.getTime() - startRange.getTime()) / total) * 100;
    let width = ((mEnd.getTime() - mStart.getTime()) / total) * 100;
    if (left + width < 0 || left > 100) return { display: 'none' };
    return { left: `${Math.max(0, left)}%`, width: `${Math.min(100, width)}%` };
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Controls Bar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex bg-slate-200/50 p-1 rounded-xl w-full sm:w-auto">
          {(['LIST', 'CALENDAR', 'GANTT'] as ViewType[]).map(v => (
            <button key={v} onClick={() => setView(v)} className={`flex-1 px-4 py-2 text-[11px] font-bold rounded-lg transition-all ${view === v ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              {v}
            </button>
          ))}
        </div>
        
        {view !== 'LIST' && (
          <div className="flex items-center gap-3">
            <button onClick={() => {
              const d = new Date(view === 'CALENDAR' ? viewDate : ganttBaseDate);
              d.setMonth(d.getMonth() - 1);
              view === 'CALENDAR' ? setViewDate(d) : setGanttBaseDate(d);
            }} className="p-2 bg-white border border-slate-200 rounded-lg text-xs hover:bg-slate-100 transition-colors">◀</button>
            <span className="text-xs font-bold text-slate-700 min-w-[80px] text-center">
              {view === 'CALENDAR' ? `${viewDate.getFullYear()}.${viewDate.getMonth()+1}` : `${ganttBaseDate.getFullYear()}`}
            </span>
            <button onClick={() => {
              const d = new Date(view === 'CALENDAR' ? viewDate : ganttBaseDate);
              d.setMonth(d.getMonth() + 1);
              view === 'CALENDAR' ? setViewDate(d) : setGanttBaseDate(d);
            }} className="p-2 bg-white border border-slate-200 rounded-lg text-xs hover:bg-slate-100 transition-colors">▶</button>
          </div>
        )}

        <button onClick={openAddModal} className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white text-[11px] font-bold rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">+ 추가</button>
      </div>

      <div className="p-4 overflow-x-auto min-h-[400px]">
        {view === 'LIST' && (
          <table className="w-full text-left min-w-[500px]">
            <thead>
              <tr className="text-[10px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-50">
                <th className="pb-3 px-2">태스크</th>
                <th className="pb-3 px-2 text-center">상태</th>
                <th className="pb-3 px-2 text-right">기한</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {milestones.map(m => (
                <tr key={m.id} onClick={() => openEditModal(m)} className="text-sm group hover:bg-slate-50 cursor-pointer transition-colors">
                  <td className="py-4 px-2 font-bold text-slate-700">{m.title}</td>
                  <td className="py-4 px-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : m.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{m.status}</span>
                  </td>
                  <td className="py-4 px-2 text-right text-[11px] font-mono text-slate-400">{m.startDate} ~ {m.endDate}</td>
                </tr>
              ))}
              {milestones.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-400 italic text-sm">등록된 마일스톤이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {view === 'CALENDAR' && (
           <div className="min-w-[700px]">
             <div className="grid grid-cols-7 gap-1">
               {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => <div key={d} className="text-center text-[10px] font-black text-slate-400 py-2 uppercase">{d}</div>)}
               {calendarDates.map((date, i) => (
                 <div key={i} className={`bg-slate-50/50 min-h-[100px] p-2 rounded-xl border border-white transition-all hover:bg-white hover:shadow-sm ${date.getMonth() !== viewDate.getMonth() ? 'opacity-30' : ''}`}>
                    <span className="text-[10px] font-bold text-slate-500">{date.getDate()}</span>
                    <div className="mt-1 space-y-1">
                      {milestones.map(m => {
                        const mS = new Date(m.startDate); const mE = new Date(m.endDate);
                        if (date >= mS && date <= mE) return <div key={m.id} onClick={() => openEditModal(m)} className="p-1 text-[8px] font-bold bg-blue-500 text-white rounded truncate cursor-pointer hover:bg-blue-600 transition-colors">{m.title}</div>;
                        return null;
                      })}
                    </div>
                 </div>
               ))}
             </div>
           </div>
        )}

        {view === 'GANTT' && (
           <div className="min-w-[800px] space-y-6">
             <div className="flex border-b border-slate-100 bg-slate-50 p-2 rounded-xl">
               <div className="w-40 text-[10px] font-black text-slate-400">Task Name</div>
               <div className="flex-1 flex justify-around">
                 {ganttConfig.units.map((u, i) => <span key={i} className="text-[9px] font-bold text-slate-400">{u}</span>)}
               </div>
             </div>
             {milestones.map(m => (
               <div key={m.id} className="flex items-center gap-4 cursor-pointer group" onClick={() => openEditModal(m)}>
                 <div className="w-40 truncate text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{m.title}</div>
                 <div className="flex-1 h-8 bg-slate-50 rounded-lg relative overflow-hidden border border-slate-100 shadow-inner">
                   <div className={`absolute h-full bg-blue-500 rounded-lg flex items-center px-2 text-[9px] text-white font-bold shadow-md hover:bg-blue-600 transition-all`} style={calculateGanttStyle(m)}>{m.title}</div>
                 </div>
               </div>
             ))}
           </div>
        )}
      </div>

      {/* Basic Modal Implementation */}
      {(showAdd || editingMilestone) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-scaleIn">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{editingMilestone ? '마일스톤 수정' : '마일스톤 추가'}</h3>
              <button 
                type="button"
                onClick={() => {setShowAdd(false); setEditingMilestone(null);}} 
                className="text-slate-400 p-2 hover:bg-slate-200 rounded-full transition-colors"
              >✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">태스크명</label>
                <input value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" placeholder="태스크명을 입력하세요" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">시작일</label>
                  <input type="date" value={formStart} onChange={e => setFormStart(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">종료일</label>
                  <input type="date" value={formEnd} onChange={e => setFormEnd(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs" />
                </div>
              </div>
              {editingMilestone && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">상태</label>
                  <select value={formStatus} onChange={e => setFormStatus(e.target.value as any)} className="w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="UPCOMING">진행 예정 (UPCOMING)</option>
                    <option value="COMPLETED">완료 (COMPLETED)</option>
                    <option value="OVERDUE">지연 (OVERDUE)</option>
                  </select>
                </div>
              )}
              <div className="pt-2 space-y-2">
                <button 
                  type="button"
                  onClick={editingMilestone ? handleSaveEdit : handleAdd} 
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                >
                  {editingMilestone ? '업데이트' : '확인'}
                </button>
                {editingMilestone && (
                  <button 
                    type="button"
                    onClick={handleDelete} 
                    className="w-full py-2 text-xs text-red-500 font-bold hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                  >
                    삭제하기
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
