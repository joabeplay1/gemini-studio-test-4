import { useState } from 'react';
import { Copy, Check, FileCode2 } from 'lucide-react';

function detectLanguage(path) {
  const ext = path.split('.').pop()?.toLowerCase();
  const map = {
    js: 'JavaScript', jsx: 'React', ts: 'TypeScript', tsx: 'React TS',
    css: 'CSS', html: 'HTML', json: 'JSON', md: 'Markdown',
    py: 'Python', java: 'Java', go: 'Go', sql: 'SQL',
    yml: 'YAML', yaml: 'YAML', env: 'Env', sh: 'Shell'
  };
  return map[ext] || 'Text';
}

export default function CodeViewer({ file }) {
  const [copied, setCopied] = useState(false);

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full text-slate-600">
        <div className="text-center">
          <FileCode2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Selecione um arquivo para visualizar</p>
        </div>
      </div>
    );
  }

  const language = file.language || detectLanguage(file.path);
  const lines = (file.content || '').split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <span className="text-sm text-slate-300 truncate">{file.path}</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 flex-shrink-0">{language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors flex-shrink-0"
        >
          {copied ? <><Check className="w-3 h-3 text-emerald-400" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
        </button>
      </div>

      {/* Code */}
      <div className="flex-1 overflow-auto bg-slate-950">
        <pre className="text-sm font-mono leading-relaxed">
          <code>
            {lines.map((line, i) => (
              <div key={i} className="flex hover:bg-slate-900/50">
                <span className="select-none text-slate-700 text-right pr-4 pl-3 w-12 flex-shrink-0">{i + 1}</span>
                <span className="text-slate-300 pr-4 whitespace-pre-wrap break-all">{line || ' '}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}