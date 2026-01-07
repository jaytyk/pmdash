
import React, { useState, useMemo } from 'react';
import { Project } from '../types';

interface SidebarProps {
  projects: Project[];
  selectedId: string | null;
  onSelectProject: (id: string | null) => void;
  onNavigate: (view: 'DASHBOARD' | 'SETTINGS') => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ projects, selectedId, onSelectProject, onNavigate, isOpen, onClose }) => {
  // 섹션 확장/축소 상태 관리
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    TODO: true,
    IN_PROGRESS: true,
    DONE: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // 프로젝트 그룹화 로직
  const groupedProjects = useMemo(() => {
    const groups: Record<string, Project[]> = {
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
      OTHER: []
    };

    projects.forEach(p => {
      const s1 = p.status1.toUpperCase();
      if (s1.includes('TODO') || s1.includes('대기')) groups.TODO.push(p);
      else if (s1.includes('PROGRESS') || s1.includes('진행')) groups.IN_PROGRESS.push(p);
      else if (s1.includes('DONE') || s1.includes('완료')) groups.DONE.push(p);
      else groups.OTHER.push(p);
    });

    return groups;
  }, [projects]);

  // 진행 중인 프로젝트를 2단계 상태별로 재그룹화
  const inProgressSubGroups = useMemo(() => {
    const sub: Record<string, Project[]> = {};
    groupedProjects.IN_PROGRESS.forEach(p => {
      if (!sub[p.status2]) sub[p.status2] = [];
      sub[p.status2].push(p);
    });
    return sub;
  }, [groupedProjects.IN_PROGRESS]);

  const renderProjectItem = (p: Project) => (
    <button
      key={p.id}
      onClick={() => onSelectProject(p.id)}
      className={`w-full text-left px-3 py-2 rounded-lg transition-all text-xs truncate flex items-center gap-2 group/item ${
        selectedId === p.id 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedId === p.id ? 'bg-white' : 'bg-slate-600 group-hover/item:bg-slate-400'}`} />
      <span className="truncate flex-1">{p.name}</span>
      {selectedId !== p.id && <span className="text-[9px] opacity-0 group-hover/item:opacity-100 text-slate-500">보기</span>}
    </button>
  );

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[55] lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}
      
      <div className={`
        fixed left-0 top-0 bottom-0 w-64 bg-slate-900 text-white z-[60] flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-xl">P</div>
            <h1 className="text-lg font-bold tracking-tight">PM Master</h1>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 p-2 hover:bg-slate-800 rounded-md">✕</button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
          {/* Main Navigation */}
          <div className="space-y-1">
            <button 
              onClick={() => onNavigate('DASHBOARD')}
              className="w-full text-left px-4 py-3 rounded-xl transition hover:bg-slate-800 flex items-center gap-3 text-sm font-bold group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">📊</span> 
              <span className="text-slate-300 group-hover:text-white">통합 대시보드</span>
            </button>
          </div>
          
          {/* Projects Grouped by Status */}
          <div className="space-y-4">
            {/* 1. TODO Section */}
            <div>
              <button 
                onClick={() => toggleSection('TODO')}
                className="w-full flex items-center justify-between px-3 mb-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] hover:text-slate-300 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  진행 대기 ({groupedProjects.TODO.length})
                </span>
                <span>{expandedSections.TODO ? '▾' : '▸'}</span>
              </button>
              {expandedSections.TODO && (
                <div className="space-y-0.5 ml-2 animate-fadeIn">
                  {groupedProjects.TODO.map(renderProjectItem)}
                  {groupedProjects.TODO.length === 0 && <div className="px-4 py-2 text-[10px] text-slate-600 italic">대기중인 프로젝트 없음</div>}
                </div>
              )}
            </div>

            {/* 2. IN PROGRESS Section (with Sub-groups) */}
            <div>
              <button 
                onClick={() => toggleSection('IN_PROGRESS')}
                className="w-full flex items-center justify-between px-3 mb-2 text-[10px] font-black text-blue-400 uppercase tracking-[0.15em] hover:text-blue-300 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  실시간 진행 중 ({groupedProjects.IN_PROGRESS.length})
                </span>
                <span>{expandedSections.IN_PROGRESS ? '▾' : '▸'}</span>
              </button>
              {expandedSections.IN_PROGRESS && (
                <div className="space-y-4 ml-2 animate-fadeIn">
                  {/* Explicitly cast Object.entries to fix 'unknown' type error */}
                  {(Object.entries(inProgressSubGroups) as [string, Project[]][]).map(([status2, projs]) => (
                    <div key={status2} className="space-y-1">
                      <div className="px-3 py-1 flex justify-between items-center bg-slate-800/40 rounded-md mb-1">
                        <span className="text-[9px] font-bold text-slate-400">{status2}</span>
                        <span className="text-[9px] font-bold text-slate-500">{projs.length}</span>
                      </div>
                      <div className="space-y-0.5">
                        {projs.map(renderProjectItem)}
                      </div>
                    </div>
                  ))}
                  {groupedProjects.IN_PROGRESS.length === 0 && <div className="px-4 py-2 text-[10px] text-slate-600 italic">진행 중인 프로젝트 없음</div>}
                </div>
              )}
            </div>

            {/* 3. DONE Section */}
            <div>
              <button 
                onClick={() => toggleSection('DONE')}
                className="w-full flex items-center justify-between px-3 mb-2 text-[10px] font-black text-green-500 uppercase tracking-[0.15em] hover:text-green-300 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  완료된 프로젝트 ({groupedProjects.DONE.length})
                </span>
                <span>{expandedSections.DONE ? '▾' : '▸'}</span>
              </button>
              {expandedSections.DONE && (
                <div className="space-y-0.5 ml-2 animate-fadeIn">
                  {groupedProjects.DONE.map(renderProjectItem)}
                  {groupedProjects.DONE.length === 0 && <div className="px-4 py-2 text-[10px] text-slate-600 italic">완료된 프로젝트 없음</div>}
                </div>
              )}
            </div>
          </div>
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => onNavigate('SETTINGS')}
            className="w-full text-left px-4 py-3 rounded-xl transition hover:bg-slate-800 flex items-center gap-3 text-slate-400 text-sm font-medium group"
          >
            <span className="group-hover:rotate-45 transition-transform">⚙️</span> 
            <span className="group-hover:text-slate-200">워크플로우 구성</span>
          </button>
        </div>
      </div>
    </>
  );
};
