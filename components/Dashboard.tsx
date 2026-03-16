
// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { Project } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getStatus1Color, getStatus1ChartColor } from '../constants';

interface DashboardProps {
  projects: Project[];
  status1List: string[];
  status2List: string[];
  onSelect: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ projects, status1List, status2List, onSelect }) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'MONTH' | 'QUARTER' | 'YEAR' | 'CUSTOM'>('ALL');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedStatus1, setSelectedStatus1] = useState<string | null>(null);
  const [selectedStatuses2, setSelectedStatuses2] = useState<string[]>([]);

  // 1. Base filtering by date
  const baseFilteredProjects = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return projects.filter(p => {
      const pStart = new Date(p.startDate);
      const pEnd = new Date(p.endDate);
      
      if (filterMode === 'MONTH') {
        return pStart.getFullYear() === currentYear && pStart.getMonth() === currentMonth;
      }
      if (filterMode === 'QUARTER') {
        const currentQuarter = Math.floor(currentMonth / 3);
        const pQuarter = Math.floor(pStart.getMonth() / 3);
        return pStart.getFullYear() === currentYear && pQuarter === currentQuarter;
      }
      if (filterMode === 'YEAR') {
        return pStart.getFullYear() === currentYear;
      }
      if (filterMode === 'CUSTOM') {
        const start = customStart ? new Date(customStart) : new Date(0);
        const end = customEnd ? new Date(customEnd) : new Date(8640000000000000);
        return pStart >= start && pEnd <= end;
      }
      return true;
    });
  }, [projects, filterMode, customStart, customEnd]);

  // 2. Filter by Status 1 (Pie Chart selection)
  const status1FilteredProjects = useMemo(() => {
    if (!selectedStatus1) return baseFilteredProjects;
    return baseFilteredProjects.filter(p => p.status1 === selectedStatus1);
  }, [baseFilteredProjects, selectedStatus1]);

  // 3. Final display projects (List selection)
  const displayProjects = useMemo(() => {
    let result = status1FilteredProjects;
    if (selectedStatuses2.length > 0) {
      result = result.filter(p => selectedStatuses2.includes(p.status2));
    }
    return result;
  }, [status1FilteredProjects, selectedStatuses2]);

  const handleExport = () => {
    const headers = ['프로젝트명', 'PM', '1단계 상태', '2단계 상세', '시작일', '종료일', '설명'];
    const rows = displayProjects.map(p => [
      p.name,
      p.manager,
      p.status1,
      p.status2,
      p.startDate,
      p.endDate,
      p.description.replace(/,/g, ' ').replace(/\n/g, ' ')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    link.download = `Project_Report_${timestamp}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const onPieClick = (data: any) => {
    if (data && data.name) {
      setSelectedStatus1(prev => prev === data.name ? null : data.name);
      setSelectedStatuses2([]); // Reset sub-filters when main filter changes
    }
  };

  const toggleStatus2 = (status: string) => {
    setSelectedStatuses2(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const status1Data = useMemo(() => {
    const map = status1List.reduce((acc, s) => {
      acc[s] = baseFilteredProjects.filter(p => p.status1 === s).length;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(map).map(([name, value]) => ({
      name, 
      value, 
      color: getStatus1ChartColor(name)
    })).filter(d => d.value >= 0);
  }, [baseFilteredProjects, status1List]);

  const status2Data = useMemo(() => {
    // We calculate this based on status1FilteredProjects to show breakdown of the selected status1
    const map = status1FilteredProjects.reduce((acc, p) => {
      acc[p.status2] = (acc[p.status2] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return status2List.map(name => ({
      name,
      value: map[name] || 0
    }));
  }, [status1FilteredProjects, status2List]);

  const clearFilters = () => {
    setSelectedStatus1(null);
    setSelectedStatuses2([]);
    setFilterMode('ALL');
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">프로젝트 대시보드</h2>
          <p className="text-slate-500">진행 현황 분석 및 필터링된 보고서 추출</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={clearFilters}
            className="flex-1 md:flex-none px-4 py-2.5 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all"
          >
            초기화
          </button>
          <button 
            onClick={handleExport}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100"
          >
            <span>📥</span> CSV 내보내기 ({displayProjects.length})
          </button>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">기간 필터</span>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['ALL', 'MONTH', 'QUARTER', 'YEAR', 'CUSTOM'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => { setFilterMode(mode); setSelectedStatus1(null); setSelectedStatuses2([]); }}
                className={`px-4 py-2 text-[11px] font-bold rounded-lg transition-all ${
                  filterMode === mode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {mode === 'ALL' ? '전체' : mode === 'MONTH' ? '이번 달' : mode === 'QUARTER' ? '분기' : mode === 'YEAR' ? '올해' : '사용자 정의'}
              </button>
            ))}
          </div>
        </div>

        {filterMode === 'CUSTOM' && (
          <div className="flex items-center gap-2 animate-slideDown">
            <input 
              type="date" 
              value={customStart} 
              onChange={e => setCustomStart(e.target.value)} 
              className="p-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <span className="text-slate-300">~</span>
            <input 
              type="date" 
              value={customEnd} 
              onChange={e => setCustomEnd(e.target.value)} 
              className="p-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
        )}

        <div className="md:ml-auto flex items-center gap-4">
          <div className="text-xs font-medium text-slate-400">
            검색 결과: <span className="font-bold text-blue-600">{displayProjects.length}</span> / {baseFilteredProjects.length}건
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[450px]">
          <div className="mb-6">
            <h3 className="font-bold text-slate-800 text-lg">1단계 상태 분포</h3>
            <p className="text-xs text-slate-400">차트 조각을 클릭하여 해당 상태의 프로젝트만 필터링합니다.</p>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={status1Data} 
                  cx="50%" cy="50%" 
                  innerRadius="55%" outerRadius="85%" 
                  paddingAngle={5}
                  dataKey="value"
                  onClick={onPieClick} 
                  style={{ cursor: 'pointer', outline: 'none' }}
                >
                  {status1Data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      stroke={selectedStatus1 === entry.name ? '#1e293b' : 'none'} 
                      strokeWidth={3}
                      opacity={selectedStatus1 && selectedStatus1 !== entry.name ? 0.3 : 1}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend verticalAlign="bottom" align="center" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status 2 Breakdown */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[450px]">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">2단계 상세 프로세스</h3>
              <p className="text-xs text-slate-400">
                {selectedStatus1 ? `[${selectedStatus1}] 상태 내 상세 공정입니다.` : '전체 프로젝트의 상세 공정입니다.'}
              </p>
            </div>
            {selectedStatuses2.length > 0 && (
              <button 
                onClick={() => setSelectedStatuses2([])}
                className="text-[10px] font-bold text-blue-600 hover:underline"
              >
                선택 해제
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-3">
              {status2Data.map((item, idx) => {
                const isSelected = selectedStatuses2.includes(item.name);
                const hasData = item.value > 0;
                const progress = ((idx + 1) / status2List.length) * 100;
                
                return (
                  <div 
                    key={idx} 
                    onClick={() => hasData && toggleStatus2(item.name)}
                    className={`p-4 rounded-xl border transition-all ${
                      isSelected ? 'bg-blue-50 border-blue-200 shadow-sm' : 
                      hasData ? 'bg-white border-slate-100 hover:border-blue-100 cursor-pointer' : 'bg-slate-50 border-transparent opacity-40 grayscale pointer-events-none'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                          {isSelected && <span className="text-[10px] text-white">✓</span>}
                        </div>
                        <span className={`text-sm font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{item.name}</span>
                      </div>
                      <span className={`text-xs font-black ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>{item.value}건</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-blue-500 transition-all duration-700`} 
                        style={{ width: `${progress}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-slate-800">프로젝트 목록</h3>
            {(selectedStatus1 || selectedStatuses2.length > 0) && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded-full">필터 적용됨</span>
            )}
          </div>
          <span className="text-xs font-medium text-slate-400">총 {displayProjects.length}개 항목</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                <th className="px-8 py-4">프로젝트 정보</th>
                <th className="px-8 py-4 text-center">상태 (1단계 / 2단계)</th>
                <th className="px-8 py-4 text-right">일정</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {displayProjects.map(p => (
                <tr 
                  key={p.id} 
                  onClick={() => onSelect(p.id)} 
                  className="group hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-8 py-5">
                    <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors text-base mb-1">{p.name}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="font-semibold text-slate-600">{p.manager}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className="truncate max-w-[300px]">{p.description}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className={`px-3 py-1 rounded-full text-[10px] border ${getStatus1Color(p.status1)}`}>
                        {p.status1}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-tighter">
                        {p.status2}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="text-[11px] font-mono text-slate-500 font-bold">{p.startDate}</div>
                    <div className="text-[10px] text-slate-300">~ {p.endDate}</div>
                  </td>
                </tr>
              ))}
              {displayProjects.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-24 text-center text-slate-400 italic text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">🔍</span>
                      조건에 맞는 프로젝트가 없습니다.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
