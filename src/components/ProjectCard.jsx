import { Link } from 'react-router-dom';
import { Smartphone, Globe, Gamepad2, Github, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const TYPE_ICONS = { app: Smartphone, site: Globe, game: Gamepad2 };
const TYPE_LABELS = { app: 'App', site: 'Site', game: 'Jogo' };
const STATUS_CONFIG = {
  draft: { label: 'Rascunho', icon: Clock, color: 'text-slate-400 bg-slate-800' },
  analyzing: { label: 'Analisando', icon: Loader2, color: 'text-blue-400 bg-blue-950', spin: true },
  architecting: { label: 'Arquitetando', icon: Loader2, color: 'text-blue-400 bg-blue-950', spin: true },
  generating: { label: 'Gerando', icon: Loader2, color: 'text-violet-400 bg-violet-950', spin: true },
  correcting: { label: 'Corrigindo', icon: Loader2, color: 'text-amber-400 bg-amber-950', spin: true },
  testing: { label: 'Testando', icon: Loader2, color: 'text-cyan-400 bg-cyan-950', spin: true },
  fixing: { label: 'Finalizando', icon: Loader2, color: 'text-purple-400 bg-purple-950', spin: true },
  completed: { label: 'ConcluÃ­do', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-950' },
  failed: { label: 'Falhou', icon: AlertCircle, color: 'text-red-400 bg-red-950' }
};

export default function ProjectCard({ project }) {
  const TypeIcon = TYPE_ICONS[project.type] || Smartphone;
  const status = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft;
  const StatusIcon = status.icon;

  return (
    <Link
      to={`/studio/${project.id}`}
      className="block bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-violet-600 hover:bg-slate-800/50 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center group-hover:bg-violet-600 transition-colors">
          <TypeIcon className="w-5 h-5 text-slate-400 group-hover:text-white" />
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${status.color}`}>
          <StatusIcon className={`w-3 h-3 ${status.spin ? 'animate-spin' : ''}`} />
          {status.label}
        </span>
      </div>
      <h3 className="font-semibold text-slate-100 mb-1 truncate">{project.name}</h3>
      <p className="text-sm text-slate-400 line-clamp-2 mb-3">{project.description || 'Sem descriÃ§Ã£o'}</p>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="px-2 py-0.5 rounded bg-slate-800">{TYPE_LABELS[project.type] || project.type}</span>
        {project.github_repo ? (
          <span className="flex items-center gap-1 text-violet-400">
            <Github className="w-3 h-3" /> GitHub
          </span>
        ) : (
          <span>{project.files?.length || 0} arquivos</span>
        )}
      </div>
    </Link>
  );
}