
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
  const [focusedProjectId, setFocusedProjectId] = useState<string | null>(null);

  // Focus Project Data
  const focusedProject = useMemo(() => 
    projects.find(p => p.id === focusedProjectId), 
    [projects, focusedProjectId]
  );

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

  // Summary Stats
  const topStats = useMemo(() => {
    return {
      upcoming: baseFilteredProjects.filter(p => p.status1 === '착수' || p.status1 === '전기획').length,
      inProgress: baseFilteredProjects.filter(p => p.status1 === '수행' || p.status1 === '진행').length,
      completed: baseFilteredProjects.filter(p => p.status1 === '완료').length,
    };
  }, [baseFilteredProjects]);

  // 2. Filter by Status 1 (Pie Chart selection)
  // Helper to check if a project's current status2 is "In Progress" based on tasks
  const isStatus2InProgress = (project: Project) => {
    if (!project.tasks || project.tasks.length === 0) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const stageTasks = project.tasks.filter(t => t.parentStatus2 === project.status2);
    if (stageTasks.length === 0) return false;

    return stageTasks.some(t => {
      if (!t.startDate || !t.dueDate) return false;
      const start = new Date(t.startDate);
      const end = new Date(t.dueDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return today >= start && today <= end && !t.isCompleted;
    });
  };

  // Helper to calculate time progress percentage for current stage
  const getStageTimeProgress = (project: Project) => {
    if (!project.tasks || project.tasks.length === 0) return 0;
    const stageTasks = project.tasks.filter(t => t.parentStatus2 === project.status2);
    if (stageTasks.length === 0) return 0;

    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    stageTasks.forEach(t => {
      if (t.startDate) {
        const d = new Date(t.startDate);
        if (!minDate || d < minDate) minDate = d;
      }
      if (t.dueDate) {
        const d = new Date(t.dueDate);
        if (!maxDate || d > maxDate) maxDate = d;
      }
    });

    if (!minDate || !maxDate) return 0;

    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const start = new Date(minDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(maxDate);
    end.setHours(23, 59, 59, 999);

    if (today < start) return 0;
    if (today > end) return 100;

    const total = end.getTime() - start.getTime();
    const elapsed = today.getTime() - start.getTime();
    
    return total > 0 ? Math.round((elapsed / total) * 100) : 0;
  };

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

  // 4. WBS Tasks aggregation for the current filter
  const currentWbsTasks = useMemo(() => {
    const tasks: { project: string; task: any }[] = [];
    displayProjects.forEach(p => {
      if (p.tasks) {
        p.tasks.forEach(t => {
          // If Status2 is filtered, only show tasks matching that Status2
          if (selectedStatuses2.length > 0) {
            if (selectedStatuses2.includes(t.parentStatus2)) {
              tasks.push({ project: p.name, task: t });
            }
          } else {
            tasks.push({ project: p.name, task: t });
          }
        });
      }
    });
    return tasks.sort((a, b) => (b.task.isCompleted ? 1 : 0) - (a.task.isCompleted ? 1 : 0));
  }, [displayProjects, selectedStatuses2]);

  const wbsStats = useMemo(() => {
    const total = currentWbsTasks.length;
    const completed = currentWbsTasks.filter(item => item.task.isCompleted).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, rate };
  }, [currentWbsTasks]);

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
      if (!acc[p.status2]) acc[p.status2] = { count: 0, completedTasks: 0, totalTasks: 0 };
      
      acc[p.status2].count += 1;
      if (p.tasks) {
        const relevantTasks = p.tasks.filter(t => t.parentStatus2 === p.status2);
        acc[p.status2].totalTasks += relevantTasks.length;
        acc[p.status2].completedTasks += relevantTasks.filter(t => t.isCompleted).length;
      }
      return acc;
    }, {} as Record<string, { count: number; completedTasks: number; totalTasks: number }>);
    
    return status2List.map(name => {
      const stats = map[name] || { count: 0, completedTasks: 0, totalTasks: 0 };
      const wbsRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
      return {
        name,
        value: stats.count,
        wbsRate
      };
    });
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

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: '예정 프로젝트', count: topStats.upcoming, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: '📅' },
          { label: '진행중 프로젝트', count: topStats.inProgress, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: '⚡' },
          { label: '완료 프로젝트', count: topStats.completed, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', icon: '🏆' }
        ].map((stat, i) => (
          <div key={i} className={`p-6 rounded-2xl border ${stat.border} ${stat.bg} flex items-center justify-between shadow-sm`}>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h4 className={`text-3xl font-black ${stat.color}`}>{stat.count}</h4>
            </div>
            <span className="text-3xl">{stat.icon}</span>
          </div>
        ))}
      </div>

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
          {(selectedStatus1 || selectedStatuses2.length > 0 || focusedProjectId) && (
            <button 
              onClick={() => { setSelectedStatus1(null); setSelectedStatuses2([]); setFocusedProjectId(null); }}
              className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200"
            >
              필터/선택 초기화
            </button>
          )}
        </div>
      </div>

      {/* Project Focus Detail (Selective Exposure) */}
      {focusedProject && (
        <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-blue-500/20 animate-slideDown overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded uppercase">Focused Project</span>
                <span className="text-xs font-bold text-slate-400">ID: {focusedProject.id.slice(0, 8)}</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900">{focusedProject.name}</h3>
              <p className="text-slate-500 text-sm mt-1">{focusedProject.manager} 담당 • {focusedProject.startDate} ~ {focusedProject.endDate}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => onSelect(focusedProject.id)}
                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all"
              >
                상세 페이지로 이동
              </button>
              <button 
                onClick={() => setFocusedProjectId(null)}
                className="px-4 py-2.5 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all"
              >
                닫기
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Depth 1 */}
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">1단계: 상태</span>
              <div className={`inline-flex px-4 py-2 rounded-full text-sm font-bold border shadow-sm ${getStatus1Color(focusedProject.status1)}`}>
                {focusedProject.status1}
              </div>
            </div>
            {/* Depth 2 */}
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">2단계: 상세 공정</span>
                  {isStatus2InProgress(focusedProject) && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[8px] font-black rounded animate-pulse">진행중</span>
                  )}
                </div>
                <div className="px-4 py-2 bg-white rounded-lg border border-slate-200 text-sm font-bold text-slate-700 shadow-sm inline-block">
                  {focusedProject.status2}
                </div>
              </div>
              {focusedProject.tasks && focusedProject.tasks.filter(t => t.parentStatus2 === focusedProject.status2).length > 0 && (
                <div className="mt-4">
                  <div>
                    <div className="flex justify-between text-[9px] font-bold mb-1">
                      <span className="text-slate-400">일정 진행률</span>
                      <span className="text-slate-600">{getStageTimeProgress(focusedProject)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full bg-blue-600 transition-all duration-1000" 
                        style={{ width: `${getStageTimeProgress(focusedProject)}%` }} 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Depth 3 */}
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">3단계: 작업 현황 (WBS/마일스톤)</span>
              <div className="space-y-3">
                {focusedProject.tasks && focusedProject.tasks.length > 0 ? (
                  <div className="space-y-1.5">
                    {focusedProject.tasks.slice(0, 3).map((t, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className={`w-3 h-3 rounded flex items-center justify-center text-[8px] ${t.isCompleted ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                          {t.isCompleted ? '✓' : '•'}
                        </span>
                        <span className={`truncate ${t.isCompleted ? 'text-slate-400 line-through' : 'text-slate-600 font-medium'}`}>{t.title}</span>
                      </div>
                    ))}
                    {focusedProject.tasks.length > 3 && <div className="text-[10px] text-slate-300 pl-5">외 {focusedProject.tasks.length - 3}개 작업...</div>}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">등록된 작업이 없습니다.</span>
                )}
                
                {focusedProject.tasks && focusedProject.tasks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                      <span>전체 WBS 진행률</span>
                      <span>{Math.round((focusedProject.tasks.filter(t => t.isCompleted).length / focusedProject.tasks.length) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500" 
                        style={{ width: `${Math.round((focusedProject.tasks.filter(t => t.isCompleted).length / focusedProject.tasks.length) * 100)}%` }} 
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts & WBS Grid (Depths 1, 2, 3) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Pie Chart (Depth 1) */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[480px]">
          <div className="mb-6">
            <h3 className="font-bold text-slate-800 text-lg">1단계 상태 분포</h3>
            <p className="text-xs text-slate-400">차트 조각을 클릭하면 해당 상태로 필터링됩니다.</p>
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

        {/* Status 2 Breakdown (Depth 2) */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[480px]">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">2단계 상세 프로세스</h3>
              <p className="text-xs text-slate-400">
                {selectedStatus1 ? `[${selectedStatus1}] 내 상세 공정` : '전체 상세 공정'}
              </p>
            </div>
            {selectedStatuses2.length > 0 && (
              <button 
                onClick={() => setSelectedStatuses2([])}
                className="text-[10px] font-bold text-blue-600 hover:underline"
              >
                초기화
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
                        {item.wbsRate > 0 && (
                          <span className="text-[9px] font-black text-green-500 bg-green-50 px-1.5 py-0.5 rounded uppercase">WBS {item.wbsRate}%</span>
                        )}
                      </div>
                      <span className={`text-xs font-black ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>{item.value}</span>
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

        {/* WBS Monitor (Depth 3) */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[480px]">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-slate-800 text-lg">3단계 WBS</h3>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[9px] font-black rounded-full uppercase">3rd DEPTH</span>
              </div>
              <p className="text-xs text-slate-400">필터링된 범위 내 작업 현황</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-blue-600">{wbsStats.rate}%</div>
              <div className="text-[9px] font-bold text-slate-400 uppercase">{wbsStats.completed} / {wbsStats.total} DONE</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {currentWbsTasks.length > 0 ? (
              <div className="space-y-3">
                {currentWbsTasks.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-blue-200 transition-colors">
                    <div className={`flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${item.task.isCompleted ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                      {item.task.isCompleted ? '✓' : '•'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className={`text-xs font-bold truncate ${item.task.isCompleted ? 'text-slate-300 line-through' : 'text-slate-700'}`}>
                        {item.task.title}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1 rounded uppercase tracking-tighter truncate max-w-[100px]">{item.project}</span>
                        <span className="text-[9px] font-bold text-slate-400">{item.task.parentStatus2}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <span className="text-3xl mb-3 block">📦</span>
                <p className="text-xs text-slate-400 italic">표시할 WBS 작업이 없습니다.</p>
              </div>
            )}
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
                  onClick={() => setFocusedProjectId(p.id)} 
                  className={`group cursor-pointer transition-colors border-b border-slate-50 last:border-0 ${p.id === focusedProjectId ? 'bg-blue-50/30' : 'hover:bg-slate-50/80'}`}
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3 mb-1">
                      <div className={`font-bold transition-colors text-base ${p.id === focusedProjectId ? 'text-blue-600' : 'text-slate-800'}`}>
                        {p.name}
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onSelect(p.id); }}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-sm transition-all text-[10px] font-bold flex items-center gap-1 group/btn"
                        title="프로젝트 상세보기"
                      >
                         상세보기 <span className="group-hover/btn:translate-x-0.5 transition-transform">→</span>
                      </button>
                    </div>
                    <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-600">{p.manager}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className="truncate max-w-[200px]">{p.description}</span>
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
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <div className="text-[11px] font-mono text-slate-500 font-bold">{p.startDate}</div>
                        <div className="text-[10px] text-slate-300">~ {p.endDate}</div>
                      </div>
                      {p.tasks && p.tasks.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500" 
                              style={{ width: `${Math.round((p.tasks.filter(t => t.isCompleted).length / p.tasks.length) * 100)}%` }} 
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">{Math.round((p.tasks.filter(t => t.isCompleted).length / p.tasks.length) * 100)}%</span>
                        </div>
                      )}
                    </div>
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
