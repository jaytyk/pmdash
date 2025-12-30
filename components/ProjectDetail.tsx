
import React, { useState } from 'react';
import { Project, Milestone, ViewType, ScaleType } from '../types';
import { MilestoneView } from './MilestoneView';
import { generateTemplate } from '../services/geminiService';
import { getStatus1Color } from '../constants';

interface ProjectDetailProps {
  project: Project;
  onUpdate: (updated: Project) => void;
  status1Options: string[];
  status2Options: string[];
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onUpdate, status1Options, status2Options }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MILESTONES' | 'CHARTER' | 'REPORT' | 'RETRO'>('OVERVIEW');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // States for editing name and description
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editedName, setEditedName] = useState(project.name);
  const [editedDescription, setEditedDescription] = useState(project.description);

  const handleStatusChange = (field: 'status1' | 'status2', val: string) => {
    onUpdate({ ...project, [field]: val });
  };

  const handleSaveHeader = () => {
    onUpdate({
      ...project,
      name: editedName,
      description: editedDescription
    });
    setIsEditingHeader(false);
  };

  const handleCancelHeader = () => {
    setEditedName(project.name);
    setEditedDescription(project.description);
    setIsEditingHeader(false);
  };

  const handleAutoGenerate = async (type: any) => {
    setIsGenerating(true);
    const content = await generateTemplate(type, {
      name: project.name,
      description: project.description,
      status: `${project.status1} / ${project.status2}`
    });
    
    const fieldMap: any = {
      CHARTER: 'charter',
      REQUIREMENTS: 'requirements',
      RETROSPECTIVE: 'retrospective'
    };
    
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
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start bg-white p-6 rounded-xl border border-slate-200 shadow-sm gap-6 relative group/header">
        <div className="flex-1 w-full">
          {!isEditingHeader ? (
            <>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-slate-900">{project.name}</h2>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatus1Color(project.status1)}`}>
                  {project.status1}
                </div>
                <button 
                  onClick={() => setIsEditingHeader(true)}
                  className="opacity-0 group-hover/header:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded text-slate-400"
                  title="정보 수정"
                >
                  <span className="text-xs">✏️</span>
                </button>
              </div>
              <p className="text-slate-500 text-sm max-w-2xl">{project.description}</p>
            </>
          ) : (
            <div className="space-y-3 animate-slideDown">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">프로젝트 이름</label>
                <input 
                  type="text" 
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full p-2 text-lg font-bold border border-blue-200 rounded-lg bg-blue-50/30 focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">프로젝트 설명</label>
                <textarea 
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="w-full p-2 text-sm border border-blue-200 rounded-lg bg-blue-50/30 focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button 
                  onClick={handleCancelHeader}
                  className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  취소
                </button>
                <button 
                  onClick={handleSaveHeader}
                  className="px-4 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all"
                >
                  저장
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-4 min-w-[320px] pt-2 md:pt-0">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">대분류 상태 (1depth)</label>
            <select 
              value={project.status1} 
              onChange={(e) => handleStatusChange('status1', e.target.value)}
              className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none font-semibold transition-all cursor-pointer"
            >
              {status1Options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">상세 프로세스 (2depth)</label>
            <select 
              value={project.status2} 
              onChange={(e) => handleStatusChange('status2', e.target.value)}
              className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none font-semibold transition-all cursor-pointer"
            >
              {status2Options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        {[
          { id: 'OVERVIEW', label: '개요', icon: '📝' },
          { id: 'MILESTONES', label: '마일스톤', icon: '📅' },
          { id: 'CHARTER', label: 'Project Charter', icon: '📜' },
          { id: 'REPORT', label: '주간 보고', icon: '📊' },
          { id: 'RETRO', label: '회고', icon: '💡' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        {activeTab === 'OVERVIEW' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-semibold mb-4 flex justify-between items-center text-slate-800">
                상세 정보 및 요구사항
                <button 
                  onClick={() => handleAutoGenerate('REQUIREMENTS')}
                  className="text-xs text-blue-600 hover:underline font-bold bg-blue-50 px-2 py-1 rounded"
                  disabled={isGenerating}
                >
                  {isGenerating ? '생성 중...' : '✨ AI로 요구사항 생성'}
                </button>
              </h3>
              <div className="prose prose-sm max-w-none text-slate-600">
                {project.requirements ? (
                  <div className="whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-100 leading-relaxed">{project.requirements}</div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <p className="italic text-slate-400 mb-2 text-xs">요구사항 내용이 없습니다.</p>
                    <button 
                      onClick={() => handleAutoGenerate('REQUIREMENTS')}
                      className="text-xs text-blue-500 font-bold hover:text-blue-700"
                    >
                      AI에게 도움을 받아보세요
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-semibold mb-4 text-slate-800">최근 마일스톤</h3>
                <div className="space-y-2">
                   {project.milestones.length > 0 ? project.milestones.slice(0, 3).map(m => (
                     <div key={m.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg text-sm border border-slate-100 hover:border-blue-100 transition-all">
                       <span className="font-medium text-slate-700">{m.title}</span>
                       <span className="text-slate-400 text-[10px] font-mono">{m.endDate}</span>
                     </div>
                   )) : <p className="text-xs text-slate-400 italic text-center py-4">마일스톤이 없습니다.</p>}
                   <button onClick={() => setActiveTab('MILESTONES')} className="w-full text-center text-xs text-blue-600 mt-3 font-bold py-1 hover:bg-blue-50 rounded transition-colors">마일스톤 전체 보기</button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-semibold mb-2 text-slate-800">프로젝트 요약</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs py-2 border-b border-slate-50">
                    <span className="text-slate-400">책임 PM</span>
                    <span className="font-bold text-slate-700">{project.manager}</span>
                  </div>
                  <div className="flex justify-between text-xs py-2 border-b border-slate-50">
                    <span className="text-slate-400">시작 날짜</span>
                    <span className="font-bold text-slate-700">{project.startDate}</span>
                  </div>
                  <div className="flex justify-between text-xs py-2 border-b border-slate-50">
                    <span className="text-slate-400">종료 예정</span>
                    <span className="font-bold text-slate-700">{project.endDate}</span>
                  </div>
                  <div className="flex justify-between text-xs py-2">
                    <span className="text-slate-400">주간 보고 횟수</span>
                    <span className="font-bold text-slate-700">{project.weeklyReports.length}회</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'MILESTONES' && (
          <MilestoneView 
            milestones={project.milestones} 
            onAdd={(m) => onUpdate({...project, milestones: [...project.milestones, m]})} 
          />
        )}

        {activeTab === 'CHARTER' && (
           <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm max-w-4xl mx-auto">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-slate-800">Project Charter</h3>
               <button 
                 onClick={() => handleAutoGenerate('CHARTER')}
                 className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-slate-300 shadow-md font-bold transition-all flex items-center gap-2"
                 disabled={isGenerating}
               >
                 {isGenerating ? 'AI가 작성 중...' : '✨ AI 자동 생성'}
               </button>
             </div>
             <div className="prose prose-blue max-w-none">
                {project.charter ? (
                  <div className="p-8 bg-slate-50 border border-slate-100 rounded-xl font-sans text-sm leading-relaxed whitespace-pre-wrap text-slate-700 shadow-inner">{project.charter}</div>
                ) : (
                  <div className="text-center py-24 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/30">
                    <span className="text-4xl block mb-4">📜</span>
                    <p className="text-sm font-medium mb-4">아직 생성된 Charter가 없습니다.</p>
                    <button 
                      onClick={() => handleAutoGenerate('CHARTER')}
                      className="px-6 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 transition-all"
                    >
                      AI에게 Charter 작성 요청하기
                    </button>
                  </div>
                )}
             </div>
           </div>
        )}

        {activeTab === 'REPORT' && (
           <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">주간 활동 보고</h3>
                <button 
                  onClick={() => handleAutoGenerate('WEEKLY_REPORT')}
                  className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-black font-bold shadow-md transition-all flex items-center gap-2"
                  disabled={isGenerating}
                >
                  {isGenerating ? '작성 중...' : '✨ 신규 주간 보고 생성'}
                </button>
             </div>
             <div className="grid gap-6">
                {project.weeklyReports.map(report => (
                  <div key={report.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-50">
                      <div className="flex items-center gap-3">
                        <span className="p-2 bg-blue-50 text-blue-600 rounded-lg text-xs">📅</span>
                        <span className="font-bold text-slate-900">{report.date} 주간 보고</span>
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">PM: {project.manager}</span>
                    </div>
                    <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50/50 p-4 rounded-lg">{report.content}</div>
                  </div>
                ))}
                {project.weeklyReports.length === 0 && (
                  <div className="text-center py-24 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                    <span className="text-4xl block mb-4">📊</span>
                    리포트 내역이 없습니다.
                  </div>
                )}
             </div>
           </div>
        )}

        {activeTab === 'RETRO' && (
           <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm max-w-4xl mx-auto">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-slate-800">프로젝트 회고 (Post-mortem)</h3>
               <button 
                 onClick={() => handleAutoGenerate('RETROSPECTIVE')}
                 className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-bold shadow-md transition-all flex items-center gap-2"
                 disabled={isGenerating}
               >
                 {isGenerating ? '분석 중...' : '✨ AI 회고 생성'}
               </button>
             </div>
             <div className="prose max-w-none">
                {project.retrospective ? (
                  <div className="p-8 bg-green-50/30 border border-green-100 rounded-xl text-sm leading-relaxed whitespace-pre-wrap text-slate-700 shadow-sm">{project.retrospective}</div>
                ) : (
                  <div className="text-center py-24 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/30">
                    <span className="text-4xl block mb-4">💡</span>
                    <p className="text-sm font-medium">프로젝트 완료 후 회고를 작성하거나 AI에게 요청하세요.</p>
                  </div>
                )}
             </div>
           </div>
        )}
      </div>
    </div>
  );
};
