import React, { useState } from 'react';
import { Project, WbsTask } from '../types';

interface WbsViewProps {
  project: Project;
  status2Options: string[];
  onUpdateTasks: (newTasks: WbsTask[]) => void;
}

export const WbsView: React.FC<WbsViewProps> = ({ project, status2Options, onUpdateTasks }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskStartDate, setNewTaskStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [targetStatus2, setTargetStatus2] = useState(project.status2);

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: WbsTask = {
      id: Date.now().toString(),
      parentStatus2: targetStatus2,
      title: newTaskTitle,
      isCompleted: false,
      startDate: newTaskStartDate,
      dueDate: newTaskDueDate
    };
    onUpdateTasks([...(project.tasks || []), newTask]);
    setNewTaskTitle('');
  };

  const toggleTask = (taskId: string) => {
    const updated = (project.tasks || []).map(t => 
      t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
    );
    onUpdateTasks(updated);
  };

  const updateTaskField = (taskId: string, field: keyof WbsTask, value: any) => {
    const updated = (project.tasks || []).map(t => 
      t.id === taskId ? { ...t, [field]: value } : t
    );
    onUpdateTasks(updated);
  };

  const deleteTask = (taskId: string) => {
    onUpdateTasks((project.tasks || []).filter(t => t.id !== taskId));
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Add Task Control */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2 w-full">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">단계 선택</label>
          <select 
            value={targetStatus2} 
            onChange={e => setTargetStatus2(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
          >
            {status2Options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div className="flex-[2] space-y-2 w-full">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">개별 작업명 (WBS)</label>
          <input 
            type="text" 
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            placeholder="수행할 작업을 입력하세요"
            onKeyDown={e => e.key === 'Enter' && addTask()}
            className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1 space-y-2 w-full">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">일정 (시작일)</label>
          <input 
            type="date" 
            value={newTaskStartDate}
            onChange={e => setNewTaskStartDate(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1 space-y-2 w-full">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">일정 (마감일)</label>
          <input 
            type="date" 
            value={newTaskDueDate}
            onChange={e => setNewTaskDueDate(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button 
          onClick={addTask}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
        >
          추가
        </button>
      </div>

      {/* Task List Grouped by Status2 */}
      <div className="grid grid-cols-1 gap-6">
        {status2Options.map(s2 => {
          const filteredTasks = (project.tasks || []).filter(t => t.parentStatus2 === s2);
          if (filteredTasks.length === 0 && s2 !== project.status2) return null;

          return (
            <div key={s2} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <h3 className="font-bold text-slate-800">{s2}</h3>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-black rounded-full">
                    {filteredTasks.length} tasks
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-400">
                  진행률: {filteredTasks.length > 0 
                    ? Math.round((filteredTasks.filter(t => t.isCompleted).length / filteredTasks.length) * 100) 
                    : 0}%
                </div>
              </div>
              <div className="divide-y divide-slate-50">
                {filteredTasks.map(task => (
                  <div key={task.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-4 flex-1">
                      <button 
                        onClick={() => toggleTask(task.id)}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                          task.isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-slate-200'
                        }`}
                      >
                        {task.isCompleted && <span className="text-xs">✓</span>}
                      </button>
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${task.isCompleted ? 'text-slate-300 line-through' : 'text-slate-700'}`}>
                          {task.title}
                        </span>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1.5 min-w-[120px]">
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">시작:</span>
                            <input 
                              type="date"
                              value={task.startDate || ''}
                              onChange={(e) => updateTaskField(task.id, 'startDate', e.target.value)}
                              className="text-[10px] font-mono text-slate-500 bg-transparent border-none p-0 focus:ring-0 cursor-pointer hover:text-blue-500"
                            />
                          </div>
                          <div className="flex items-center gap-1.5 min-w-[120px]">
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">종료:</span>
                            <input 
                              type="date"
                              value={task.dueDate || ''}
                              onChange={(e) => updateTaskField(task.id, 'dueDate', e.target.value)}
                              className="text-[10px] font-mono text-slate-500 bg-transparent border-none p-0 focus:ring-0 cursor-pointer hover:text-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all font-bold"
                    >
                      삭제
                    </button>
                  </div>
                ))}
                {filteredTasks.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-sm italic">
                    등록된 작업이 없습니다.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
