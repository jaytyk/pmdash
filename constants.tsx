
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
  if (upper.includes('TODO') || upper.includes('대기')) return 'bg-slate-200 text-slate-700 border-slate-300';
  if (upper.includes('PROGRESS') || upper.includes('진행')) return 'bg-blue-100 text-blue-700 border-blue-300';
  if (upper.includes('DONE') || upper.includes('완료')) return 'bg-green-100 text-green-700 border-green-300';
  return 'bg-purple-100 text-purple-700 border-purple-300'; // Default for custom
};

export const getStatus1ChartColor = (status: string) => {
  const upper = status.toUpperCase();
  if (upper.includes('TODO') || upper.includes('대기')) return '#94a3b8';
  if (upper.includes('PROGRESS') || upper.includes('진행')) return '#3b82f6';
  if (upper.includes('DONE') || upper.includes('완료')) return '#22c55e';
  return '#a855f7';
};

export const MOCK_PROJECTS = [
  {
    id: '1',
    name: '차세대 AI 고객센터 구축',
    manager: '김철수',
    description: 'LLM 기반 상담 자동화 솔루션 도입 프로젝트',
    status1: 'IN_PROGRESS',
    status2: '개발',
    startDate: '2024-03-01',
    endDate: '2024-08-30',
    milestones: [
      { id: 'm1', title: '인프라 구축 완료', startDate: '2024-03-01', endDate: '2024-03-15', status: 'COMPLETED' },
      { id: 'm2', title: '모델 파인튜닝', startDate: '2024-04-01', endDate: '2024-05-30', status: 'UPCOMING' }
    ],
    weeklyReports: [],
  }
];
