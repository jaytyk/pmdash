
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

  const baseFilteredProjects = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return projects.filter(p => {
      const pStart = new Date(p.startDate);
      const pEnd = new Date(p.endDate);
      if (filterMode === 'MONTH') return pStart.getFullYear() === currentYear && pStart.getMonth() === currentMonth;
      if (filterMode === 'QUARTER') {
        const currentQuarter = Math.floor(currentMonth / 3);
        const pQuarter = Math.floor(pStart.getMonth() / 3);
        return pStart.getFullYear() === currentYear && pQuarter === currentQuarter;
      }
      if (filterMode === 'YEAR') return pStart.getFullYear() === currentYear;
      if (filterMode === 'CUSTOM') {
        const start = customStart ? new Date(customStart) : new Date(0);
        const end = customEnd ? new Date(customEnd) : new Date(8640000000000000);
        return pStart >= start && pEnd <= end;
      }
      return true;
    });
  }, [projects, filterMode, customStart, customEnd]);

  const status1FilteredProjects = useMemo(() => {
    if (!selectedStatus1) return baseFilteredProjects;
    return baseFilteredProjects.filter(p => p.status1 === selectedStatus1);
  }, [baseFilteredProjects, selectedStatus1]);

  const displayProjects = useMemo(() => {
    let result = status1FilteredProjects;
    if (selectedStatuses2.length > 0) {
      result = result.filter(p => selectedStatuses2.includes(p.status2));
    }
    return result;
  }, [status1FilteredProjects, selectedStatuses2]);

  const csvEscape = (str: string | undefined) => {
    if (!str) return '""';
    return `"${str.replace(/"/g, '""')}"`;
  };

  const handleExport = () => {
    const csvRows: string[] = [];
    const headers = ['구분', '항목/날짜', '상태/기한', '상세 내용/PM', '비고'];
    csvRows.push('\ufeff' + headers.join(','));

    displayProjects.forEach(p => {
      csvRows.push([csvEscape('PROJECT'), csvEscape(p.name), csvEscape(`${p.status1} / ${p.status2}`), csvEscape(p.manager), csvEscape(`${p.startDate} ~ ${p.endDate}`)].join(','));
      if (p.requirements) csvRows.push([csvEscape('REQUIREMENTS'), csvEscape('상세 요구사항'), csvEscape('-'), csvEscape(p.requirements), csvEscape('-')].join(','));
      p.milestones.forEach((m, idx) => csvRows.push([csvEscape('MILESTONE'), csvEscape(`${idx + 1}. ${m.title}`), csvEscape(m.status), csvEscape(p.manager), csvEscape(`${m.startDate} ~ ${m.endDate}`)].join(',')));
      if (p.charter) csvRows.push([csvEscape('CHARTER'), csvEscape('프로젝트 차터'), csvEscape('-'), csvEscape(p.charter), csvEscape('-')].join(','));
      p.weeklyReports.forEach(report => csvRows.push([csvEscape('WEEKLY_REPORT'), csvEscape(report.date), csvEscape('보고완료'), csvEscape(report.content), csvEscape(p.manager)].join(',')));
      if (p.retrospective) csvRows.push([csvEscape('RETROSPECTIVE'), csvEscape('최종 회고'), csvEscape('완료'), csvEscape(p.retrospective), csvEscape('-')].join(','));
      csvRows.push(',,,,');
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Project_Full_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const onPieClick = (data: any) => {
    if (data && data.name) {
      setSelectedStatus1(prev => prev === data.name ? null : data.name);
      setSelectedStatuses2([]);
    }
  };

  const status1Data = useMemo(() => {
    const map = status1List.reduce((acc, s) => {
      acc[s] = baseFilteredProjects.filter(p => p.status1 === s).length;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(map).map(([name, value]) => ({
      name, value, color: getStatus1ChartColor(name)
    })).filter(d => d.value >= 0);
  }, [baseFilteredProjects, status1List]);

  const status2Data = useMemo(() => {
    const map = status1FilteredProjects.reduce((acc, p) => {
      acc[p.status2] = (acc[p.status2] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return status2List.map(name => ({ name, value: map[name] || 0 }));
  }, [status1FilteredProjects, status2List]);

  return (
    <div className="space-y-4 md:space-y-8 animate-fadeIn">
      {/* Header */}
      <header className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">대시보드</h2>
          <p className="text-slate-500 text-sm">전체 프로젝트 통합 관리 및 분석</p>
        </div>
        <button 
          onClick={handleExport}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100"
        >
          <span>📥</span> 전체 데이터 내보내기 ({displayProjects.length})
        </button>
      </header>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">기간 필터</span>
          <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl">
            {(['ALL', 'MONTH', 'QUARTER', 'YEAR', 'CUSTOM'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => { setFilterMode(mode); setSelectedStatus1(null); setSelectedStatuses2([]); }}
                className={`flex-1 min-w-[60px] px-3 py-2 text-[11px] font-bold rounded-lg transition-all ${
                  filterMode === mode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {mode === 'ALL' ? '전체' : mode === 'MONTH' ? '당월' : mode === 'QUARTER' ? '분기' : mode === 'YEAR' ? '금년' : '조회'}
              </button>
            ))}
          </div>
        </div>

        {filterMode === 'CUSTOM' && (
          <div className="grid grid-cols-2 gap-2 animate-slideDown">
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="p-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500" />
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="p-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        )}

        <div className="md:ml-auto flex items-center justify-between border-t md:border-t-0 pt-4 md:pt-0 gap-4">
          <div className="text-xs font-medium text-slate-400">
            총 <span className="font-bold text-slate-900">{baseFilteredProjects.length}</span>건 중 <span className="font-bold text-blue-600">{displayProjects.length}</span>건 선택됨
          </div>
          {selectedStatus1 && (
            <button 
              onClick={() => {setSelectedStatus1(null); setSelectedStatuses2([]);}}
              className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg hover:bg-blue-100"
            >
              필터 초기화
            </button>
          )}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Pie Chart */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[400px] md:h-[450px]">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800">1단계 상태 분포</h3>
            <p className="text-[11px] text-slate-400">차트 클릭 시 상세 현황을 드릴다운합니다.</p>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={status1Data} 
                  cx="50%" cy="50%" innerRadius="40%" outerRadius="80%" dataKey="value"
                  onClick={onPieClick} style={{ cursor: 'pointer' }}
                >
                  {status1Data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke={selectedStatus1 === entry.name ? '#000' : 'none'} strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" align="center" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* List Breakdown */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[400px] md:h-[450px]">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800">2단계 공정 현황</h3>
            <p className="text-[11px] text-slate-400">{selectedStatus1 ? `${selectedStatus1} 단계 내부의 상세 공정입니다.` : '모든 프로젝트의 세부 진행도입니다.'}</p>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            <div className="space-y-2">
              {status2Data.map((item, idx) => {
                const isSelected = selectedStatuses2.includes(item.name);
                const progress = ((idx + 1) / status2List.length) * 100;
                return (
                  <div 
                    key={idx} onClick={() => setSelectedStatuses2(prev => prev.includes(item.name) ? prev.filter(s => s !== item.name) : [...prev, item.name])}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:bg-slate-50'}`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-bold text-slate-700">{item.name}</span>
                      <span className="text-xs font-black text-slate-900">{item.value}건</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full bg-blue-500 transition-all`} style={{ width: `${progress}%`, opacity: item.value > 0 ? 1 : 0.2 }} />
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
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">프로젝트 목록 ({displayProjects.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">프로젝트명 / PM</th>
                <th className="px-6 py-4 text-center">상태</th>
                <th className="px-6 py-4 text-right">기간</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {displayProjects.map(p => (
                <tr key={p.id} onClick={() => onSelect(p.id)} className="group hover:bg-blue-50/30 cursor-pointer transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-700 group-hover:text-blue-600 truncate max-w-[200px]">{p.name}</div>
                    <div className="text-[11px] text-slate-400">{p.manager}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-500 rounded uppercase">
                      {p.status2}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-[10px] text-slate-400 whitespace-nowrap">
                    {p.startDate} ~ {p.endDate}
                  </td>
                </tr>
              ))}
              {displayProjects.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-400 italic text-sm">조건에 맞는 데이터가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
