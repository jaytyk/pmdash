
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
  // Filter States
  const [filterMode, setFilterMode] = useState<'ALL' | 'MONTH' | 'QUARTER' | 'YEAR' | 'CUSTOM'>('ALL');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  
  // States for Chart Interaction
  const [selectedStatus1, setSelectedStatus1] = useState<string | null>(null);
  const [selectedStatuses2, setSelectedStatuses2] = useState<string[]>([]);

  // 1. 기초 데이터 필터링
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

  // 2. 1단계 필터링
  const status1FilteredProjects = useMemo(() => {
    if (!selectedStatus1) return baseFilteredProjects;
    return baseFilteredProjects.filter(p => p.status1 === selectedStatus1);
  }, [baseFilteredProjects, selectedStatus1]);

  // 3. 최종 표시 데이터
  const displayProjects = useMemo(() => {
    let result = status1FilteredProjects;
    if (selectedStatuses2.length > 0) {
      result = result.filter(p => selectedStatuses2.includes(p.status2));
    }
    return result;
  }, [status1FilteredProjects, selectedStatuses2]);

  // CSV 이스케이프 헬퍼
  const csvEscape = (str: string | undefined) => {
    if (!str) return '""';
    // Remove newlines for CSV compatibility in some viewers, or wrap correctly
    const sanitized = str.replace(/"/g, '""');
    return `"${sanitized}"`;
  };

  const handleExport = () => {
    const csvRows: string[] = [];
    
    // Header 정의
    // 구분 | 항목/날짜 | 상태/기한 | 상세 내용/PM | 비고(기간 등)
    const headers = ['구분', '항목/날짜', '상태/기한', '상세 내용/PM', '비고'];
    csvRows.push('\ufeff' + headers.join(','));

    displayProjects.forEach(p => {
      // 1. 프로젝트 헤더
      csvRows.push([
        csvEscape('PROJECT'),
        csvEscape(p.name),
        csvEscape(`${p.status1} / ${p.status2}`),
        csvEscape(p.manager),
        csvEscape(`${p.startDate} ~ ${p.endDate}`)
      ].join(','));

      // 2. 개요 및 요구사항
      if (p.requirements) {
        csvRows.push([
          csvEscape('REQUIREMENTS'),
          csvEscape('상세 요구사항'),
          csvEscape('-'),
          csvEscape(p.requirements),
          csvEscape('-')
        ].join(','));
      }

      // 3. 마일스톤 목록 (사용자 요청: PM 할당 및 비고열 기간 기입)
      p.milestones.forEach((m, idx) => {
        csvRows.push([
          csvEscape('MILESTONE'),
          csvEscape(`${idx + 1}. ${m.title}`),
          csvEscape(m.status),
          csvEscape(p.manager), // 기본적으로 프로젝트 PM 할당
          csvEscape(`${m.startDate} ~ ${m.endDate}`) // 비고열에 기간 기입
        ].join(','));
      });

      // 4. Project Charter
      if (p.charter) {
        csvRows.push([
          csvEscape('CHARTER'),
          csvEscape('프로젝트 차터'),
          csvEscape('-'),
          csvEscape(p.charter),
          csvEscape('-')
        ].join(','));
      }

      // 5. 주간 보고 내역
      p.weeklyReports.forEach(report => {
        csvRows.push([
          csvEscape('WEEKLY_REPORT'),
          csvEscape(report.date),
          csvEscape('보고완료'),
          csvEscape(report.content),
          csvEscape(p.manager)
        ].join(','));
      });

      // 6. 회고
      if (p.retrospective) {
        csvRows.push([
          csvEscape('RETROSPECTIVE'),
          csvEscape('최종 회고'),
          csvEscape('완료'),
          csvEscape(p.retrospective),
          csvEscape('-')
        ].join(','));
      }

      // 프로젝트 간 구분선 (빈 행)
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

  const toggleStatus2 = (name: string) => {
    setSelectedStatuses2(prev => 
      prev.includes(name) 
        ? prev.filter(s => s !== name) 
        : [...prev, name]
    );
  };

  // 차트 데이터 구성
  const status1Map = status1List.reduce((acc, s) => {
    acc[s] = baseFilteredProjects.filter(p => p.status1 === s).length;
    return acc;
  }, {} as Record<string, number>);

  const status1Data = Object.entries(status1Map).map(([name, value]) => ({
    name,
    value: value as number,
    color: getStatus1ChartColor(name)
  })).filter(d => (d.value as number) >= 0);

  const status2Map = status1FilteredProjects.reduce((acc, p) => {
    acc[p.status2] = (acc[p.status2] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const status2Data = status2List.map(name => ({
    name,
    value: status2Map[name] || 0
  }));

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.5;
    const x = Number(cx) + radius * Math.cos(-Number(midAngle) * RADIAN);
    const y = Number(cy) + radius * Math.sin(-Number(midAngle) * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-bold">
        {value > 0 ? `${value}` : ''}
      </text>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">전체 프로젝트 대시보드</h2>
          <p className="text-slate-500">프로젝트 진행 현황 및 드릴다운 분석 (상세 데이터 내보내기 지원)</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100"
        >
          <span>📥</span> 상세 데이터 전체 내보내기 ({displayProjects.length})
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
                onClick={() => { setFilterMode(mode); setSelectedStatus1(null); setSelectedStatuses2([]); }}
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

        {selectedStatus1 && (
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 animate-slideRight">
            <span className="text-xs font-bold text-blue-600">
              1단계 필터: {selectedStatus1}
            </span>
            <button onClick={() => setSelectedStatus1(null)} className="text-blue-400 hover:text-blue-600 text-xs font-bold ml-1">✕</button>
          </div>
        )}

        <div className="ml-auto text-xs font-medium text-slate-400">
          기준 프로젝트: <span className="font-bold text-slate-900">{baseFilteredProjects.length}</span>건 / 
          현재 필터: <span className="font-bold text-blue-600">{displayProjects.length}</span>건
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[450px]">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-slate-800">1단계 상태 분포</h3>
              <p className="text-[11px] text-slate-400">차트 조각을 클릭하면 상세 프로세스를 필터링합니다.</p>
            </div>
            {selectedStatus1 && (
              <button onClick={() => setSelectedStatus1(null)} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">필터 초기화</button>
            )}
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={status1Data} 
                  cx="50%" 
                  cy="45%" 
                  labelLine={false} 
                  label={renderCustomizedLabel} 
                  outerRadius={110} 
                  dataKey="value"
                  onClick={onPieClick}
                  style={{ cursor: 'pointer' }}
                >
                  {status1Data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      stroke={selectedStatus1 === entry.name ? '#000' : 'none'}
                      strokeWidth={2}
                      opacity={selectedStatus1 && selectedStatus1 !== entry.name ? 0.4 : 1}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value: number, name: string) => [`${value}건`, name]}
                />
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[450px]">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-slate-800">
                {selectedStatus1 ? `${selectedStatus1} 상태의 ` : '전체 '} 
                2단계 상세 프로세스 현황
              </h3>
              <p className="text-[11px] text-slate-400">
                {selectedStatus1 ? `${selectedStatus1} 단계 프로젝트 분석입니다.` : '모든 프로젝트의 공정 분석입니다.'}
              </p>
            </div>
            <div className="flex gap-2">
               <button 
                  onClick={() => setSelectedStatuses2([])}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 px-2 py-1"
                >
                  필터 해제
                </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar mt-4">
            <div className="space-y-2">
              {status2Data.map((item, idx) => {
                const totalSteps = status2List.length;
                const progressPercent = ((idx + 1) / totalSteps) * 100;
                const isSelected = selectedStatuses2.includes(item.name);
                const hasProjects = item.value > 0;

                return (
                  <div 
                    key={idx} 
                    onClick={() => toggleStatus2(item.name)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer group flex flex-col ${
                      isSelected ? 'bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-100' : 
                      hasProjects ? 'bg-white border-transparent hover:bg-slate-50' : 'opacity-30 grayscale'
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
                      <span className={`text-xs font-black ${hasProjects ? (isSelected ? 'text-blue-600' : 'text-slate-900') : 'text-slate-300'}`}>
                        {item.value}건
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-700 ${isSelected ? 'bg-blue-600' : 'bg-blue-400'}`}
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
              프로젝트 목록 ({displayProjects.length})
            </h3>
            <div className="flex gap-2">
              {selectedStatus1 && (
                <span className="text-[10px] font-bold text-blue-600 bg-blue-100/50 px-2 py-0.5 rounded-full">
                  1단계: {selectedStatus1}
                </span>
              )}
              {selectedStatuses2.length > 0 && (
                <span className="text-[10px] font-bold text-purple-600 bg-purple-100/50 px-2 py-0.5 rounded-full">
                  2단계: {selectedStatuses2.length}개 선택됨
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                <th className="px-8 py-4">프로젝트명</th>
                <th className="px-8 py-4">PM</th>
                <th className="px-8 py-4">상세 상태</th>
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
                    </div>
                  </td>
                  <td className="px-8 py-4 text-slate-500">{p.manager}</td>
                  <td className="px-8 py-4">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">{p.status1} / {p.status2}</span>
                  </td>
                  <td className="px-8 py-4 text-right font-mono text-[11px] text-slate-400">{p.startDate} ~ {p.endDate}</td>
                </tr>
              ))}
              {displayProjects.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-slate-400 italic">필터 조건에 맞는 데이터가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
