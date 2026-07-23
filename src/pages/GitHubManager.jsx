import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Github, Loader2, Upload, Rocket, CheckCircle2, AlertCircle, ExternalLink, FileArchive, Key } from 'lucide-react';

export default function GitHubManager() {
  const { toast } = useToast();
  const [settings, setSettings] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pushing, setPushing] = useState(null);
  const [zipFile, setZipFile] = useState(null);
  const [zipRepoName, setZipRepoName] = useState('');
  const [uploadingZip, setUploadingZip] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [settingsList, projectList] = await Promise.all([
          base44.entities.UserSetting.filter({}),
          base44.entities.Project.filter({ status: 'completed' }, '-created_date', 20)
        ]);
        setSettings(settingsList?.[0] || null);
        setProjects(projectList || []);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, []);

  const hasGithub = settings?.github_token;

  const handlePushProject = async (project) => {
    setPushing(project.id);
    try {
      const response = await base44.functions.invoke('pushToGitHub', {
        repoName: project.name || 'projeto-gerado',
        description: project.description,
        files: (project.files || []).map(f => ({ path: f.path, content: f.content })),
        isPrivate: false
      });

      await base44.entities.Project.update(project.id, { github_repo: response.data.repoUrl });
      setProjects(prev => prev.map(p => p.id === project.id ? { ...p, github_repo: response.data.repoUrl } : p));

      toast({ title: 'Enviado para GitHub!', description: response.data.repoUrl });
    } catch (e) {
      toast({ title: 'Erro ao enviar', description: e.response?.data?.error || e.message, variant: 'destructive' });
    }
    setPushing(null);
  };

  const handleZipUpload = async () => {
    if (!zipFile || !zipRepoName.trim()) {
      toast({ title: 'Preencha o nome do repositÃ³rio e selecione um ZIP', variant: 'destructive' });
      return;
    }
    setUploadingZip(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: zipFile });
      const response = await base44.functions.invoke('pushToGitHub', {
        zipUrl: file_url,
        repoName: zipRepoName,
        isPrivate: false
      });
      toast({ title: 'ZIP enviado para GitHub!', description: response.data.repoUrl });
      setZipFile(null);
      setZipRepoName('');
    } catch (e) {
      toast({ title: 'Erro ao enviar ZIP', description: e.response?.data?.error || e.message, variant: 'destructive' });
    }
    setUploadingZip(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
          <Github className="w-5 h-5 text-slate-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">GitHub</h1>
          <p className="text-sm text-slate-400">Envie projetos para seus repositÃ³rios</p>
        </div>
      </div>

      {/* Connection status */}
      <div className={`p-4 rounded-xl border mb-6 ${hasGithub ? 'border-emerald-800/50 bg-emerald-950/10' : 'border-amber-800/50 bg-amber-950/10'}`}>
        <div className="flex items-center gap-3">
          {hasGithub ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-amber-400" />}
          <div className="flex-1">
            <p className={`text-sm font-medium ${hasGithub ? 'text-emerald-300' : 'text-amber-300'}`}>
              {hasGithub ? `GitHub conectado (${settings.github_username || 'token ativo'})` : 'GitHub nÃ£o configurado'}
            </p>
            <p className="text-xs text-slate-500">
              {hasGithub ? 'VocÃª pode enviar projetos para o GitHub' : 'Configure seu token do GitHub nas ConfiguraÃ§Ãµes'}
            </p>
          </div>
          {!hasGithub && (
            <Link to="/settings" className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-500">
              <Key className="w-3 h-3" /> Configurar
            </Link>
          )}
        </div>
      </div>

      {/* Push existing projects */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-slate-300 mb-3">Projetos Gerados</h2>
        {projects.length === 0 ? (
          <p className="text-sm text-slate-500 p-4 bg-slate-900 border border-slate-800 rounded-xl text-center">
            Nenhum projeto concluÃ­do ainda. Gere um projeto no EstÃºdio primeiro.
          </p>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{project.name}</p>
                  <p className="text-xs text-slate-500">{project.files?.length || 0} arquivos</p>
                </div>
                {project.github_repo ? (
                  <a href={project.github_repo} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300">
                    <ExternalLink className="w-3 h-3" /> Ver repositÃ³rio
                  </a>
                ) : (
                  <button
                    onClick={() => handlePushProject(project)}
                    disabled={!hasGithub || pushing === project.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs hover:bg-violet-500 disabled:opacity-40"
                  >
                    {pushing === project.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    Enviar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload ZIP from PC */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-slate-300 mb-3">Enviar ZIP do Computador</h2>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Nome do repositÃ³rio</label>
            <input
              type="text"
              value={zipRepoName}
              onChange={(e) => setZipRepoName(e.target.value)}
              placeholder="meu-projeto"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 focus:border-violet-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Arquivo ZIP</label>
            <label className="flex items-center gap-2 p-3 border border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-violet-600 transition-colors">
              <FileArchive className="w-5 h-5 text-slate-500" />
              <span className="text-sm text-slate-400 flex-1">
                {zipFile ? zipFile.name : 'Clique para selecionar um arquivo .zip'}
              </span>
              <input
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => setZipFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
          <button
            onClick={handleZipUpload}
            disabled={!hasGithub || !zipFile || !zipRepoName.trim() || uploadingZip}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-40"
          >
            {uploadingZip ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Enviar ZIP para GitHub
          </button>
        </div>
      </div>

      {/* Base44 sync note */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
        <div className="flex items-start gap-3">
          <Rocket className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-300 mb-1">Enviar este aplicativo (Gemini Studio) ao GitHub</p>
            <p className="text-xs text-slate-500">
              Para sincronizar o cÃ³digo-fonte deste estÃºdio com o GitHub, use a integraÃ§Ã£o de sincronizaÃ§Ã£o GitHub no painel do Base44 (Settings â GitHub Sync). Essa sincronizaÃ§Ã£o bidirecional Ã© gerenciada pela plataforma, nÃ£o pelo app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}