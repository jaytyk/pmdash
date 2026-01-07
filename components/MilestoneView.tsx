
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Milestone, ViewType, ScaleType } from '../types';

interface MilestoneViewProps {
  milestones: Milestone[];
  onUpdateMilestones: (milestones: Milestone[]) => void;
}

export const MilestoneView: React.FC<MilestoneViewProps> = ({ milestones, onUpdateMilestones }) => {
  const [view, setView] = useState<ViewType>('LIST');
  const [scale, setScale] = useState<ScaleType>('MONTH');
  
  // Calendar Navigation State
  const [viewDate, setViewDate] = useState(new Date());
  
  // Gantt Navigation State
  const [ganttBaseDate, setGanttBaseDate] = useState(new Date());

  // Modals state
  const [showAdd, setShowAdd] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  // Form states
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
    if (!formTitle || !formStart || !formEnd) return;
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
    if (!editingMilestone || !formTitle || !formStart || !formEnd) return;
    const updatedList = milestones.map(m => 
      m.id === editingMilestone.id 
        ? { ...m, title: formTitle, startDate: formStart, endDate: formEnd, status: formStatus }
        : m
    );
    onUpdateMilestones(updatedList);
    setEditingMilestone(null);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('이 마일스톤을 정말 삭제하시겠습니까?')) {
      const filtered = milestones.filter(m => m.id !== id);
      onUpdateMilestones(filtered);
    }
  };

  // --- Navigation Helpers (Calendar) ---
  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };
  const handleToday = () => {
    const d = new Date();
    setViewDate(d);
    setGanttBaseDate(d);
  };

  // --- Navigation Helpers (Gantt) ---
  const handleGanttPrev = () => {
    const d = new Date(ganttBaseDate);
    if (scale === 'DAY') d.setDate(d.getDate() - 7);
    else if (scale === 'MONTH' || scale === 'QUARTER') d.setFullYear(d.getFullYear() - 1);
    else if (scale === 'YEAR') d.setFullYear(d.getFullYear() - 5);
    setGanttBaseDate(d);
  };

  const handleGanttNext = () => {
    const d = new Date(ganttBaseDate);
    if (scale === 'DAY') d.setDate(d.getDate() + 7);
    else if (scale === 'MONTH' || scale === 'QUARTER') d.setFullYear(d.getFullYear() + 1);
    else if (scale === 'YEAR') d.setFullYear(d.getFullYear() + 5);
    setGanttBaseDate(d);
  };

  // --- Zoom logic (Mouse Wheel) ---
  const scales: ScaleType[] = ['DAY', 'MONTH', 'QUARTER', 'YEAR'];
  const handleGanttWheel = (e: React.WheelEvent) => {
    const currentIndex = scales.indexOf(scale);
    if (e.deltaY < 0) { // Scroll Up: Zoom In (closer view)
      if (currentIndex > 0) setScale(scales[currentIndex - 1]);
    } else { // Scroll Down: Zoom Out (wider view)
      if (currentIndex < scales.length - 1) setScale(scales[currentIndex + 1]);
    }
  };

  // --- Date Helpers ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calendar 날짜 배열 생성
  const calendarDates = useMemo(() => {
    const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const startDay = startOfMonth.getDay();
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startDay);
    const dates = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [viewDate]);

  // Gantt 타임라인 데이터 및 범위 계산
  const ganttConfig = useMemo(() => {
    const units = [];
    let startRange: Date;
    let endRange: Date;
    let label = "";

    if (scale === 'DAY') {
      // Show 14 days from base date
      startRange = new Date(ganttBaseDate);
      startRange.setHours(0,0,0,0);
      for (let i = 0; i < 14; i++) {
        const d = new Date(startRange);
        d.setDate(startRange.getDate() + i);
        units.push(`${d.getMonth() + 1}/${d.getDate()}`);
      }
      endRange = new Date(startRange);
      endRange.setDate(startRange.getDate() + 14);
      label = `${startRange.getFullYear()}년 ${startRange.getMonth() + 1}월 ${startRange.getDate()}일 기준 (2주)`;
    } else if (scale === 'MONTH') {
      // Show 12 months for the year
      const year = ganttBaseDate.getFullYear();
      startRange = new Date(year, 0, 1);
      for (let i = 1; i <= 12; i++) units.push(`${i}월`);
      endRange = new Date(year, 11, 31, 23, 59, 59);
      label = `${year}년 (전체 월)`;
    } else if (scale === 'QUARTER') {
      const year = ganttBaseDate.getFullYear();
      startRange = new Date(year, 0, 1);
      for (let i = 1; i <= 4; i++) units.push(`${i}분기`);
      endRange = new Date(year, 11, 31, 23, 59, 59);
      label = `${year}년 (분기별)`;
    } else { // YEAR
      // Show 5 years range
      const midYear = ganttBaseDate.getFullYear();
      startRange = new Date(midYear - 2, 0, 1);
      for (let i = 0; i < 5; i++) units.push(`${midYear - 2 + i}년`);
      endRange = new Date(midYear + 2, 11, 31, 23, 59, 59);
      label = `${midYear - 2}년 ~ ${midYear + 2}년`;
    }

    return { units, startRange, endRange, label };
  }, [scale, ganttBaseDate]);

  // Gantt 바 위치/너비 계산 함수
  const calculateGanttStyle = (m: Milestone) => {
    const { startRange, endRange } = ganttConfig;
    const mStart = new Date(m.startDate);
    const mEnd = new Date(m.endDate);
    
    const totalDuration = endRange.getTime() - startRange.getTime();
    
    let left = ((mStart.getTime() - startRange.getTime()) / totalDuration) * 100;
    let width = ((mEnd.getTime() - mStart.getTime()) / totalDuration) * 100;

    // Visibility clipping
    if (left + width < 0 || left > 100) return { display: 'none' };
    
    if (left < 0) {
      width = width + left;
      left = 0;
    }
    if (left + width > 100) {
      width = 100 - left;
    }
    if (width < 0.5) width = 0.5; // 최소 가시성 확보

    return { left: `${left}%`, width: `${width}%` };
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
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {(['DAY', 'MONTH', 'QUARTER', 'YEAR'] as ScaleType[]).map(s => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  className={`px-3 py-1 text-[10px] font-bold rounded ${
                    scale === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleGanttPrev} className="p-1 hover:bg-slate-200 rounded text-slate-500 text-xs">◀</button>
              <span className="text-xs font-bold text-slate-600 min-w-[120px] text-center">{ganttConfig.label}</span>
              <button onClick={handleGanttNext} className="p-1 hover:bg-slate-200 rounded text-slate-500 text-xs">▶</button>
            </div>
          </div>
        )}

        {view === 'CALENDAR' && (
          <div className="flex items-center gap-3">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-200 rounded text-slate-500">◀</button>
            <div className="text-sm font-bold text-slate-700 min-w-[100px] text-center">
              {viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월
            </div>
            <button onClick={handleNextMonth} className="p-1 hover:bg-slate-200 rounded text-slate-500">▶</button>
            <button onClick={handleToday} className="px-2 py-1 text-[10px] font-bold bg-slate-100 text-slate-600 rounded hover:bg-slate-200">오늘</button>
          </div>
        )}

        {view === 'LIST' && <div className="flex-1" />}

        <button 
          onClick={openAddModal}
          className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm"
        >
          <span>+</span> 마일스톤 추가
        </button>
      </div>

      <div className="p-6 overflow-x-auto min-h-[400px]">
        {view === 'LIST' && (
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wider">
                <th className="pb-4 font-semibold px-2">마일스톤명</th>
                <th className="pb-4 font-semibold px-2 text-center">기간</th>
                <th className="pb-4 font-semibold px-2 text-center">상태</th>
                <th className="pb-4 font-semibold px-2 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {milestones.map(m => (
                <tr key={m.id} className="text-sm group hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 font-bold text-slate-700 px-2 cursor-pointer" onClick={() => openEditModal(m)}>{m.title}</td>
                  <td className="py-4 text-slate-500 px-2 text-center text-xs font-mono cursor-pointer" onClick={() => openEditModal(m)}>
                    {m.startDate} ~ {m.endDate}
                  </td>
                  <td className="py-4 px-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      m.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                      m.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="py-4 px-2 text-right space-x-1">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-1">
                      <button type="button" onClick={() => openEditModal(m)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">✏️</button>
                      <button type="button" onClick={(e) => handleDelete(e, m.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">🗑️</button>
                    </div>
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
             {calendarDates.map((date, i) => {
               const dateStr = date.toISOString().split('T')[0];
               const isSameMonth = date.getMonth() === viewDate.getMonth();
               const isToday = date.getTime() === today.getTime();

               return (
                 <div key={i} className={`bg-white min-h-[110px] p-2 relative group/cell border-r border-b border-slate-100 ${!isSameMonth ? 'bg-slate-50/50' : ''}`}>
                   <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                     isToday ? 'bg-blue-600 text-white' : 
                     isSameMonth ? 'text-slate-600' : 'text-slate-300'
                   }`}>
                     {date.getDate()}
                   </span>
                   <div className="mt-1 space-y-1">
                     {milestones.map((m) => {
                        const mStart = new Date(m.startDate);
                        const mEnd = new Date(m.endDate);
                        mStart.setHours(0,0,0,0);
                        mEnd.setHours(0,0,0,0);
                        
                        if (date >= mStart && date <= mEnd) {
                          const isStart = dateStr === m.startDate;
                          const isEnd = dateStr === m.endDate;
                          
                          let colorClass = "";
                          if (isStart) {
                            colorClass = "bg-blue-700 text-white border-blue-800 shadow-sm z-10";
                          } else if (isEnd) {
                            colorClass = "bg-rose-600 text-white border-rose-700 shadow-sm z-10";
                          } else {
                            colorClass = m.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                                         m.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-600';
                          }

                          return (
                            <div 
                              key={m.id} 
                              onClick={() => openEditModal(m)}
                              className={`p-1 text-[9px] font-bold cursor-pointer transition-all truncate border-y border-transparent hover:brightness-95 ${colorClass} ${
                                isStart ? 'rounded-l-md border-l' : ''
                              } ${
                                isEnd ? 'rounded-r-md border-r' : ''
                              }`}
                              title={`${m.title} (${m.startDate} ~ ${m.endDate})`}
                            >
                              {m.title}
                            </div>
                          );
                        }
                        return null;
                     })}
                   </div>
                 </div>
               );
             })}
           </div>
        )}

        {view === 'GANTT' && (
          <div 
            className="relative min-w-[800px] select-none"
            onWheel={handleGanttWheel}
          >
            <div className="flex border-b border-slate-200 mb-4 bg-slate-50 rounded-t-lg overflow-hidden border-x border-t">
              <div className="w-1/4 p-3 font-bold text-xs text-slate-500 bg-white border-r border-slate-200">마일스톤 태스크</div>
              <div className="flex-1 flex divide-x divide-slate-200">
                {ganttConfig.units.map((unit, i) => (
                  <div key={i} className="flex-1 text-[10px] font-bold text-slate-400 text-center py-3 bg-slate-50/50">
                    {unit}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6 px-1">
              {milestones.map((m) => {
                const barStyle = calculateGanttStyle(m);
                return (
                  <div key={m.id} className="flex items-center group">
                    <div className="w-1/4 pr-4 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => openEditModal(m)}>
                      <div className="text-sm font-bold truncate text-slate-700">{m.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono tracking-tighter">{m.startDate} ~ {m.endDate}</div>
                    </div>
                    <div className="flex-1 h-10 bg-slate-50 rounded-lg relative overflow-hidden border border-slate-100 cursor-pointer shadow-inner" onClick={() => openEditModal(m)}>
                      {/* 눈금선 */}
                      <div className="absolute inset-0 flex divide-x divide-slate-200/50 pointer-events-none">
                        {ganttConfig.units.map((_, i) => <div key={i} className="flex-1 h-full" />)}
                      </div>
                      
                      <div 
                        className={`absolute top-1 bottom-1 rounded-full flex items-center px-3 text-[10px] text-white font-black transition-all duration-300 shadow-md hover:brightness-110 ${
                          m.status === 'COMPLETED' ? 'bg-green-500' : m.status === 'OVERDUE' ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={barStyle}
                      >
                        <span className="truncate drop-shadow-sm">{m.title}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {milestones.length === 0 && (
                <div className="py-20 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
                  등록된 마일스톤이 없습니다.
                </div>
              )}
              <div className="text-center py-4 text-[10px] text-slate-400 italic">
                * 마우스 휠을 사용하여 확대/축소하고, 화살표 버튼으로 타임라인을 이동할 수 있습니다.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAdd || editingMilestone) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold">
                {editingMilestone ? '마일스톤 수정' : '새 마일스톤 추가'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">제목</label>
                <input 
                  type="text" 
                  value={formTitle} 
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">시작일</label>
                  <input 
                    type="date" 
                    value={formStart} 
                    onChange={e => setFormStart(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">종료일</label>
                  <input 
                    type="date" 
                    value={formEnd} 
                    onChange={e => setFormEnd(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              </div>
              {editingMilestone && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">진행 상태</label>
                  <select 
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                  >
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="OVERDUE">OVERDUE</option>
                  </select>
                </div>
              )}
            </div>
            <div className="p-6 bg-slate-50 flex justify-end gap-3">
              <div className="flex-1">
                {editingMilestone && (
                  <button type="button" onClick={(e) => { if(editingMilestone) { handleDelete(e, editingMilestone.id); setEditingMilestone(null); } }} className="px-4 py-2 text-sm text-red-500 hover:text-red-700 font-bold">삭제</button>
                )}
              </div>
              <button type="button" onClick={() => { setShowAdd(false); setEditingMilestone(null); }} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">취소</button>
              <button type="button" onClick={editingMilestone ? handleSaveEdit : handleAdd} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg hover:bg-blue-700">{editingMilestone ? '수정하기' : '추가하기'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
