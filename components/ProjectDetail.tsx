
import React, { useState } from 'react';
import { Project, Milestone, ViewType, ScaleType, WbsTask } from '../types';
import { MilestoneView } from './MilestoneView';
import { WbsView } from './WbsView';
import { generateTemplate } from '../services/geminiService';
import { getStatus1Color } from '../constants';

interface ProjectDetailProps {
  project: Project;
  onUpdate: (updated: Project) => void;
  onDelete: (id: string) => void;
  status1Options: string[];
  status2Options: string[];
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onUpdate, onDelete, status1Options, status2Options }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'WBS' | 'MILESTONES' | 'CHARTER' | 'REPORT' | 'RETRO'>('OVERVIEW');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [editedName, setEditedName] = useState(project.name);
  const [editedDescription, setEditedDescription] = useState(project.description);
  const [editedManager, setEditedManager] = useState(project.manager);
  const [editedStartDate, setEditedStartDate] = useState(project.startDate);
  const [editedEndDate, setEditedEndDate] = useState(project.endDate);

  const handleStatusChange = (field: 'status1' | 'status2', val: string) => {
    onUpdate({ ...project, [field]: val });
  };

  const handleSaveHeader = () => {
    onUpdate({ ...project, name: editedName, description: editedDescription, manager: editedManager, startDate: editedStartDate, endDate: editedEndDate });
    setIsEditingHeader(false);
  };

  const handleConfirmDelete = () => {
    onDelete(project.id);
    setShowDeleteModal(false);
  };

  const handleAutoGenerate = async (type: any) => {
    setIsGenerating(true);
    const content = await generateTemplate(type, {
      name: project.name, description: project.description, status: `${project.status1} / ${project.status2}`
    });
    const fieldMap: any = { CHARTER: 'charter', REQUIREMENTS: 'requirements', RETROSPECTIVE: 'retrospective' };
    if (type === 'WEEKLY_REPORT') {
      const newReport = { id: Date.now().toString(), date: new Date().toISOString().split('T')[0], content };
      onUpdate({ ...project, weeklyReports: [newReport, ...project.weeklyReports] });
    } else {
      onUpdate({ ...project, [fieldMap[type]]: content });
    }
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Responsive Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-6 relative overflow-hidden">
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900">{project.name}</h2>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatus1Color(project.status1)}`}>
              {project.status1}
            </div>
            {!isEditingHeader && (
              <button onClick={() => setIsEditingHeader(true)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 transition-colors" title="헤더 수정">✏️</button>
            )}
          </div>
          {!isEditingHeader ? (
            <p className="text-slate-500 text-sm leading-relaxed">{project.description}</p>
          ) : (
            <div className="space-y-4 animate-slideDown bg-slate-50/50 p-4 rounded-xl border border-blue-100">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">프로젝트명</label>
                <input value={editedName} onChange={e => setEditedName(e.target.value)} className="w-full p-2.5 text-sm border border-blue-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="프로젝트명" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">설명</label>
                <textarea value={editedDescription} onChange={e => setEditedDescription(e.target.value)} className="w-full p-2.5 text-sm border border-blue-200 rounded-xl bg-white h-24 outline-none focus:ring-2 focus:ring-blue-500" placeholder="설명" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">담당 PM</label>
                  <input value={editedManager} onChange={e => setEditedManager(e.target.value)} className="w-full p-2.5 text-sm border border-blue-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="담당 PM" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">시작일</label>
                  <input type="date" value={editedStartDate} onChange={e => setEditedStartDate(e.target.value)} className="w-full p-2.5 text-sm border border-blue-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">마감예정</label>
                  <input type="date" value={editedEndDate} onChange={e => setEditedEndDate(e.target.value)} className="w-full p-2.5 text-sm border border-blue-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setIsEditingHeader(false)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600">취소</button>
                <button onClick={handleSaveHeader} className="px-6 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">저장</button>
              </div>
            </div>
          )}
        </div>

        <div className="xl:w-80 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4 pt-4 xl:pt-0 xl:pl-6 xl:border-l border-slate-100">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">대분류 상태</label>
            <select value={project.status1} onChange={e => handleStatusChange('status1', e.target.value)} className="p-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-shadow">
              {status1Options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">상세 공정</label>
            <select value={project.status2} onChange={e => handleStatusChange('status2', e.target.value)} className="p-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-shadow">
              {status2Options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          
          <div className="pt-2">
            <button 
              type="button"
              onClick={(e) => { e.preventDefault(); setShowDeleteModal(true); }}
              className="w-full py-2 px-4 border border-red-100 text-red-500 text-[10px] font-black uppercase tracking-tighter rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 group"
            >
              <span className="group-hover:scale-110 transition-transform">🗑️</span> 프로젝트 삭제
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar bg-slate-50/50 -mx-4 px-4 sticky top-0 md:top-[72px] lg:top-0 z-30">
        {[
          { id: 'OVERVIEW', label: '개요', icon: '📝' },
          { id: 'WBS', label: 'WBS', icon: '🌳' },
          { id: 'MILESTONES', label: '마일스톤', icon: '📅' },
          { id: 'CHARTER', label: '차터', icon: '📜' },
          { id: 'REPORT', label: '보고', icon: '📊' },
          { id: 'RETRO', label: '회고', icon: '💡' },
        ].map(tab => (
          <button
            key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="min-h-[400px]">
        {activeTab === 'OVERVIEW' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800">현재 공정 WBS 요약</h3>
                  <button onClick={() => setActiveTab('WBS')} className="text-xs text-blue-600 font-bold hover:underline">상세보기 →</button>
                </div>
                <div className="space-y-2">
                  {(project.tasks || []).filter(t => t.parentStatus2 === project.status2).length > 0 ? (
                    (project.tasks || []).filter(t => t.parentStatus2 === project.status2).slice(0, 5).map(task => (
                      <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className={`w-2 h-2 rounded-full ${task.isCompleted ? 'bg-green-500' : 'bg-slate-300'}`} />
                        <span className={`text-sm ${task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.title}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 text-sm italic py-4">현재 단계에 등록된 작업이 없습니다.</div>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800">상세 요구사항</h3>
                  <button onClick={() => handleAutoGenerate('REQUIREMENTS')} className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg uppercase tracking-tighter hover:bg-blue-100 transition-colors" disabled={isGenerating}>
                    {isGenerating ? 'AI 분석 중...' : '✨ AI 생성'}
                  </button>
                </div>
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 min-h-[200px] text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {project.requirements || '등록된 요구사항이 없습니다. AI를 통해 초안을 작성해보세요.'}
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800">프로젝트 정보</h3>
                  {!isEditingHeader && (
                    <button 
                      onClick={() => {
                        setIsEditingHeader(true);
                        // Scroll to top to see the edit UI
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }} 
                      className="text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      정보 수정
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {[
                    { label: '담당 PM', val: project.manager },
                    { label: '시작일', val: project.startDate },
                    { label: '마감예정', val: project.endDate },
                    { label: '주간보고', val: `${(project.weeklyReports || []).length}회 작성됨` }
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-end border-b border-slate-50 pb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                      <span className="text-sm font-bold text-slate-700">{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'WBS' && (
          <WbsView 
            project={project} 
            status2Options={status2Options} 
            onUpdateTasks={(newTasks) => onUpdate({...project, tasks: newTasks})} 
          />
        )}

        {activeTab === 'MILESTONES' && (
          <MilestoneView milestones={project.milestones || []} onUpdateMilestones={(newList) => onUpdate({...project, milestones: newList})} />
        )}

        {activeTab === 'CHARTER' && (
           <div className="bg-white p-6 md:p-10 rounded-2xl border border-slate-200 shadow-sm max-w-4xl mx-auto space-y-6">
             <div className="flex justify-between items-center">
               <h3 className="text-xl font-bold text-slate-800">Project Charter</h3>
               <button onClick={() => handleAutoGenerate('CHARTER')} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100" disabled={isGenerating}>
                 {isGenerating ? 'AI 생성 중...' : '✨ AI 자동 작성'}
               </button>
             </div>
             <div className="p-6 md:p-8 bg-slate-50 rounded-xl text-sm leading-relaxed text-slate-700 whitespace-pre-wrap border border-slate-100">
                {project.charter || '프로젝트 헌장(Charter)이 아직 작성되지 않았습니다.'}
             </div>
           </div>
        )}

        {activeTab === 'REPORT' && (
           <div className="max-w-3xl mx-auto space-y-4">
             <button onClick={() => handleAutoGenerate('WEEKLY_REPORT')} className="w-full p-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl" disabled={isGenerating}>
               {isGenerating ? 'AI 작성 중...' : '✨ 신규 주간 보고 자동 생성'}
             </button>
             {project.weeklyReports.map(r => (
               <div key={r.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                 <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-50">
                    <span className="font-bold text-slate-800">{r.date} 주간 보고</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{project.manager}</span>
                 </div>
                 <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{r.content}</div>
               </div>
             ))}
           </div>
        )}

        {activeTab === 'RETRO' && (
           <div className="bg-white p-6 md:p-10 rounded-2xl border border-slate-200 shadow-sm max-w-4xl mx-auto space-y-6">
             <div className="flex justify-between items-center">
               <h3 className="text-xl font-bold text-slate-800">회고 (Post-mortem)</h3>
               <button onClick={() => handleAutoGenerate('RETROSPECTIVE')} className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100" disabled={isGenerating}>
                 {isGenerating ? 'AI 분석 중...' : '✨ AI 회고 분석'}
               </button>
             </div>
             <div className="p-6 md:p-8 bg-green-50/20 rounded-xl text-sm leading-relaxed text-slate-700 whitespace-pre-wrap border border-green-100">
                {project.retrospective || '프로젝트 종료 후 성과와 개선점을 정리해보세요.'}
             </div>
           </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-scaleIn border border-red-50">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-4xl mx-auto animate-pulse">
                ⚠️
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">프로젝트를 삭제할까요?</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  이 프로젝트와 관련된 모든 마일스톤, 요구사항, 보고서 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  type="button"
                  onClick={handleConfirmDelete}
                  className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-100 active:scale-95"
                >
                  네, 모두 삭제합니다
                </button>
                <button 
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full py-3 text-sm font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                >
                  아니오, 취소할게요
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
