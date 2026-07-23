import { useState } from 'react';
import { Smartphone, Globe, Gamepad2, Sparkles, Loader2 } from 'lucide-react';

const TYPE_OPTIONS = [
  { value: 'app', label: 'Aplicativo', icon: Smartphone, desc: 'Web app com frontend e backend' },
  { value: 'site', label: 'Site', icon: Globe, desc: 'Site web responsivo e moderno' },
  { value: 'game', label: 'Jogo', icon: Gamepad2, desc: 'Jogo para navegador com Canvas' }
];

const EXAMPLES = [
  'Um app de tarefas com autenticaÃ§Ã£o, categorias e notificaÃ§Ãµes',
  'Um site de portfÃ³lio para fotÃ³grafo com galeria e contato',
  'Um jogo de plataforma 2D com fÃ­sica, coletÃ¡veis e fases',
  'Um app de chat em tempo real com salas e mensagens privadas',
  'Um site de e-commerce com carrinho, pagamento e painel admin'
];

export default function BriefingForm({ onSubmit, loading }) {
  const [briefing, setBriefing] = useState('');
  const [projectType, setProjectType] = useState('app');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!briefing.trim()) return;
    onSubmit(briefing, projectType);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-950 border border-violet-800 mb-4">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="text-sm text-violet-300">Gemini 2.5 Flash</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">O que vamos criar hoje?</h1>
        <p className="text-slate-400">Descreva sua ideia e a IA gera um prompt profissional, depois cria o projeto completo.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">Tipo de projeto</label>
          <div className="grid grid-cols-3 gap-3">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setProjectType(opt.value)}
                className={`p-4 rounded-xl border text-left transition-all ${projectType === opt.value ? 'border-violet-600 bg-violet-950/50' : 'border-slate-800 bg-slate-900 hover:border-slate-700'}`}
              >
                <opt.icon className={`w-6 h-6 mb-2 ${projectType === opt.value ? 'text-violet-400' : 'text-slate-500'}`} />
                <p className={`text-sm font-medium ${projectType === opt.value ? 'text-violet-300' : 'text-slate-300'}`}>{opt.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Descreva seu projeto</label>
          <textarea
            value={briefing}
            onChange={(e) => setBriefing(e.target.value)}
            rows={5}
            placeholder="Ex: Um app de lista de tarefas com login, categorias coloridas, prioridades, datas de vencimento e notificaÃ§Ãµes..."
            className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:border-violet-600 focus:outline-none focus:ring-1 focus:ring-violet-600 resize-none"
          />
        </div>

        <div>
          <p className="text-xs text-slate-500 mb-2">Ou tente um exemplo:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setBriefing(ex)}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:border-violet-700 hover:text-violet-300 transition-colors"
              >
                {ex.length > 40 ? ex.substring(0, 40) + '...' : ex}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="w-full py-3.5 rounded-xl bg-violet-600/20 border border-violet-700 text-violet-300 font-medium flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Gerando prompt profissional...
          </div>
        ) : (
          <button
            type="submit"
            disabled={!briefing.trim()}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Gerar Prompt Profissional
          </button>
        )}
      </form>
    </div>
  );
}