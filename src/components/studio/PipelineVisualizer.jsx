import { Loader2, CheckCircle2, Circle, AlertCircle, Search, Layers, FileCode2, Bug, TestTube2, Wrench, Rocket } from 'lucide-react';

const STAGES = [
  { key: 'analyze', label: 'AnÃ¡lise do Projeto', desc: 'IA analisa requisitos e tecnologias', icon: Search },
  { key: 'architecture', label: 'Planejador de Arquitetura', desc: 'Frontend + Backend + Database', icon: Layers },
  { key: 'generate', label: 'Gerador de Projeto', desc: 'Cria todos os arquivos', icon: FileCode2 },
  { key: 'correct', label: 'Corretor de CÃ³digo', desc: 'Procura bugs e erros', icon: Bug },
  { key: 'test', label: 'Testes AutomÃ¡ticos', desc: 'Gera e valida testes', icon: TestTube2 },
  { key: 'fix', label: 'CorreÃ§Ã£o AutomÃ¡tica', desc: 'Aplica correÃ§Ãµes finais', icon: Wrench },
  { key: 'complete', label: 'Aplicativo Completo', desc: 'Projeto pronto', icon: Rocket }
];

export default function PipelineVisualizer({ currentStage, stageResults, error }) {
  const getStatus = (idx) => {
    if (error && idx === currentStage) return 'error';
    if (idx < currentStage) return 'completed';
    if (idx === currentStage) return 'active';
    return 'pending';
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Pipeline de GeraÃ§Ã£o</h2>
        <p className="text-sm text-slate-400">Acompanhe cada etapa em tempo real</p>
      </div>

      <div className="space-y-3">
        {STAGES.map((stage, idx) => {
          const status = getStatus(idx);
          const result = stageResults[stage.key === 'complete' ? 'finalFiles' : stage.key];

          return (
            <div
              key={stage.key}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                status === 'active' ? 'border-violet-600 bg-violet-950/30' :
                status === 'completed' ? 'border-emerald-800/50 bg-emerald-950/10' :
                status === 'error' ? 'border-red-600 bg-red-950/30' :
                'border-slate-800 bg-slate-900/50'
              }`}
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                status === 'active' ? 'bg-violet-600' :
                status === 'completed' ? 'bg-emerald-600' :
                status === 'error' ? 'bg-red-600' :
                'bg-slate-800'
              }`}>
                {status === 'active' ? <Loader2 className="w-5 h-5 text-white animate-spin" /> :
                 status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-white" /> :
                 status === 'error' ? <AlertCircle className="w-5 h-5 text-white" /> :
                 <stage.icon className="w-5 h-5 text-slate-500" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-medium ${status === 'pending' ? 'text-slate-500' : 'text-white'}`}>
                    {stage.label}
                  </h3>
                  {status === 'completed' && (
                    <span className="text-xs text-emerald-400">â ConcluÃ­do</span>
                  )}
                  {status === 'active' && (
                    <span className="text-xs text-violet-400">Em andamento...</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{stage.desc}</p>

                {/* Stage result summary */}
                {status === 'completed' && result && (
                  <div className="mt-2 text-xs text-slate-400">
                    {stage.key === 'analyze' && result.tech_stack && (
                      <span>Stack: {result.tech_stack.slice(0, 4).join(', ')}</span>
                    )}
                    {stage.key === 'architecture' && result.file_tree && (
                      <span>{result.file_tree.filter(f => f.type === 'file').length} arquivos planejados</span>
                    )}
                    {stage.key === 'generate' && result.files && (
                      <span>{result.files.length} arquivos gerados</span>
                    )}
                    {stage.key === 'correct' && result.issues && (
                      <span>{result.issues.length} correÃ§Ãµes identificadas</span>
                    )}
                    {stage.key === 'test' && result.test_files && (
                      <span>{result.test_files.length} arquivos de teste</span>
                    )}
                    {stage.key === 'fix' && result.final_files && (
                      <span>{result.final_files.length} arquivos finais â¢ {result.summary?.substring(0, 60)}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-sm">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Erro na geraÃ§Ã£o</span>
          </div>
          <p className="text-red-400/80 ml-6">{error}</p>
        </div>
      )}
    </div>
  );
}