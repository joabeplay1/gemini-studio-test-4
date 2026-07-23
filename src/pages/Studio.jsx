import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import BriefingForm from '@/components/studio/BriefingForm';
import PromptPreview from '@/components/studio/PromptPreview';
import PipelineVisualizer from '@/components/studio/PipelineVisualizer';
import FileTree from '@/components/studio/FileTree';
import CodeViewer from '@/components/studio/CodeViewer';
import { Download, Github, Loader2, ArrowLeft, FolderTree, Rocket } from 'lucide-react';

const PIPELINE_STAGES = [
  { key: 'analyze', resultKey: 'analysis', status: 'analyzing' },
  { key: 'architecture', resultKey: 'architecture', status: 'architecting' },
  { key: 'generate', resultKey: 'files', status: 'generating' },
  { key: 'correct', resultKey: 'corrections', status: 'correcting' },
  { key: 'test', resultKey: 'tests', status: 'testing' },
  { key: 'fix', resultKey: 'finalFiles', status: 'fixing' }
];

export default function Studio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState('briefing');
  const [projectType, setProjectType] = useState('app');
  const [professionalPrompt, setProfessionalPrompt] = useState(null);
  const [pipelineStage, setPipelineStage] = useState(-1);
  const [stageResults, setStageResults] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [projectId, setProjectId] = useState(null);

  useEffect(() => {
    if (id) {
      loadProject(id);
    } else {
      resetState();
    }
  }, [id]);

  const resetState = () => {
    setStep('briefing');
    setProfessionalPrompt(null);
    setPipelineStage(-1);
    setStageResults({});
    setFiles([]);
    setSelectedFile(null);
    setProjectId(null);
    setError(null);
  };

  const loadProject = async (projId) => {
    try {
      const proj = await base44.entities.Project.get(projId);
      setProjectId(proj.id);
      setProjectType(proj.type || 'app');
      if (proj.professional_prompt) {
        try { setProfessionalPrompt(JSON.parse(proj.professional_prompt)); } catch (_) {}
      }
      if (proj.files?.length > 0) {
        setFiles(proj.files);
        setSelectedFile(proj.files[0]);
        setStep('result');
      } else if (proj.professional_prompt) {
        setStep('prompt');
      } else {
        setStep('briefing');
      }
    } catch (e) {
      toast({ title: 'Erro ao carregar projeto', variant: 'destructive' });
      navigate('/');
    }
  };

  const handleGeneratePrompt = async (briefingText, type) => {
    setProjectType(type);
    setLoading(true);
    setError(null);
    try {
      const project = await base44.entities.Project.create({
        name: 'Novo Projeto',
        type,
        status: 'draft',
        prompt: briefingText
      });
      setProjectId(project.id);

      const response = await base44.functions.invoke('generateProject', {
        stage: 'prompt',
        briefing: briefingText,
        projectType: type
      });

      const result = response.data.result;
      setProfessionalPrompt(result);

      await base44.entities.Project.update(project.id, {
        name: result.project_name || 'Projeto',
        description: result.description || '',
        professional_prompt: JSON.stringify(result)
      });

      setStep('prompt');
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      setError(msg);
      toast({ title: 'Erro ao gerar prompt', description: msg, variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleStartGeneration = async (promptData) => {
    setProfessionalPrompt(promptData);
    setStep('pipeline');
    setPipelineStage(0);
    setError(null);

    const context = {};
    try {
      for (let i = 0; i < PIPELINE_STAGES.length; i++) {
        const stage = PIPELINE_STAGES[i];
        setPipelineStage(i);
        await base44.entities.Project.update(projectId, { status: stage.status });

        const response = await base44.functions.invoke('generateProject', {
          stage: stage.key,
          prompt: promptData,
          projectType,
          context
        });

        context[stage.resultKey] = response.data.result;
        setStageResults({ ...context });

        const updateData = { status: stage.status };
        if (stage.resultKey === 'analysis') {
          updateData.analysis = JSON.stringify(response.data.result);
          if (response.data.result.project_name) updateData.name = response.data.result.project_name;
          if (response.data.result.description) updateData.description = response.data.result.description;
          if (response.data.result.tech_stack) updateData.tech_stack = response.data.result.tech_stack;
        } else if (stage.resultKey === 'architecture') {
          updateData.architecture = JSON.stringify(response.data.result);
        } else if (stage.resultKey === 'files') {
          updateData.files = response.data.result.files || [];
        } else if (stage.resultKey === 'corrections') {
          updateData.corrections = JSON.stringify(response.data.result);
        } else if (stage.resultKey === 'tests') {
          updateData.tests = JSON.stringify(response.data.result);
        }
        await base44.entities.Project.update(projectId, updateData);
      }

      const finalFiles = context.finalFiles?.final_files || context.files?.files || [];
      setFiles(finalFiles);
      if (finalFiles.length > 0) setSelectedFile(finalFiles[0]);

      await base44.entities.Project.update(projectId, { status: 'completed', files: finalFiles });

      setPipelineStage(6);
      setTimeout(() => setStep('result'), 1200);
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      setError(msg);
      if (projectId) await base44.entities.Project.update(projectId, { status: 'failed' });
      toast({ title: 'Erro na geraÃ§Ã£o', description: msg, variant: 'destructive' });
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('createProjectZip', {
        files: files.map(f => ({ path: f.path, content: f.content })),
        projectName: professionalPrompt?.project_name || 'projeto'
      });

      const byteChars = atob(response.data.zipBase64);
      const byteNums = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
      const blob = new Blob([new Uint8Array(byteNums)], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.data.filename || 'projeto.zip';
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: 'Download iniciado!' });
    } catch (e) {
      toast({ title: 'Erro ao criar ZIP', description: e.response?.data?.error || e.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const handlePushGitHub = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('pushToGitHub', {
        repoName: professionalPrompt?.project_name || 'projeto-gerado',
        description: professionalPrompt?.description,
        files: files.map(f => ({ path: f.path, content: f.content })),
        isPrivate: false
      });

      if (projectId) {
        await base44.entities.Project.update(projectId, { github_repo: response.data.repoUrl });
      }
      toast({ title: 'Enviado para GitHub!', description: response.data.repoUrl });
    } catch (e) {
      toast({ title: 'Erro ao enviar', description: e.response?.data?.error || e.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleNewProject = () => {
    resetState();
    navigate('/studio');
  };

  // âââ Render ââââââââââââââââââââââââââââââââââââââââââ
  if (step === 'briefing') {
    return <BriefingForm onSubmit={handleGeneratePrompt} loading={loading} />;
  }

  if (step === 'prompt') {
    return (
      <PromptPreview
        prompt={professionalPrompt}
        onStart={handleStartGeneration}
        onBack={() => setStep('briefing')}
        loading={loading}
      />
    );
  }

  if (step === 'pipeline') {
    return (
      <PipelineVisualizer
        currentStage={pipelineStage}
        stageResults={stageResults}
        error={error}
      />
    );
  }

  // Result step
  return (
    <div className="h-screen flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={handleNewProject} className="text-slate-400 hover:text-white flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-white truncate">{professionalPrompt?.project_name || 'Projeto'}</h2>
          <span className="text-xs text-slate-500 flex-shrink-0">{files.length} arquivos</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleDownload} disabled={loading} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">Baixar ZIP</span>
          </button>
          <button onClick={handlePushGitHub} disabled={loading} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-500 text-sm disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
            <span className="hidden sm:inline">GitHub</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-60 lg:w-72 border-r border-slate-800 bg-slate-900 flex flex-col">
          <div className="px-3 py-2 border-b border-slate-800 flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-500 uppercase font-medium">Estrutura</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <FileTree files={files} selectedFile={selectedFile} onSelect={setSelectedFile} />
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <CodeViewer file={selectedFile} />
        </div>
      </div>
    </div>
  );
}