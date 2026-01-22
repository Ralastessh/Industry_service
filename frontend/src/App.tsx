
import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ClipboardCheck, 
  LayoutDashboard, 
  PlusCircle, 
  Search,
  ChevronRight,
  Printer,
  Copy,
  Info,
  MessageSquare,
  GraduationCap,
  History,
  Send,
  Trash2,
  RefreshCcw,
  BarChart3,
  ExternalLink,
  ChevronDown,
  Gavel,
  BookOpen,
  FileSearch,
  Tag,
  TrendingUp,
  Zap,
  AlertCircle,
  Activity
} from 'lucide-react';
import { ScenarioInput, AnalysisResult, ComplianceStatus, ChatMessage, QuizQuestion, GlossaryTerm } from './types';
import { analyzeScenario, chatWithLegalAI } from '../../services/geminiService';
import { MOCK_QUIZZES, MOCK_GLOSSARY_TERMS } from '../../constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'input' | 'results' | 'docs' | 'chat' | 'learning' | 'glossary'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  
  const [scenarios, setScenarios] = useState<AnalysisResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);
  
  const [scenarioForm, setScenarioForm] = useState<ScenarioInput>({
    work_type: '',
    workforce: '',
    equipment: '',
    environment: '',
    optional_text: ''
  });

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  // Glossary States
  const [glossarySearch, setGlossarySearch] = useState('');
  const [selectedGlossaryTerm, setSelectedGlossaryTerm] = useState<GlossaryTerm | null>(MOCK_GLOSSARY_TERMS[0]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // 용어 강조 및 자동 링크 헬퍼 함수
  const renderTextWithGlossary = (text: string) => {
    if (!text) return null;
    // 긴 용어부터 우선 매칭 (예: '중대산업재해'를 '산업재해'보다 먼저 찾음)
    const sortedTerms = [...MOCK_GLOSSARY_TERMS].sort((a: GlossaryTerm, b: GlossaryTerm) => b.term.length - a.term.length);
    const termNames = sortedTerms.map((t: GlossaryTerm) => t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${termNames.join('|')})`, 'g');
    const parts = text.split(regex);
    return parts.map((part: string, i: number) => {
      const matchedTerm = MOCK_GLOSSARY_TERMS.find((t: GlossaryTerm) => t.term === part);
      if (matchedTerm) {
        return (
          <span 
            key={i} 
            onClick={(e: React.MouseEvent<HTMLSpanElement>) => {
              e.stopPropagation();
              setSelectedGlossaryTerm(matchedTerm);
              setActiveTab('glossary');
            }}
            title={matchedTerm.definition}
            className="sogang-text-red font-bold underline decoration-dotted decoration-2 underline-offset-4 cursor-help hover:bg-red-50 transition-colors px-1 rounded"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setScenarioForm((prev: ScenarioInput) => ({ ...prev, [name]: value }));
  };

  const handleRunAnalysis = async () => {
    if (!scenarioForm.work_type) return alert("작업 유형을 입력해주세요.");
    setLoading(true);
    try {
      const data = await analyzeScenario(scenarioForm);
      setScenarios((prev: AnalysisResult[]) => [data, ...prev]);
      setSelectedResult(data);
      setActiveTab('results');
      setScenarioForm({ work_type: '', workforce: '', equipment: '', environment: '', optional_text: '' });
    } catch (error) {
      console.error(error);
      alert("분석에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    setChatHistory((prev: ChatMessage[]) => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const response = await chatWithLegalAI(chatInput, chatHistory);
      setChatHistory((prev: ChatMessage[]) => [...prev, { role: 'model', text: response }]);
    } catch (err) {
      setChatHistory((prev: ChatMessage[]) => [...prev, { role: 'model', text: "오류가 발생했습니다." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const menuItems = [
    { id: 'input', label: '분석 및 관리', sub: ['신규 작업 분석', '공정 수정/추가', '데이터 관리'] },
    { id: 'compliance', label: '컴플라이언스', sub: ['법규 준수 결과', '미흡 항목 권고', 'ISO 인증 현황'] },
    { id: 'engagement', label: '소통 및 학습', sub: ['AI 법률 챗봇', '안전보건 퀴즈', '용어 사전'] },
  ];

  const handleSubMenuClick = (mainId: string, subLabel: string) => {
    setHoveredMenu(null);
    switch (mainId) {
      case 'input':
        if (subLabel === '신규 작업 분석') setActiveTab('input');
        else setActiveTab('input'); 
        break;
      case 'compliance':
        if (selectedResult) setActiveTab('results');
        else {
          alert('먼저 분석을 수행해 주세요.');
          setActiveTab('input');
        }
        break;
      case 'engagement':
        if (subLabel === 'AI 법률 챗봇') setActiveTab('chat');
        else if (subLabel === '안전보건 퀴즈') setActiveTab('learning');
        else if (subLabel === '용어 사전') setActiveTab('glossary');
        break;
    }
  };

  const StatusBadge = ({ status }: { status: ComplianceStatus }) => {
    switch (status) {
      case ComplianceStatus.OK: return <span className="text-blue-600 font-bold">OK</span>;
      case ComplianceStatus.WARN: return <span className="text-amber-500 font-bold">WARN</span>;
      case ComplianceStatus.FAIL: return <span className="text-red-600 font-bold">FAIL</span>;
    }
  };

  const filteredGlossary = MOCK_GLOSSARY_TERMS.filter((item: GlossaryTerm) => 
    item.term.toLowerCase().includes(glossarySearch.toLowerCase()) || 
    item.category.toLowerCase().includes(glossarySearch.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Sidebar */}
      <aside 
        className="w-[240px] sogang-red text-white flex flex-col z-50 shrink-0 shadow-2xl"
        onMouseLeave={() => setHoveredMenu(null)}
      >
        <div className="p-8 border-b border-white/10">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className="flex flex-col items-start hover:opacity-80 transition-opacity text-left w-full focus:outline-none"
          >
             <ShieldAlert className="w-10 h-10 mb-2" />
             <h1 className="text-lg font-bold leading-tight">ISO 45001<br/>Safety AI</h1>
          </button>
        </div>

        <nav className="flex-1 mt-6">
          {menuItems.map((item) => (
            <div 
              key={item.id}
              className="relative"
              onMouseEnter={() => setHoveredMenu(item.id)}
            >
              <button 
                onClick={() => handleSubMenuClick(item.id, item.label)}
                className={`w-full text-left px-8 py-4 text-[15px] hover:bg-black/10 transition flex items-center justify-between ${hoveredMenu === item.id ? 'bg-black/10' : ''}`}
              >
                <span>{item.label}</span>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>
            </div>
          ))}
        </nav>

        <div className="p-8 space-y-3 text-[12px] opacity-70">
          <p className="hover:opacity-100 cursor-pointer transition">안전 관리 포털</p>
          <p className="hover:opacity-100 cursor-pointer transition">법률 데이터베이스</p>
          <p className="hover:opacity-100 cursor-pointer mt-4">ENG</p>
        </div>
      </aside>

      {/* Hover Sub-menu Drawer */}
      <div 
        className={`fixed left-[240px] top-0 h-full w-[320px] bg-white border-r border-slate-200 z-40 shadow-2xl transition-transform duration-300 transform ${hoveredMenu ? 'translate-x-0' : '-translate-x-full'}`}
        onMouseEnter={() => hoveredMenu && setHoveredMenu(hoveredMenu)}
        onMouseLeave={() => setHoveredMenu(null)}
      >
        <div className="p-12">
          <p className="text-xs font-bold sogang-text-red mb-6 uppercase tracking-widest border-b pb-2">Category Detail</p>
          <div className="space-y-6">
            {hoveredMenu && menuItems.find(m => m.id === hoveredMenu)?.sub.map((subItem, i) => (
              <button 
                key={i} 
                onClick={() => handleSubMenuClick(hoveredMenu, subItem)}
                className="block text-left w-full text-slate-800 font-medium hover:sogang-text-red transition-colors group"
              >
                <span className="flex items-center justify-between">
                  {subItem}
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Floating AI Bot Icon */}
        <div 
          onClick={() => setActiveTab('chat')}
          className="fixed bottom-10 right-10 z-[100] cursor-pointer group"
        >
          <div className="bg-white border border-slate-200 shadow-2xl rounded-3xl p-5 flex items-center space-x-4 hover:border-[#8b1d2e] transition-all transform hover:-translate-y-1">
            <div className="sogang-red p-2.5 rounded-2xl text-white">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="hidden group-hover:block pr-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Expert System</p>
              <p className="text-sm font-bold sogang-text-red">AI 실시간 법률 상담</p>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-white pt-20 px-20 scroll-smooth">
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div className="max-w-[1440px] mx-auto space-y-16 animate-in fade-in duration-700">
              <section className="space-y-3">
                <h2 className="text-[2rem] font-light tracking-tight text-slate-900 border-b border-slate-100 pb-6 flex items-center justify-between">
                  <span>SAFETY CALENDAR / STATUS</span>
                  <PlusCircle className="w-6 h-6 opacity-10" />
                </h2>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 pt-6">
                  {/* Calendar Mock */}
                  <div className="bg-slate-50/50 p-10 rounded-[28px] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                       <p className="text-[1.3rem] font-medium">2026년 1월 <ChevronDown className="inline w-4 h-4 ml-2 opacity-30"/></p>
                       <div className="flex space-x-4 opacity-40 hover:opacity-100 transition"><ChevronRight className="rotate-180 w-4 h-4 cursor-pointer" /><ChevronRight className="w-4 h-4 cursor-pointer" /></div>
                    </div>
                    <div className="grid grid-cols-7 gap-2 text-center text-[0.6rem] font-bold opacity-30 mb-5 tracking-widest uppercase">
                      {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-y-6 text-center">
                       {Array.from({length: 31}).map((_, i) => (
                         <div key={i} className={`relative p-2 text-[1rem] cursor-pointer hover:sogang-text-red transition-all ${i === 14 ? 'sogang-red text-white rounded-xl shadow-md' : 'text-slate-600'}`}>
                            {i+1}
                            {i % 6 === 0 && i !== 14 && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-400 rounded-full" />}
                         </div>
                       ))}
                    </div>
                  </div>
                  {/* Status Panel */}
                  <div className="flex flex-col justify-between py-2">
                    <div className="space-y-6">
                      <h3 className="text-[1.3rem] font-medium sogang-text-red flex items-center">
                        <span className="w-1.5 h-1.5 bg-[#8b1d2e] rounded-full mr-2"></span>
                        01월 15일 목요일 일정
                      </h3>
                      <div className="bg-slate-50 p-10 rounded-[28px] border border-slate-100 min-h-[160px] flex items-center justify-center text-slate-400 italic text-[1rem] shadow-inner">
                        현재 예정된 일정이 없습니다.
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-8 pt-8">
                      <div className="text-center group border-r border-slate-100">
                         <p className="text-[0.6rem] font-bold text-slate-400 mb-1 tracking-widest uppercase">Total</p>
                         <p className="text-[2.2rem] font-light group-hover:scale-105 transition-transform">{scenarios.length}</p>
                      </div>
                      <div className="text-center group border-r border-slate-100 text-red-600">
                         <p className="text-[0.6rem] font-bold text-slate-400 mb-1 tracking-widest uppercase">Fail</p>
                         <p className="text-[2.2rem] font-light group-hover:scale-105 transition-transform">{scenarios.reduce((acc, s) => acc + s.summary_stats.fail_count, 0)}</p>
                      </div>
                      <div className="text-center group text-blue-600">
                         <p className="text-[0.6rem] font-bold text-slate-400 mb-1 tracking-widest uppercase">Rate</p>
                         <p className="text-[2.2rem] font-light group-hover:scale-105 transition-transform">84%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* history list */}
              <section className="grid grid-cols-1 xl:grid-cols-2 gap-20 border-t border-slate-100 pt-16">
                <div className="space-y-8">
                  <h2 className="text-[1.4rem] font-light flex justify-between items-center text-slate-900">
                    <span>최근 분석 리포트 (HISTORY)</span>
                    <BarChart3 className="w-5 h-5 opacity-20" />
                  </h2>
                  <div className="space-y-6">
                    {scenarios.length === 0 ? (
                       <p className="text-slate-400 italic text-[0.95rem] py-6">생성된 분석 결과가 없습니다.</p>
                    ) : scenarios.slice(0, 4).map((s, i) => (
                      <div 
                        key={i} 
                        onClick={() => { setSelectedResult(s); setActiveTab('results'); }}
                        className="group flex items-center justify-between cursor-pointer border-b border-slate-100 pb-6 hover:border-[#8b1d2e] transition-all"
                      >
                         <div className="flex items-center space-x-6">
                            <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-red-50 transition-colors">
                               <ShieldAlert className="w-6 h-6 opacity-20 group-hover:opacity-100 group-hover:text-[#8b1d2e]" />
                            </div>
                            <div className="space-y-1">
                               <p className="text-[1.1rem] font-medium group-hover:sogang-text-red transition-colors">{s.scenario.work_type}</p>
                               <p className="text-[0.85rem] text-slate-400 line-clamp-1 italic">{s.scenario.environment}</p>
                            </div>
                         </div>
                         <div className="text-right">
                           <p className="text-[0.6rem] font-bold text-slate-300 font-mono uppercase tracking-widest">{new Date(s.timestamp).toLocaleDateString()}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-8">
                  <h2 className="text-[1.4rem] font-light flex justify-between items-center text-slate-900">
                    <span>안전 가이드 (NEWS)</span>
                    <Info className="w-5 h-5 opacity-20" />
                  </h2>
                  <div className="space-y-5">
                    {['2026년 상반기 정기 안전점검 안내', '[산업안전보건법] 최신 개정 조항 요약', 'ISO 45001 사후 심사 대응 프로세스', '전 사업장 보호구 지급 기준 강화 지침'].map((n, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-4 text-[0.95rem] hover:sogang-text-red cursor-pointer group transition-all">
                         <span className="group-hover:translate-x-2 transition-transform font-light">{n}</span>
                         <span className="text-slate-300 font-mono text-[0.6rem]">2026.01.{(14-i).toString().padStart(2, '0')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* New Analysis View */}
          {activeTab === 'input' && (
            <div className="max-w-[1440px] mx-auto py-16 animate-in slide-in-from-bottom-8 duration-700">
              <div className="mb-16 space-y-3">
                <h2 className="text-[2.2rem] font-light text-slate-900">NEW ANALYSIS</h2>
                <p className="text-slate-400 text-[1.1rem] font-light">ISO 45001 및 국내 안전 법령 기준에 따른 공정별 정밀 분석 시스템</p>
              </div>
              
              <div className="space-y-16 border-t border-slate-100 pt-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-20 gap-y-12">
                  <div className="space-y-3">
                    <label className="text-[0.75rem] font-bold text-slate-400 uppercase tracking-[0.2em] border-l-4 border-[#8b1d2e] pl-4 uppercase">Work Category</label>
                    <input name="work_type" value={scenarioForm.work_type} onChange={handleInputChange} className="w-full py-4 text-[1.4rem] font-light border-b-2 border-slate-100 focus:border-[#8b1d2e] outline-none transition-all placeholder:text-slate-500 bg-transparent text-slate-900" placeholder="예: 야간 물류 피킹 작업" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[0.75rem] font-bold text-slate-400 uppercase tracking-[0.2em] border-l-4 border-[#8b1d2e] pl-4 uppercase">Workforce Configuration</label>
                    <input name="workforce" value={scenarioForm.workforce} onChange={handleInputChange} className="w-full py-4 text-[1.4rem] font-light border-b-2 border-slate-100 focus:border-[#8b1d2e] outline-none transition-all placeholder:text-slate-500 bg-transparent text-slate-900" placeholder="예: 정규직 5명, 단기 10명" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[0.75rem] font-bold text-slate-400 uppercase tracking-[0.2em] border-l-4 border-[#8b1d2e] pl-4 uppercase">Equipment & Assets</label>
                    <input name="equipment" value={scenarioForm.equipment} onChange={handleInputChange} className="w-full py-4 text-[1.4rem] font-light border-b-2 border-slate-100 focus:border-[#8b1d2e] outline-none transition-all placeholder:text-slate-500 bg-transparent text-slate-900" placeholder="예: 전동 지게차 2대, 컨베이어" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[0.75rem] font-bold text-slate-400 uppercase tracking-[0.2em] border-l-4 border-[#8b1d2e] pl-4 uppercase">Operational Environment</label>
                    <input name="environment" value={scenarioForm.environment} onChange={handleInputChange} className="w-full py-4 text-[1.4rem] font-light border-b-2 border-slate-100 focus:border-[#8b1d2e] outline-none transition-all placeholder:text-slate-500 bg-transparent text-slate-900" placeholder="예: 실내 저온 창고, 혼재 동선" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[0.75rem] font-bold text-slate-400 uppercase tracking-[0.2em] border-l-4 border-[#8b1d2e] pl-4 uppercase">Additional Context & Specific Risks</label>
                  <textarea name="optional_text" value={scenarioForm.optional_text} onChange={handleInputChange} rows={4} className="w-full py-5 text-[1.1rem] font-light border-b-2 border-slate-100 focus:border-[#8b1d2e] outline-none transition-all resize-none placeholder:text-slate-500 bg-transparent text-slate-900 leading-relaxed" placeholder="추가적인 작업 조건이나 우려되는 법적 위험 요소를 자유롭게 기술하십시오." />
                </div>
                
                <div className="pt-8 flex justify-center">
                  <button 
                    onClick={handleRunAnalysis}
                    disabled={loading}
                    className="sogang-red text-white px-20 py-4 text-[1.1rem] font-light rounded-full shadow-xl shadow-red-900/30 hover:scale-105 transition-all transform active:scale-95 disabled:opacity-50 flex items-center space-x-4 group"
                  >
                    {loading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5 group-hover:rotate-12" />}
                    <span>{loading ? 'AI ANALYZING...' : 'EXECUTE COMPLIANCE ANALYSIS'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results Tab - Compliance Report with Executive Focus */}
          {activeTab === 'results' && selectedResult && (
             <div className="max-w-[1440px] mx-auto py-16 animate-in fade-in duration-700">
                <div className="flex justify-between items-end mb-14 border-b border-slate-100 pb-10">
                   <div className="space-y-3">
                      <p className="text-[0.75rem] font-black sogang-text-red uppercase tracking-[0.4em] mb-2 font-mono">EXECUTIVE BRIEFING: RISK COMPLIANCE</p>
                      <h2 className="text-[3rem] font-light text-slate-900 tracking-tight">{selectedResult.scenario.work_type}</h2>
                   </div>
                   <button className="flex items-center space-x-3 text-[0.9rem] font-bold border border-slate-200 px-8 py-4 rounded-full hover:bg-slate-50 transition-all shadow-sm"><Printer className="w-5 h-5"/> <span>GENERATE BOARD SLIDE (PDF)</span></button>
                </div>

                {/* Executive Summary Section - Slide Style */}
                <section className="mb-24">
                   <div className="bg-slate-900 text-white rounded-[64px] p-20 relative overflow-hidden shadow-2xl border border-white/5">
                      <div className="absolute top-0 right-0 p-20 opacity-[0.04] scale-[3] pointer-events-none"><Zap className="w-64 h-64" /></div>
                      <div className="relative z-10">
                         <div className="flex items-center space-x-6 mb-16">
                            <div className="bg-red-800 p-4 rounded-3xl shadow-xl"><TrendingUp className="w-10 h-10" /></div>
                            <h3 className="text-[1.2rem] font-black tracking-[0.3em] uppercase text-red-500">Board-Level Strategic Summary</h3>
                         </div>
                         
                         <div className="grid grid-cols-1 gap-14 max-w-7xl">
                            {/* Conclusion */}
                            <div className="space-y-6">
                               <div className="text-[2.5rem] font-light leading-[1.2] border-l-[10px] border-red-600 pl-14 text-white">
                                  {renderTextWithGlossary(selectedResult.compliance_evaluation.summary.split('\n')[0])}
                                </div>
                            </div>
                            
                            {/* Structured Briefing */}
                            <div className="pl-16 grid grid-cols-1 md:grid-cols-2 gap-20 pt-8">
                               <div className="space-y-12">
                                  {selectedResult.compliance_evaluation.summary.split('\n').slice(1, 3).map((line, idx) => (
                                     line.trim() && (
                                        <div key={idx} className="flex items-start space-x-8 group">
                                           <div className="mt-3 w-3 h-3 bg-red-600 rounded-full shrink-0 shadow-[0_0_15px_rgba(220,38,38,1)] group-hover:scale-125 transition-transform"></div>
                                           <p className="text-[1.3rem] text-slate-300 font-light leading-relaxed tracking-wide">
                                              {renderTextWithGlossary(line.replace(/^-\s*/, ''))}
                                           </p>
                                        </div>
                                     )
                                  ))}
                               </div>
                               <div className="space-y-12">
                                  {selectedResult.compliance_evaluation.summary.split('\n').slice(3).map((line, idx) => (
                                     line.trim() && (
                                        <div key={idx} className={`flex items-start space-x-8 ${line.includes('Decision') ? 'bg-white/5 p-10 rounded-[40px] border border-white/10 shadow-2xl backdrop-blur-sm' : ''}`}>
                                           <div className={`mt-3 w-3 h-3 rounded-full shrink-0 ${line.includes('Decision') ? 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)]' : 'bg-red-600'}`}></div>
                                           <p className={`text-[1.3rem] leading-relaxed tracking-wide ${line.includes('Decision') ? 'text-amber-400 font-bold' : 'text-slate-300 font-light'}`}>
                                              {renderTextWithGlossary(line.replace(/^-\s*/, ''))}
                                           </p>
                                        </div>
                                     )
                                  ))}
                               </div>
                            </div>
                         </div>

                         {/* SAPA Status Banner */}
                         <div className="mt-24 flex items-center justify-between border-t border-white/10 pt-14">
                            <div className="flex items-center space-x-12">
                               <div className={`flex items-center space-x-5 px-10 py-4 rounded-full border ${selectedResult.summary_stats.fail_count > 0 ? 'border-red-500 text-red-500 bg-red-500/10' : 'border-emerald-500 text-emerald-500 bg-emerald-500/10'}`}>
                                  <AlertCircle className="w-7 h-7" />
                                  <span className="text-[0.9rem] font-black uppercase tracking-widest">SAPA Risk Index: {selectedResult.summary_stats.fail_count > 0 ? 'CRITICAL EXPOSURE' : 'MANAGED'}</span>
                               </div>
                               <div className="flex items-center space-x-5 px-10 py-4 rounded-full border border-blue-500 text-blue-500 bg-blue-500/10">
                                  <Activity className="w-7 h-7" />
                                  <span className="text-[0.9rem] font-black uppercase tracking-widest">Operation Continuity: {selectedResult.summary_stats.fail_count > 0 ? 'High Interruption Risk' : 'Strategic Stability'}</span>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-[0.7rem] font-black text-white/30 uppercase tracking-[0.5em] mb-2 font-mono">Total Risk Exposure Rate</p>
                               <p className="text-[3rem] font-black text-white">{Math.round((selectedResult.summary_stats.fail_count / selectedResult.summary_stats.total_items) * 100)}%</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-20">
                   <div className="lg:col-span-3 space-y-16">
                      <h3 className="text-[1.8rem] font-bold flex items-center border-b border-slate-100 pb-8 uppercase tracking-tighter">
                         <ClipboardCheck className="w-8 h-8 mr-5 sogang-text-red" /> Operational Compliance Audit Details
                      </h3>
                      <div className="grid grid-cols-1 gap-16">
                         {selectedResult.checklist.map((item, i) => (
                           <div key={i} className="group border-l-[3px] border-slate-100 pl-14 py-4 hover:border-[#8b1d2e] transition-all relative">
                              <div className="flex justify-between items-start mb-8">
                                 <h4 className="text-[1.6rem] font-bold text-slate-800 tracking-tight leading-tight">{item.item_title}</h4>
                                 <div className="scale-125 origin-right"><StatusBadge status={item.status} /></div>
                              </div>
                              <p className="text-slate-500 text-[1.25rem] leading-relaxed mb-12 max-w-5xl font-light">
                                 {renderTextWithGlossary(item.why_it_matters)}
                              </p>
                              
                              <div className="space-y-8">
                                <div className="bg-slate-50 p-10 rounded-[48px] border border-slate-100 flex items-start space-x-8 shadow-sm group-hover:bg-white transition-all hover:shadow-xl">
                                   <div className="bg-white p-3 rounded-2xl shrink-0 mt-0.5 shadow-sm border border-slate-100"><ChevronRight className="w-7 h-7 sogang-text-red" /></div>
                                   <div className="space-y-3">
                                     <span className="text-[0.8rem] font-black text-slate-400 uppercase tracking-widest block mb-2">Required Mitigating Decision:</span>
                                     <span className="text-slate-900 font-bold text-[1.25rem] leading-relaxed">
                                       {renderTextWithGlossary(item.required_action)}
                                     </span>
                                   </div>
                                </div>
                                
                                <div className="bg-slate-50/50 p-12 rounded-[48px] border border-dashed border-slate-200 flex flex-col space-y-6">
                                   <div className="flex items-center space-x-5 text-slate-500 border-b border-slate-200 pb-6">
                                      <Gavel className="w-7 h-7 sogang-text-red shrink-0" />
                                      <span className="text-[0.9rem] font-black uppercase tracking-widest font-mono">Legal Basis & Clause Specific Analysis</span>
                                   </div>
                                   <div className="text-[1.15rem] text-slate-700 leading-relaxed font-light whitespace-pre-wrap">
                                      {renderTextWithGlossary(item.legal_basis)}
                                   </div>
                                </div>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                   <div className="space-y-12">
                      <div className="bg-slate-50/50 p-12 rounded-[56px] border border-slate-100 space-y-12 shadow-sm">
                         <h3 className="text-[1rem] font-black border-b border-slate-200 pb-6 tracking-widest text-slate-800 uppercase font-mono">Audit snapshot</h3>
                         <div className="space-y-10">
                            <div className="flex justify-between items-center">
                               <span className="text-slate-500 font-light text-[1.2rem]">Items Evaluated</span>
                               <span className="font-bold text-[2.2rem]">{selectedResult.summary_stats.total_items}</span>
                            </div>
                            <div className="flex justify-between items-center text-red-600">
                               <span className="font-bold text-[1.2rem]">Strategic Failures</span>
                               <span className="font-black text-[2.2rem]">{selectedResult.summary_stats.fail_count}</span>
                            </div>
                         </div>
                      </div>
                      <div className="sogang-red p-12 rounded-[56px] text-white space-y-10 shadow-2xl shadow-red-900/30 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-transform"><Zap className="w-24 h-24" /></div>
                         <h3 className="text-[1rem] font-black border-b border-white/20 pb-6 tracking-widest uppercase font-mono">Priority Decision</h3>
                         <p className="text-[1.3rem] font-bold leading-relaxed italic relative z-10">"{selectedResult.summary_stats.top_3_actions[0]}"</p>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {/* Chatbot Tab */}
          {activeTab === 'chat' && (
            <div className="max-w-[1440px] mx-auto h-[82vh] flex flex-col pt-8 animate-in fade-in duration-700">
              <div className="border-b border-slate-100 pb-8 mb-8">
                 <h2 className="text-[2.2rem] font-light mb-2 text-slate-900">AI COMPLIANCE CHAT</h2>
                 <p className="text-slate-400 text-[1.1rem] font-light">전문 법률 해석 및 ISO 45001 가이드 지원</p>
              </div>
              <div className="flex-1 overflow-y-auto space-y-12 pr-6 scrollbar-hide pb-8">
                {chatHistory.length === 0 && (
                  <div className="py-32 text-center space-y-6 border-2 border-dashed border-slate-50 rounded-[40px]">
                     <div className="space-y-2">
                        <p className="text-[1.8rem] font-light text-slate-200 italic">"질문을 입력해 주세요"</p>
                        <p className="text-[0.95rem] text-slate-400 font-light max-w-lg mx-auto">산업안전보건법 및 ISO 표준 전문 상담</p>
                     </div>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] space-y-2`}>
                       <p className={`text-[0.6rem] font-bold uppercase tracking-[0.3em] ${msg.role === 'user' ? 'text-right text-slate-300' : 'text-slate-300'}`}>
                         {msg.role === 'user' ? 'Inquiry' : 'Expert'}
                       </p>
                       <div className={`px-10 py-6 rounded-[32px] text-[1.1rem] leading-relaxed shadow-sm ${msg.role === 'user' ? 'sogang-red text-white rounded-tr-none' : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-none font-light'}`}>
                         {renderTextWithGlossary(msg.text)}
                       </div>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                   <div className="flex justify-start">
                     <div className="animate-pulse space-y-2">
                        <div className="w-16 h-2 bg-slate-50 rounded"></div>
                        <div className="w-[400px] h-24 bg-slate-50 rounded-[32px]"></div>
                     </div>
                   </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="py-8 border-t border-slate-100 mt-6">
                 <div className="relative max-w-6xl mx-auto">
                    <input 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                      className="w-full pl-10 pr-28 py-6 bg-slate-50 rounded-full border-2 border-slate-50 outline-none focus:border-[#8b1d2e] focus:bg-white transition-all text-[1.2rem] font-light shadow-inner placeholder:text-slate-500"
                      placeholder="메시지를 입력하세요..."
                    />
                    <button 
                      onClick={handleChatSend}
                      className="absolute right-4 top-1/2 -translate-y-1/2 sogang-red text-white p-5 rounded-full hover:scale-105 active:scale-95 transition-all"
                    >
                       <Send className="w-6 h-6" />
                    </button>
                 </div>
              </div>
            </div>
          )}

          {/* Glossary Tab (용어 사전) */}
          {activeTab === 'glossary' && (
            <div className="max-w-[1440px] mx-auto py-16 animate-in fade-in duration-700">
               <div className="mb-12 space-y-3">
                  <h2 className="text-[2.2rem] font-light text-slate-900">SAFETY GLOSSARY</h2>
                  <p className="text-slate-400 text-[1.1rem] font-light">중대재해처벌법 및 산업안전보건법 핵심 용어 대백과</p>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 border-t border-slate-100 pt-12">
                  {/* Left Sidebar: List & Search */}
                  <div className="lg:col-span-4 space-y-6">
                     <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                           value={glossarySearch}
                           onChange={(e) => setGlossarySearch(e.target.value)}
                           className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:border-[#8b1d2e] transition-all text-[0.95rem]"
                           placeholder="용어 또는 카테고리 검색..."
                        />
                     </div>
                     <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
                        {filteredGlossary.map((item, idx) => (
                           <button 
                              key={idx}
                              onClick={() => setSelectedGlossaryTerm(item)}
                              className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${selectedGlossaryTerm?.term === item.term ? 'sogang-red text-white border-[#8b1d2e] shadow-lg' : 'bg-white border-slate-100 text-slate-700 hover:border-red-200'}`}
                           >
                              <div className="space-y-1">
                                 <p className="font-bold text-[1rem]">{item.term}</p>
                                 <p className={`text-[0.7rem] uppercase tracking-widest ${selectedGlossaryTerm?.term === item.term ? 'text-white/60' : 'text-slate-400'}`}>{item.category}</p>
                              </div>
                              <ChevronRight className={`w-4 h-4 transition-transform ${selectedGlossaryTerm?.term === item.term ? 'translate-x-1 opacity-100' : 'opacity-20 group-hover:opacity-100'}`} />
                           </button>
                        ))}
                        {filteredGlossary.length === 0 && <p className="text-slate-400 italic text-center py-10">검색 결과가 없습니다.</p>}
                     </div>
                  </div>

                  {/* Right Content: Detail View */}
                  <div className="lg:col-span-8">
                     {selectedGlossaryTerm ? (
                        <div className="bg-slate-50/50 p-12 rounded-[40px] border border-slate-100 space-y-12 animate-in slide-in-from-right-8">
                           <div className="space-y-4">
                              <div className="flex items-center space-x-3 text-[#8b1d2e]">
                                 <Tag className="w-5 h-5" />
                                 <span className="text-[0.75rem] font-bold uppercase tracking-[0.3em] font-mono">{selectedGlossaryTerm.category}</span>
                              </div>
                              <h3 className="text-[3rem] font-light text-slate-900 tracking-tight">{selectedGlossaryTerm.term}</h3>
                           </div>

                           <div className="space-y-10">
                              <section className="space-y-4">
                                 <h4 className="text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                                    <Info className="w-4 h-4 mr-2" /> 용어의 정의
                                 </h4>
                                 <p className="text-[1.2rem] font-light leading-relaxed text-slate-700 border-l-4 border-slate-200 pl-8">
                                    {selectedGlossaryTerm.definition}
                                 </p>
                              </section>

                              <section className="space-y-4">
                                 <h4 className="text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                                    <BookOpen className="w-4 h-4 mr-2" /> 법률 조항 예시 (Case Example)
                                 </h4>
                                 <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm font-light text-[1.1rem] italic text-slate-600 leading-relaxed">
                                    "{selectedGlossaryTerm.legal_example}"
                                 </div>
                              </section>

                              <section className="space-y-4">
                                 <h4 className="text-[0.75rem] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                                    <TrendingUp className="w-4 h-4 mr-2" /> 산업 현장에서의 중요성
                                 </h4>
                                 <p className="text-[1.1rem] leading-relaxed text-slate-700 bg-[#8b1d2e]/5 p-8 rounded-3xl border border-[#8b1d2e]/10">
                                    {selectedGlossaryTerm.industrial_significance}
                                 </p>
                              </section>
                           </div>
                        </div>
                     ) : (
                        <div className="h-full flex items-center justify-center text-slate-300 italic border-2 border-dashed border-slate-50 rounded-[40px]">
                           왼쪽 목록에서 용어를 선택하십시오.
                        </div>
                     )}
                  </div>
               </div>
            </div>
          )}

          {/* Learning Tab */}
          {activeTab === 'learning' && (
             <div className="max-w-[1000px] mx-auto py-16 flex flex-col justify-center min-h-[70vh] animate-in slide-in-from-bottom-8 duration-1000">
                {!quizFinished ? (
                   <div className="space-y-16">
                      <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                         <div className="space-y-1.5">
                            <p className="text-[0.75rem] font-bold sogang-text-red uppercase tracking-[0.3em] mb-2">Quiz Module</p>
                            <h2 className="text-[2.2rem] font-light text-slate-900 italic">QUESTION 0{quizIndex + 1}</h2>
                         </div>
                         <div className="flex flex-col items-end">
                            <span className="text-slate-300 font-mono text-[0.75rem] mb-2">Phase: {Math.round((quizIndex + 1)/MOCK_QUIZZES.length * 100)}%</span>
                            <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                               <div className="h-full bg-[#8b1d2e] transition-all duration-700" style={{ width: `${(quizIndex + 1)/MOCK_QUIZZES.length * 100}%` }}></div>
                            </div>
                         </div>
                      </div>
                      <h3 className="text-[1.8rem] font-light leading-snug text-slate-900">{MOCK_QUIZZES[quizIndex].question}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {MOCK_QUIZZES[quizIndex].options.map((opt, i) => (
                           <button 
                             key={i} 
                             onClick={() => setSelectedAnswer(i)}
                             className={`group text-left p-8 rounded-[24px] border-2 transition-all text-[1.1rem] leading-relaxed flex items-start ${selectedAnswer === i ? 'border-[#8b1d2e] sogang-text-red bg-red-50/50 shadow-inner' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-600'}`}
                           >
                             <span className="font-mono text-[1.4rem] opacity-20 mr-6 italic group-hover:opacity-100 group-hover:sogang-text-red transition-opacity">0{i+1}</span>
                             <span className="flex-1">{opt}</span>
                           </button>
                         ))}
                      </div>
                      <div className="flex justify-center pt-8">
                        <button 
                           disabled={selectedAnswer === null}
                           onClick={() => {
                              if (selectedAnswer === MOCK_QUIZZES[quizIndex].correctIndex) setQuizScore(s => s + 1);
                              if (quizIndex < MOCK_QUIZZES.length - 1) { setQuizIndex(i => i + 1); setSelectedAnswer(null); }
                              else { setQuizFinished(true); }
                           }}
                           className="w-full max-w-lg py-6 sogang-red text-white text-[1.4rem] font-light rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
                        >
                           {quizIndex === MOCK_QUIZZES.length - 1 ? 'RESULT' : 'CONTINUE'}
                        </button>
                      </div>
                   </div>
                ) : (
                   <div className="text-center space-y-12 py-16 bg-slate-50/30 rounded-[48px] border border-slate-100 animate-in zoom-in duration-1000">
                      <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto text-emerald-500 shadow-xl">
                         <CheckCircle2 className="w-16 h-16" />
                      </div>
                      <div className="space-y-4">
                         <h2 className="text-[2.8rem] font-light text-slate-900 tracking-tight">COMPLETE</h2>
                         <p className="text-slate-400 text-[1.2rem] font-light">학습을 완료하였습니다.</p>
                      </div>
                      <div className="text-[5rem] font-black text-slate-900 tabular-nums">{quizScore} / {MOCK_QUIZZES.length}</div>
                      <div className="flex justify-center space-x-8 pt-8">
                        <button 
                           onClick={() => { setQuizIndex(0); setQuizFinished(false); setQuizScore(0); setSelectedAnswer(null); }}
                           className="px-16 py-5 border-2 border-[#8b1d2e] sogang-text-red rounded-full text-[1.1rem] hover:bg-red-50 transition-all font-light"
                        >
                           Retry
                        </button>
                        <button 
                           onClick={() => setActiveTab('dashboard')}
                           className="px-16 py-5 sogang-red text-white rounded-full text-[1.1rem] hover:opacity-90 shadow-xl transition-all font-light"
                        >
                           Home
                        </button>
                      </div>
                   </div>
                )}
             </div>
          )}

          {/* Footer */}
          <footer className="mt-32 border-t border-slate-100 pt-16 pb-32 bg-slate-50/30">
            <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-24 text-[0.85rem] text-slate-400 leading-relaxed">
               <div className="space-y-6 pr-16">
                  <ShieldAlert className="w-8 h-8 opacity-20" />
                  <p className="text-[0.95rem] font-light italic">"ISO 45001 기준과 국내 법령을 실시간 반영하는 안전보건 컴플라이언스 AI 에이전트 서비스입니다."</p>
               </div>
               <div className="space-y-4">
                  <p className="font-bold text-slate-900 text-[1rem] border-b border-slate-200 pb-3 uppercase tracking-widest">Network</p>
                  <div className="grid grid-cols-1 gap-4 font-light">
                    <p className="hover:sogang-text-red cursor-pointer transition-colors flex items-center">산업안전보건공단 <ExternalLink className="w-3 h-3 ml-2 opacity-30"/></p>
                    <p className="hover:sogang-text-red cursor-pointer transition-colors flex items-center">고용노동부 <ExternalLink className="w-3 h-3 ml-2 opacity-30"/></p>
                  </div>
               </div>
               <div className="space-y-6">
                  <p className="font-bold text-slate-900 text-[1rem] border-b border-slate-200 pb-3 uppercase tracking-widest">Legal</p>
                  <div className="grid grid-cols-1 gap-4 font-light">
                    <p className="hover:sogang-text-red cursor-pointer transition-colors font-bold">개인정보처리방침</p>
                  </div>
                  <div className="pt-8">
                    <p className="text-[0.65rem] opacity-40 tracking-[0.4em] uppercase">Copyright @ 2026. All Rights Reserved.</p>
                  </div>
               </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default App;
