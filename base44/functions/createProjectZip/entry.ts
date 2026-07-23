import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import JSZip from 'npm:jszip@3.10.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'NÃ£o autorizado' }, { status: 401 });

    const { files, projectName } = await req.json();

    if (!files || !files.length) {
      return Response.json({ error: 'Nenhum arquivo para compactar.' }, { status: 400 });
    }

    const zip = new JSZip();
    const rootName = (projectName || 'projeto').toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const root = zip.folder(rootName);

    for (const file of files) {
      root.file(file.path, file.content);
    }

    const hasReadme = files.some(f => f.path.toLowerCase().includes('readme'));
    if (!hasReadme) {
      root.file('README.md', `# ${rootName}\n\nProjeto gerado pelo Gemini Studio.\n\n## InstalaÃ§Ã£o\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`);
    }

    const zipBase64 = await zip.generateAsync({
      type: 'base64',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    return Response.json({ zipBase64, filename: `${rootName}.zip` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});