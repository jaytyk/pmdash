
export const INITIAL_STATUS1 = [
  'TODO',
  'IN_PROGRESS',
  'DONE'
];

export const INITIAL_STATUS2 = [
  '준비중',
  '요구사항취합',
  '킥오프',
  '기획',
  '개발',
  'QA',
  '보안검수',
  '오픈'
];

// Helper to get consistent colors for status 1
export const getStatus1Color = (status: string) => {
  const upper = status.toUpperCase();
  if (upper.includes('DONE') || upper.includes('완료') || upper.includes('종료')) 
    return 'bg-slate-100 text-slate-500 border-slate-200 font-medium';
  
  if (upper.includes('TODO') || upper.includes('대기') || upper.includes('준비')) 
    return 'bg-amber-50 text-amber-700 border-amber-200 font-bold';
  
  if (upper.includes('PROGRESS') || upper.includes('진행')) 
    return 'bg-blue-600 text-white border-blue-700 font-bold shadow-sm';
  
  return 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold'; // Default for custom
};

export const getStatus1ChartColor = (status: string) => {
  const upper = status.toUpperCase();
  if (upper.includes('DONE') || upper.includes('완료') || upper.includes('종료')) return '#94a3b8'; // slate-400
  if (upper.includes('TODO') || upper.includes('대기') || upper.includes('준비')) return '#f59e0b'; // amber-500
  if (upper.includes('PROGRESS') || upper.includes('진행')) return '#2563eb'; // blue-600
  return '#6366f1'; // indigo-500
};

// 현재 날짜를 기준으로 테스트 데이터를 생성하기 위한 헬퍼
const getISO = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const MOCK_PROJECTS = [
  {
    id: '1',
    name: '차세대 AI 고객센터 구축',
    manager: '김철수',
    description: 'LLM 기반 상담 자동화 솔루션 도입 프로젝트',
    status1: 'IN_PROGRESS',
    status2: '개발',
    startDate: getISO(-10),
    endDate: getISO(60),
    milestones: [
      { id: 'm1', title: '인프라 구축 완료', startDate: getISO(-5), endDate: getISO(5), status: 'COMPLETED' },
      { id: 'm2', title: '모델 파인튜닝', startDate: getISO(10), endDate: getISO(25), status: 'UPCOMING' }
    ],
    weeklyReports: [],
  }
];
