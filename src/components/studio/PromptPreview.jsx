import { useState } from 'react';
import { ArrowLeft, Wand2, Palette, Layers, Zap, Edit3, Check, Loader2 } from 'lucide-react';

export default function PromptPreview({ prompt, onStart, onBack, loading }) {
  const [editing, setEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState('');

  if (!prompt) return null;

  const fullPrompt = editing ? editedPrompt : (prompt.full_prompt || JSON.stringify(prompt, null, 2));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-violet-600 flex items-center justify-center">
          <Wand2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Prompt Profissional Gerado</h2>
          <p className="text-sm text-slate-400">Revise e edite antes de iniciar a geraÃ§Ã£o</p>
        </div>
      </div>

      {/* Project info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h3 className="text-xs text-slate-500 uppercase mb-1">Nome do Projeto</h3>
          <p className="text-white font-medium">{prompt.project_name || 'projeto-sem-nome'}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h3 className="text-xs text-slate-500 uppercase mb-1">DescriÃ§Ã£o</h3>
          <p className="text-sm text-slate-300">{prompt.description}</p>
        </div>
      </div>

      {/* Features */}
      {prompt.features?.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-medium text-slate-300">Funcionalidades</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {prompt.features.map((f, i) => (
              <span key={i} className="text-xs px-3 py-1 rounded-full bg-violet-950 border border-violet-800 text-violet-300">{f}</span>
            ))}
          </div>
        </div>
      )}

      {/* Design */}
      {prompt.design && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-medium text-slate-300">Design Visual</h3>
          </div>
          <div className="space-y-3">
            {prompt.design.colors?.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-20">Cores:</span>
                <div className="flex gap-1.5">
                  {prompt.design.colors.map((c, i) => (
                    <div key={i} className="w-6 h-6 rounded border border-slate-700" style={{ backgroundColor: c }} title={c} />
                  ))}
                </div>
              </div>
            )}
            {prompt.design.typography && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-20">Fonte:</span>
                <span className="text-sm text-slate-300">{prompt.design.typography}</span>
              </div>
            )}
            {prompt.design.style && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-20">Estilo:</span>
                <span className="text-sm text-slate-300">{prompt.design.style}</span>
              </div>
            )}
            {prompt.design.animations && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-20">AnimaÃ§Ãµes:</span>
                <span className="text-sm text-slate-300">{prompt.design.animations}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Technical requirements */}
      {prompt.technical_requirements?.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-medium text-slate-300">Requisitos TÃ©cnicos</h3>
          </div>
          <ul className="space-y-1">
            {prompt.technical_requirements.map((r, i) => (
              <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                <span className="text-violet-500 mt-0.5">â¢</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Editable prompt */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-300">Prompt Completo</h3>
          <button
            onClick={() => {
              if (editing) {
                onStart({ ...prompt, full_prompt: editedPrompt });
              } else {
                setEditedPrompt(fullPrompt);
                setEditing(true);
              }
            }}
            className="text-xs flex items-center gap-1 text-violet-400 hover:text-violet-300"
          >
            {editing ? <><Check className="w-3 h-3" /> Salvar</> : <><Edit3 className="w-3 h-3" /> Editar</>}
          </button>
        </div>
        {editing ? (
          <textarea
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            rows={12}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 font-mono focus:border-violet-600 focus:outline-none resize-none"
          />
        ) : (
          <pre className="text-sm text-slate-400 font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">{fullPrompt}</pre>
        )}
      </div>

      {/* Start button */}
      <button
        onClick={() => onStart(editing ? { ...prompt, full_prompt: editedPrompt } : prompt)}
        disabled={loading}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Iniciando pipeline...</>
        ) : (
          <><Wand2 className="w-5 h-5" /> Iniciar GeraÃ§Ã£o do Projeto</>
        )}
      </button>
    </div>
  );
}