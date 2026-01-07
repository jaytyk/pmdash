
import React, { useState } from 'react';
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

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSelectProject = (id: string | null) => {
    setState(prev => ({ 
      ...prev, 
      selectedProjectId: id, 
      activeView: id ? 'PROJECT_DETAIL' : 'DASHBOARD' 
    }));
    setIsSidebarOpen(false); // 모바일에서 선택 시 닫기
  };

  const handleNavigate = (view: 'DASHBOARD' | 'SETTINGS') => {
    setState(prev => ({ 
      ...prev, 
      activeView: view, 
      selectedProjectId: null 
    }));
    setIsSidebarOpen(false); // 모바일에서 선택 시 닫기
  };

  const handleUpdateProject = (updated: Project) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === updated.id ? updated : p)
    }));
  };

  const handleDeleteProject = (id: string) => {
    // window.confirm을 명시적으로 호출하여 브라우저 대화상자 보장
    const isConfirmed = window.confirm('이 프로젝트와 관련된 모든 데이터(마일스톤, 보고서 등)가 영구적으로 삭제됩니다. 정말 삭제하시겠습니까?');
    
    if (isConfirmed) {
      setState(prev => ({
        ...prev,
        projects: prev.projects.filter(p => p.id !== id),
        selectedProjectId: null,
        activeView: 'DASHBOARD'
      }));
    }
  };

  const handleUpdateStatus1 = (newList: string[]) => {
    setState(prev => ({ ...prev, customStatus1: newList }));
  };

  const handleUpdateStatus2 = (newList: string[]) => {
    setState(prev => ({ ...prev, customStatus2: newList }));
  };

  const selectedProject = state.projects.find(p => p.id === state.selectedProjectId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <h1 className="font-bold">PM Master</h1>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-slate-800 rounded"
        >
          {isSidebarOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar with Drawer Logic */}
      <Sidebar 
        projects={state.projects} 
        selectedId={state.selectedProjectId}
        onSelectProject={handleSelectProject}
        onNavigate={handleNavigate}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      {/* Main Content Area */}
      <main className={`flex-1 transition-all duration-300 p-4 md:p-8 lg:p-12 lg:ml-64`}>
        <div className="max-w-7xl mx-auto">
          {state.activeView === 'DASHBOARD' && (
            <Dashboard 
              projects={state.projects} 
              status1List={state.customStatus1}
              status2List={state.customStatus2}
              onSelect={handleSelectProject} 
            />
          )}

          {state.activeView === 'PROJECT_DETAIL' && selectedProject && (
            <ProjectDetail 
              project={selectedProject} 
              onUpdate={handleUpdateProject}
              onDelete={handleDeleteProject}
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

      {/* Floating Action Button */}
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
          className="fixed bottom-6 right-6 md:bottom-10 md:right-10 w-12 h-12 md:w-14 md:h-14 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 flex items-center justify-center text-2xl md:text-3xl font-light transition-transform hover:scale-110 active:scale-95 z-40"
        >
          +
        </button>
      )}
    </div>
  );
};

export default App;
