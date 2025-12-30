
import React from 'react';
import { Project } from '../types';

interface SidebarProps {
  projects: Project[];
  selectedId: string | null;
  onSelectProject: (id: string | null) => void;
  onNavigate: (view: 'DASHBOARD' | 'SETTINGS') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ projects, selectedId, onSelectProject, onNavigate }) => {
  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight">PM Master</h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        <button 
          onClick={() => onNavigate('DASHBOARD')}
          className="w-full text-left px-4 py-2 rounded transition hover:bg-slate-800 flex items-center gap-3"
        >
          <span>📊</span> 대시보드
        </button>
        
        <div className="mt-8 mb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          진행중인 프로젝트
        </div>
        
        {projects.map(p => (
          <button
            key={p.id}
            onClick={() => onSelectProject(p.id)}
            className={`w-full text-left px-4 py-2 rounded transition text-sm truncate ${
              selectedId === p.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            • {p.name}
          </button>
        ))}
      </nav>
      
      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={() => onNavigate('SETTINGS')}
          className="w-full text-left px-4 py-2 rounded transition hover:bg-slate-800 flex items-center gap-3 text-slate-400"
        >
          <span>⚙️</span> 상태값 설정
        </button>
      </div>
    </div>
  );
};
