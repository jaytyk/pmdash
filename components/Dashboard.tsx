
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
  // Filter States
  const [filterMode, setFilterMode] = useState<'ALL' | 'MONTH' | 'QUARTER' | 'YEAR' | 'CUSTOM'>('ALL');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]); // 다중 선택을 위해 배열로 변경

  // 1. 기간 필터만 적용된 기초 데이터 (차트 및 통계용)
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

  // 2. 2단계 다중 상태 필터 적용 데이터 (하단 목록용)
  const displayProjects = useMemo(() => {
    if (selectedStatuses.length === 0) return baseFilteredProjects;
    return baseFilteredProjects.filter(p => selectedStatuses.includes(p.status2));
  }, [baseFilteredProjects, selectedStatuses]);

  // 차트 데이터 구성 (기간 필터 기준 전체 데이터 사용)
  const status1Map = status1List.reduce((acc, s) => {
    acc[s] = baseFilteredProjects.filter(p => p.status1 === s).length;
    return acc;
  }, {} as Record<string, number>);

  const status1Data = Object.entries(status1Map).map(([name, value]) => ({
    name,
    value: value as number,
    color: getStatus1ChartColor(name)
  })).filter(d => (d.value as number) >= 0);

  const status2Map = baseFilteredProjects.reduce((acc, p) => {
    acc[p.status2] = (acc[p.status2] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const status2Data = status2List.map(name => ({
    name,
    value: status2Map[name] || 0
  }));

  const handleExport = () => {
    const headers = ['프로젝트명', 'PM', '1단계 상태', '2단계 상세', '시작일', '종료일', '설명'];
    const rows = displayProjects.map(p => [
      p.name,
      p.manager,
      p.status1,
      p.status2,
      p.startDate,
      p.endDate,
      p.description.replace(/,/g, ' ')
    ]);

    const csvContent = ['\ufeff' + headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Project_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.5;
    const x = Number(cx) + radius * Math.cos(-Number(midAngle) * RADIAN);
    const y = Number(cy) + radius * Math.sin(-Number(midAngle) * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > Number(cx) ? 'start' : 'end'} dominantBaseline="central" className="text-[10px] font-bold">
        {value > 0 ? `${value}건` : ''}
      </text>
    );
  };

  const toggleStatus = (name: string) => {
    setSelectedStatuses(prev => 
      prev.includes(name) 
        ? prev.filter(s => s !== name) 
        : [...prev, name]
    );
  };

  const selectAllStatuses = () => {
    // 만약 이미 전부 선택되어 있다면 해제, 아니면 전부 선택
    if (selectedStatuses.length === status2List.length) {
      setSelectedStatuses([]);
    } else {
      setSelectedStatuses([...status2List]);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">전체 프로젝트 대시보드</h2>
          <p className="text-slate-500">프로젝트 진행 현황 및 실적 분석</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100"
        >
          <span>📥</span> 엑셀로 내보내기 ({displayProjects.length})
        </button>
      </header>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">기간 조회</span>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {(['ALL', 'MONTH', 'QUARTER', 'YEAR', 'CUSTOM'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => { setFilterMode(mode); setSelectedStatuses([]); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
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
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="p-1.5 text-xs border border-slate-200 rounded-md" />
            <span className="text-slate-300">~</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="p-1.5 text-xs border border-slate-200 rounded-md" />
          </div>
        )}

        {selectedStatuses.length > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 animate-slideRight">
            <span className="text-xs font-bold text-blue-600">
              필터 적용: {selectedStatuses.length === status2List.length ? '전체' : `${selectedStatuses.length}개 상태`}
            </span>
            <button onClick={() => setSelectedStatuses([])} className="text-blue-400 hover:text-blue-600 text-xs font-bold ml-1">모두 해제</button>
          </div>
        )}

        <div className="ml-auto text-xs font-medium text-slate-400">
          전체: <span className="font-bold text-slate-900">{baseFilteredProjects.length}</span>건 / 
          조회: <span className="font-bold text-blue-600">{displayProjects.length}</span>건
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[400px]">
          <h3 className="font-bold text-slate-800 mb-4">1단계 상태 분포</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={status1Data} cx="50%" cy="45%" labelLine={false} label={renderCustomizedLabel} outerRadius={100} dataKey="value">
                  {status1Data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interactive Progress List with Multi-select */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-slate-800">2단계 상세 프로세스 현황</h3>
            <button 
              onClick={selectAllStatuses}
              className="text-[10px] font-bold text-blue-600 hover:underline px-2 py-1 rounded bg-blue-50"
            >
              {selectedStatuses.length === status2List.length ? '전체 해제' : '전체 선택'}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mb-4">여러 상태를 클릭하여 선택적으로 필터링할 수 있습니다.</p>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-2">
              {status2Data.map((item, idx) => {
                const totalSteps = status2List.length;
                const progressPercent = ((idx + 1) / totalSteps) * 100;
                const isSelected = selectedStatuses.includes(item.name);
                const hasProjects = item.value > 0;

                return (
                  <div 
                    key={idx} 
                    onClick={() => toggleStatus(item.name)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer group flex flex-col ${
                      isSelected ? 'bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-100' : 
                      hasProjects ? 'bg-white border-transparent hover:bg-slate-50' : 'opacity-40 grayscale'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                          {isSelected && <span className="text-[8px] text-white">✓</span>}
                        </div>
                        <span className={`text-sm font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{item.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({idx + 1}/{totalSteps})</span>
                      </div>
                      <span className={`text-xs font-black ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>{item.value}건</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${isSelected ? 'bg-blue-600' : 'bg-blue-400'}`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* List Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-slate-800">
              {selectedStatuses.length > 0 
                ? selectedStatuses.length === status2List.length 
                  ? '전체 프로젝트 목록' 
                  : `선택된 ${selectedStatuses.length}개 단계 프로젝트` 
                : '전체 프로젝트 목록'} ({displayProjects.length})
            </h3>
            {selectedStatuses.length > 0 && selectedStatuses.length < status2List.length && (
              <div className="flex gap-1 overflow-x-auto max-w-md pb-1">
                {selectedStatuses.slice(0, 3).map(s => (
                  <span key={s} className="text-[9px] font-bold text-blue-600 bg-blue-100/50 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    {s}
                  </span>
                ))}
                {selectedStatuses.length > 3 && <span className="text-[9px] font-bold text-slate-400">+{selectedStatuses.length - 3}</span>}
              </div>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                <th className="px-8 py-4">프로젝트명</th>
                <th className="px-8 py-4">PM</th>
                <th className="px-8 py-4 text-right">기간</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {displayProjects.map(p => (
                <tr key={p.id} onClick={() => onSelect(p.id)} className="group hover:bg-slate-50 cursor-pointer">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${p.status1 === 'DONE' ? 'bg-green-500' : 'bg-blue-500'}`} />
                      <div className="font-bold text-slate-700 group-hover:text-blue-600">{p.name}</div>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{p.status2}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-slate-500">{p.manager}</td>
                  <td className="px-8 py-4 text-right font-mono text-[11px] text-slate-400">{p.startDate} ~ {p.endDate}</td>
                </tr>
              ))}
              {displayProjects.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-20 text-center text-slate-400 italic">필터 조건에 맞는 데이터가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
