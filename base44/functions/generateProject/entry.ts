import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const SYSTEM_INSTRUCTION = `VocÃª Ã© um engenheiro de software sÃªnior e arquiteto de sistemas especializado em criar projetos completos e de alta qualidade.
Domina frontend, backend, banco de dados, design visual, animaÃ§Ãµes, UX/UI, jogos e arquitetura de software.
Sempre responda em portuguÃªs brasileiro.
Quando gerar cÃ³digo, produza cÃ³digo de produÃ§Ã£o limpo, comentado e funcional.
NUNCA deixe nada incompleto â sempre entregue cÃ³digo completo, pronto para uso.
Inclua sempre: animaÃ§Ãµes suaves, cores harmoniosas, tipografia profissional, design responsivo, tratamento de erros, e boas prÃ¡ticas.`;

async function callGemini(apiKey, userPrompt, schema) {
  const generationConfig = {
    responseMimeType: 'application/json',
    temperature: 0.7,
    maxOutputTokens: 65536
  };
  if (schema) generationConfig.responseSchema = schema;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMsg = errorText;
    try {
      const parsed = JSON.parse(errorText);
      errorMsg = parsed.error?.message || errorText;
    } catch (_) { /* keep raw */ }
    throw new Error(`Erro Gemini (${response.status}): ${errorMsg}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  if (!candidate) throw new Error('Gemini nÃ£o retornou candidatos');

  if (candidate.finishReason === 'MAX_TOKENS') {
    console.warn('Resposta do Gemini possivelmente truncada');
  }

  const text = candidate.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini retornou resposta vazia');

  try {
    return JSON.parse(text);
  } catch (_) {
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
    return JSON.parse(cleaned);
  }
}

// âââ Stage: prompt ââââââââââââââââââââââââââââââââââââââââââââââ
function stagePrompt(apiKey, { briefing, projectType }) {
  const p = `Transforme o briefing abaixo em um PROMPT PROFISSIONAL, detalhado e estruturado que serÃ¡ usado para gerar um projeto de software completo.

Tipo de projeto: ${projectType}
Briefing do usuÃ¡rio: "${briefing}"

Crie um prompt profissional que inclua:
- project_name: nome do projeto em inglÃªs (kebab-case)
- description: descriÃ§Ã£o detalhada e rica do projeto
- features: lista de funcionalidades principais (pelo menos 5-10)
- design: diretrizes de design visual (cores em hex, tipografia, estilo, animaÃ§Ãµes)
- user_experience: fluxo de experiÃªncia do usuÃ¡rio
- technical_requirements: requisitos tÃ©cnicos especÃ­ficos

Seja especÃ­fico e detalhado em cada campo.`;

  const schema = {
    type: 'object',
    properties: {
      project_name: { type: 'string' },
      description: { type: 'string' },
      features: { type: 'array', items: { type: 'string' } },
      design: { type: 'object', properties: {
        colors: { type: 'array', items: { type: 'string' } },
        typography: { type: 'string' },
        style: { type: 'string' },
        animations: { type: 'string' }
      }, required: ['colors', 'typography', 'style'] },
      user_experience: { type: 'string' },
      technical_requirements: { type: 'array', items: { type: 'string' } },
      full_prompt: { type: 'string' }
    },
    required: ['project_name', 'description', 'features', 'design', 'full_prompt']
  };
  return callGemini(apiKey, p, schema);
}

// âââ Stage: analyze ââââââââââââââââââââââââââââââââââââââââââââ
function stageAnalyze(apiKey, { professionalPrompt, projectType }) {
  const p = `Analise o seguinte prompt de projeto e forneÃ§a uma anÃ¡lise tÃ©cnica detalhada.

Tipo de projeto: ${projectType}
Prompt profissional: ${JSON.stringify(professionalPrompt)}

ForneÃ§a:
- project_name: nome do projeto (kebab-case)
- description: descriÃ§Ã£o tÃ©cnica detalhada
- tech_stack: lista de tecnologias recomendadas
- features: lista de funcionalidades
- pages: lista de pÃ¡ginas/telas necessÃ¡rias
- database_tables: lista de tabelas do banco (se aplicÃ¡vel, senÃ£o lista vazia)
- api_endpoints: lista de endpoints de API (se aplicÃ¡vel, senÃ£o lista vazia)
- design_notes: notas sobre design visual, cores e animaÃ§Ãµes`;

  const schema = {
    type: 'object',
    properties: {
      project_name: { type: 'string' },
      description: { type: 'string' },
      tech_stack: { type: 'array', items: { type: 'string' } },
      features: { type: 'array', items: { type: 'string' } },
      pages: { type: 'array', items: { type: 'string' } },
      database_tables: { type: 'array', items: { type: 'string' } },
      api_endpoints: { type: 'array', items: { type: 'string' } },
      design_notes: { type: 'string' }
    },
    required: ['project_name', 'description', 'tech_stack', 'features']
  };
  return callGemini(apiKey, p, schema);
}

// âââ Stage: architecture ââââââââââââââââââââââââââââââââââââââââ
function stageArchitecture(apiKey, { analysis, projectType }) {
  const p = `Baseado na anÃ¡lise a seguir, crie a ESTRUTURA COMPLETA de arquivos do projeto.

Tipo: ${projectType}
AnÃ¡lise: ${JSON.stringify(analysis)}

Crie uma Ã¡rvore de arquivos completa. Estrutura base (adapte ao tipo de projeto):

meu-aplicativo/
âââ frontend/
â   âââ components/
â   âââ pages/
â   âââ services/
â   âââ hooks/
â   âââ assets/
â   â   âââ images/
â   â   âââ styles/
â   âââ App.jsx
â   âââ main.jsx
âââ backend/
â   âââ controllers/
â   âââ routes/
â   âââ services/
â   âââ models/
â   âââ server.js
âââ database/
â   âââ schema/
â   âââ migrations/
âââ tests/
âââ package.json
âââ .env.example
âââ .gitignore
âââ README.md

Para jogos, inclua: engine/, scenes/, assets/audio/, assets/sprites/, physics/, input/.
NUNCA deixe pastas vazias â liste todos os arquivos necessÃ¡rios.`;

  const schema = {
    type: 'object',
    properties: {
      architecture_description: { type: 'string' },
      file_tree: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            type: { type: 'string', enum: ['file', 'directory'] },
            description: { type: 'string' }
          },
          required: ['path', 'type']
        }
      }
    },
    required: ['architecture_description', 'file_tree']
  };
  return callGemini(apiKey, p, schema);
}

// âââ Stage: generate ââââââââââââââââââââââââââââââââââââââââââââ
function stageGenerate(apiKey, { analysis, architecture, projectType }) {
  const fileList = architecture.file_tree
    ?.filter(f => f.type === 'file')
    ?.map(f => f.path) || [];

  const p = `Gere o conteÃºdo COMPLETO de todos os arquivos do projeto. 

Projeto: ${analysis.project_name}
Tipo: ${projectType}
AnÃ¡lise: ${JSON.stringify(analysis)}
Arquivos a gerar: ${JSON.stringify(fileList)}

Para cada arquivo, forneÃ§a:
- path: caminho completo do arquivo (ex: frontend/components/Header.jsx)
- content: conteÃºdo COMPLETO do arquivo (cÃ³digo real, pronto para uso)
- language: linguagem de programaÃ§Ã£o

REGRAS CRÃTICAS:
- Gere o conteÃºdo REAL e COMPLETO de cada arquivo â NUNCA use "// TODO" ou "// implementar"
- CÃ³digo de produÃ§Ã£o, limpo, comentado e funcional
- Inclua animaÃ§Ãµes suaves, cores harmoniosas, tipografia profissional
- Design responsivo (mobile + desktop)
- Tratamento de erros e estados de carregamento
- README.md com instruÃ§Ãµes de instalaÃ§Ã£o e uso
- package.json com todas as dependÃªncias necessÃ¡rias
- .env.example com variÃ¡veis de ambiente
- .gitignore apropriado
- Para jogos: game loop, renderizaÃ§Ã£o Canvas, sistema de Ã¡udio, fÃ­sica, input, cenas

NÃO ENTREGUE NADA INCOMPLETO. Cada arquivo deve estar pronto para uso.`;

  const schema = {
    type: 'object',
    properties: {
      files: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            content: { type: 'string' },
            language: { type: 'string' }
          },
          required: ['path', 'content']
        }
      },
      summary: { type: 'string' }
    },
    required: ['files']
  };
  return callGemini(apiKey, p, schema);
}

// âââ Stage: correct âââââââââââââââââââââââââââââââââââââââââââââ
function stageCorrect(apiKey, { analysis, architecture, files, projectType }) {
  const p = `Revise os arquivos gerados abaixo e encontre bugs, erros e problemas.

Projeto: ${analysis.project_name}
Tipo: ${projectType}
Arquivos: ${JSON.stringify(files)}

Analise cada arquivo e identifique:
- Bugs e erros de lÃ³gica
- Imports faltantes
- Erros de sintaxe
- Problemas de seguranÃ§a
- CÃ³digo que nÃ£o funciona
- Arquivos incompletos

ForneÃ§a:
- issues: lista de problemas encontrados (file, severity, description, fix)
- corrected_files: arquivos corrigidos com conteÃºdo completo (apenas os que precisam de correÃ§Ã£o)`;

  const schema = {
    type: 'object',
    properties: {
      issues: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            file: { type: 'string' },
            severity: { type: 'string', enum: ['low', 'medium', 'high'] },
            description: { type: 'string' },
            fix: { type: 'string' }
          },
          required: ['file', 'description', 'fix']
        }
      },
      corrected_files: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            content: { type: 'string' }
          },
          required: ['path', 'content']
        }
      }
    },
    required: ['issues']
  };
  return callGemini(apiKey, p, schema);
}

// âââ Stage: test ââââââââââââââââââââââââââââââââââââââââââââââââ
function stageTest(apiKey, { analysis, files, projectType }) {
  const p = `Gere testes automatizados para o projeto.

Projeto: ${analysis.project_name}
Tipo: ${projectType}
Arquivos do projeto: ${JSON.stringify(files?.map(f => f.path) || [])}

Crie arquivos de teste abrangentes. ForneÃ§a:
- test_files: arquivos de teste com conteÃºdo completo
- test_description: descriÃ§Ã£o do que estÃ¡ sendo testado
- coverage: Ã¡reas cobertas pelos testes`;

  const schema = {
    type: 'object',
    properties: {
      test_files: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            content: { type: 'string' }
          },
          required: ['path', 'content']
        }
      },
      test_description: { type: 'string' },
      coverage: { type: 'array', items: { type: 'string' } }
    },
    required: ['test_files', 'test_description']
  };
  return callGemini(apiKey, p, schema);
}

// âââ Stage: fix ââââââââââââââââââââââââââââââââââââââââââââââââââ
function stageFix(apiKey, { analysis, files, corrections, tests, projectType }) {
  const p = `Aplique todas as correÃ§Ãµes e finalize o projeto COMPLETO.

Projeto: ${analysis.project_name}
Tipo: ${projectType}

Arquivos originais: ${JSON.stringify(files?.map(f => ({ path: f.path, content: f.content?.substring(0, 500) })) || [])}
CorreÃ§Ãµes identificadas: ${JSON.stringify(corrections?.issues || [])}
Arquivos corrigidos: ${JSON.stringify(corrections?.corrected_files || [])}
Arquivos de teste: ${JSON.stringify(tests?.test_files || [])}

Produza o conjunto FINAL e COMPLETO de todos os arquivos do projeto:
- Aplique todas as correÃ§Ãµes dos arquivos corrigidos
- Inclua os arquivos de teste
- Garanta que NENHUM arquivo estÃ¡ incompleto
- Garanta que todos os imports estÃ£o corretos
- Verifique consistÃªncia entre frontend e backend`;

  const schema = {
    type: 'object',
    properties: {
      final_files: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            content: { type: 'string' },
            language: { type: 'string' }
          },
          required: ['path', 'content']
        }
      },
      summary: { type: 'string' },
      quality_score: { type: 'number' }
    },
    required: ['final_files', 'summary']
  };
  return callGemini(apiKey, p, schema);
}

// âââ Main handler âââââââââââââââââââââââââââââââââââââââââââââââ
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'NÃ£o autorizado' }, { status: 401 });

    const body = await req.json();
    const { stage, briefing, prompt, projectType, context } = body;

    // Get user's Gemini API key
    const settings = await base44.entities.UserSetting.filter({});
    const apiKey = settings?.[0]?.gemini_api_key;
    if (!apiKey) {
      return Response.json({ error: 'Configure sua chave de API do Gemini nas ConfiguraÃ§Ãµes antes de gerar projetos.' }, { status: 400 });
    }

    let result;
    const ctx = context || {};

    switch (stage) {
      case 'prompt':
        result = await stagePrompt(apiKey, { briefing, projectType });
        break;
      case 'analyze':
        result = await stageAnalyze(apiKey, { professionalPrompt: prompt, projectType });
        break;
      case 'architecture':
        result = await stageArchitecture(apiKey, { analysis: ctx.analysis, projectType });
        break;
      case 'generate':
        result = await stageGenerate(apiKey, { analysis: ctx.analysis, architecture: ctx.architecture, projectType });
        break;
      case 'correct':
        result = await stageCorrect(apiKey, { analysis: ctx.analysis, architecture: ctx.architecture, files: ctx.files, projectType });
        break;
      case 'test':
        result = await stageTest(apiKey, { analysis: ctx.analysis, files: ctx.files, projectType });
        break;
      case 'fix':
        result = await stageFix(apiKey, { analysis: ctx.analysis, files: ctx.files, corrections: ctx.corrections, tests: ctx.tests, projectType });
        break;
      default:
        return Response.json({ error: `EstÃ¡gio desconhecido: ${stage}` }, { status: 400 });
    }

    return Response.json({ stage, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});