import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Save, Loader2, Key, Github, Sparkles, Eye, EyeOff, ExternalLink, CheckCircle2 } from 'lucide-react';

export default function Settings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState(null);
  const [geminiKey, setGeminiKey] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [showGemini, setShowGemini] = useState(false);
  const [showGithub, setShowGithub] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await base44.entities.UserSetting.filter({});
        if (list.length > 0) {
          setSettings(list[0]);
          setGeminiKey(list[0].gemini_api_key || '');
          setGithubToken(list[0].github_token || '');
          setGithubUsername(list[0].github_username || '');
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        gemini_api_key: geminiKey,
        github_token: githubToken,
        github_username: githubUsername
      };
      if (settings) {
        await base44.entities.UserSetting.update(settings.id, data);
      } else {
        const created = await base44.entities.UserSetting.create(data);
        setSettings(created);
      }
      toast({ title: 'ConfiguraÃ§Ãµes salvas com sucesso!' });
    } catch (e) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
          <Key className="w-5 h-5 text-slate-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">ConfiguraÃ§Ãµes</h1>
          <p className="text-sm text-slate-400">Configure suas chaves de API</p>
        </div>
      </div>

      {/* Gemini API Key */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-white">Chave de API do Gemini</h2>
            <p className="text-xs text-slate-500">Usada para gerar prompts e projetos</p>
          </div>
        </div>
        <div className="relative">
          <input
            type={showGemini ? 'text' : 'password'}
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="AIza..."
            className="w-full px-3 py-2.5 pr-10 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 focus:border-violet-600 focus:outline-none font-mono"
          />
          <button
            type="button"
            onClick={() => setShowGemini(!showGemini)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 mt-2"
        >
          <ExternalLink className="w-3 h-3" />
          Obter chave gratuita no Google AI Studio
        </a>
        {geminiKey && (
          <p className="text-xs text-emerald-400 flex items-center gap-1 mt-2">
            <CheckCircle2 className="w-3 h-3" /> Chave configurada
          </p>
        )}
      </div>

      {/* GitHub Token */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
            <Github className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-white">Token do GitHub</h2>
            <p className="text-xs text-slate-500">Para enviar projetos aos seus repositÃ³rios</p>
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-xs text-slate-400 mb-1.5">UsuÃ¡rio do GitHub</label>
          <input
            type="text"
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
            placeholder="seu-usuario"
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 focus:border-violet-600 focus:outline-none"
          />
        </div>

        <div className="relative">
          <label className="block text-xs text-slate-400 mb-1.5">Token de Acesso Pessoal (PAT)</label>
          <input
            type={showGithub ? 'text' : 'password'}
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            placeholder="ghp_..."
            className="w-full px-3 py-2.5 pr-10 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 focus:border-violet-600 focus:outline-none font-mono"
          />
          <button
            type="button"
            onClick={() => setShowGithub(!showGithub)}
            className="absolute right-3 top-[34px] text-slate-500 hover:text-slate-300"
          >
            {showGithub ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <a
          href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=Gemini%20Studio"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 mt-2"
        >
          <ExternalLink className="w-3 h-3" />
          Criar token no GitHub (marque a opÃ§Ã£o "repo")
        </a>
        {githubToken && (
          <p className="text-xs text-emerald-400 flex items-center gap-1 mt-2">
            <CheckCircle2 className="w-3 h-3" /> Token configurado
          </p>
        )}
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 transition-all"
      >
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        Salvar ConfiguraÃ§Ãµes
      </button>
    </div>
  );
}