
import React, { useState } from 'react';

interface SettingsProps {
  customStatus1: string[];
  customStatus2: string[];
  onUpdate1: (newList: string[]) => void;
  onUpdate2: (newList: string[]) => void;
}

export const Settings: React.FC<SettingsProps> = ({ customStatus1, customStatus2, onUpdate1, onUpdate2 }) => {
  const [newStatus1, setNewStatus1] = useState('');
  const [newStatus2, setNewStatus2] = useState('');

  const handleAdd1 = () => {
    if (newStatus1 && !customStatus1.includes(newStatus1)) {
      onUpdate1([...customStatus1, newStatus1]);
      setNewStatus1('');
    }
  };

  const handleAdd2 = () => {
    if (newStatus2 && !customStatus2.includes(newStatus2)) {
      onUpdate2([...customStatus2, newStatus2]);
      setNewStatus2('');
    }
  };

  const handleRemove1 = (status: string) => {
    if (customStatus1.length > 1) onUpdate1(customStatus1.filter(s => s !== status));
  };

  const handleRemove2 = (status: string) => {
    if (customStatus2.length > 1) onUpdate2(customStatus2.filter(s => s !== status));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <header>
        <h2 className="text-3xl font-bold">워크플로우 설정</h2>
        <p className="text-slate-500">조직의 관리 체계에 맞춰 프로젝트 상태 구조를 커스텀하세요.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Depth 1 Management */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase mb-6 tracking-widest">대분류 상태 (1단계)</h3>
          <div className="flex gap-2 mb-8">
            <input 
              type="text" 
              value={newStatus1}
              onChange={e => setNewStatus1(e.target.value)}
              placeholder="예: BACKLOG, ARCHIVED"
              className="flex-1 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <button 
              onClick={handleAdd1}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
            >
              추가
            </button>
          </div>
          <div className="space-y-2">
            {customStatus1.map((s, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 group hover:border-blue-200 transition-all">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-300">#{idx + 1}</span>
                  <span className="font-bold text-slate-700">{s}</span>
                </div>
                <button 
                  onClick={() => handleRemove1(s)}
                  className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Depth 2 Management */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase mb-6 tracking-widest">상세 프로세스 (2단계)</h3>
          <div className="flex gap-2 mb-8">
            <input 
              type="text" 
              value={newStatus2}
              onChange={e => setNewStatus2(e.target.value)}
              placeholder="예: 통합테스트, 배포완료"
              className="flex-1 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <button 
              onClick={handleAdd2}
              className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-colors shadow-lg"
            >
              추가
            </button>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {customStatus2.map((s, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 group hover:border-slate-300 transition-all">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-300">#{idx + 1}</span>
                  <span className="font-medium text-slate-700">{s}</span>
                </div>
                <button 
                  onClick={() => handleRemove2(s)}
                  className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl">
        <h4 className="font-bold text-blue-800 mb-2">💡 상태 관리 팁</h4>
        <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
          <li><strong>1단계 (대분류):</strong> 전체적인 보드(Todo/In Progress/Done)의 기준이 되며 대시보드 요약에 사용됩니다.</li>
          <li><strong>2단계 (상세):</strong> 프로젝트가 현재 정확히 어느 실무 단계에 있는지 파악하는 데 사용됩니다.</li>
        </ul>
      </div>
    </div>
  );
};
