
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ProjectDetail } from './components/ProjectDetail';
import { Settings } from './components/Settings';
import { AppState, Project } from './types';
import { MOCK_PROJECTS, INITIAL_STATUS1, INITIAL_STATUS2 } from './constants';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    projects: MOCK_PROJECTS as Project[],
    customStatus1: INITIAL_STATUS1,
    customStatus2: INITIAL_STATUS2,
    selectedProjectId: null,
    activeView: 'DASHBOARD'
  });

  const handleSelectProject = (id: string | null) => {
    setState(prev => ({ 
      ...prev, 
      selectedProjectId: id, 
      activeView: id ? 'PROJECT_DETAIL' : 'DASHBOARD' 
    }));
  };

  const handleNavigate = (view: 'DASHBOARD' | 'SETTINGS') => {
    setState(prev => ({ 
      ...prev, 
      activeView: view, 
      selectedProjectId: null 
    }));
  };

  const handleUpdateProject = (updated: Project) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === updated.id ? updated : p)
    }));
  };

  const handleUpdateStatus1 = (newList: string[]) => {
    setState(prev => ({ ...prev, customStatus1: newList }));
  };

  const handleUpdateStatus2 = (newList: string[]) => {
    setState(prev => ({ ...prev, customStatus2: newList }));
  };

  const selectedProject = state.projects.find(p => p.id === state.selectedProjectId);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar 
        projects={state.projects} 
        selectedId={state.selectedProjectId}
        onSelectProject={handleSelectProject}
        onNavigate={handleNavigate}
      />
      
      <main className="flex-1 ml-64 p-8 lg:p-12 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          {state.activeView === 'DASHBOARD' && (
            <Dashboard 
              projects={state.projects} 
              status1List={state.customStatus1}
              status2List={state.customStatus2} // 추가: 2단계 리스트 전달
              onSelect={handleSelectProject} 
            />
          )}

          {state.activeView === 'PROJECT_DETAIL' && selectedProject && (
            <ProjectDetail 
              project={selectedProject} 
              onUpdate={handleUpdateProject}
              status1Options={state.customStatus1}
              status2Options={state.customStatus2}
            />
          )}

          {state.activeView === 'SETTINGS' && (
            <Settings 
              customStatus1={state.customStatus1}
              customStatus2={state.customStatus2} 
              onUpdate1={handleUpdateStatus1}
              onUpdate2={handleUpdateStatus2} 
            />
          )}
        </div>
      </main>

      {/* Persistent Add Project Floating Button */}
      {state.activeView === 'DASHBOARD' && (
        <button 
          onClick={() => {
            const newProj: Project = {
              id: Date.now().toString(),
              name: '신규 프로젝트 ' + (state.projects.length + 1),
              manager: '관리자',
              description: '설명을 입력해주세요.',
              status1: state.customStatus1[0],
              status2: state.customStatus2[0],
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date().toISOString().split('T')[0],
              milestones: [],
              weeklyReports: []
            };
            setState(prev => ({ ...prev, projects: [...prev.projects, newProj] }));
          }}
          className="fixed bottom-10 right-10 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 flex items-center justify-center text-3xl font-light transition-transform hover:scale-110 active:scale-95 z-40"
        >
          +
        </button>
      )}
    </div>
  );
};

export default App;
