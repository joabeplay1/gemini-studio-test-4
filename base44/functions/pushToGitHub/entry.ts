import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import JSZip from 'npm:jszip@3.10.1';

const GITHUB_API = 'https://api.github.com';

async function githubRequest(token, method, path, body) {
  const response = await fetch(`${GITHUB_API}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMsg = errorText;
    try {
      const parsed = JSON.parse(errorText);
      errorMsg = parsed.message || errorText;
    } catch (_) { /* keep raw */ }
    throw new Error(`GitHub API (${response.status}): ${errorMsg}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function pushFilesToRepo(token, owner, repoName, files, commitMessage) {
  // 1. Get default branch ref
  let defaultBranch = 'main';
  let parentSha = null;

  try {
    const repoInfo = await githubRequest(token, 'GET', `/repos/${owner}/${repoName}`, null);
    defaultBranch = repoInfo.default_branch || 'main';
  } catch (_) { /* repo might be empty */ }

  try {
    const ref = await githubRequest(token, 'GET', `/repos/${owner}/${repoName}/git/refs/heads/${defaultBranch}`, null);
    parentSha = ref.object?.sha;
  } catch (_) { /* empty repo, no commits yet */ }

  // 2. Create blobs for all files
  const treeItems = [];
  for (const file of files) {
    const blob = await githubRequest(token, 'POST', `/repos/${owner}/${repoName}/git/blobs`, {
      content: file.content,
      encoding: 'utf-8'
    });
    treeItems.push({
      path: file.path,
      mode: '100644',
      type: 'blob',
      sha: blob.sha
    });
  }

  // 3. Create tree
  const treeBody = { tree: treeItems };
  if (parentSha) treeBody.base_tree = parentSha;
  const tree = await githubRequest(token, 'POST', `/repos/${owner}/${repoName}/git/trees`, treeBody);

  // 4. Create commit
  const commitBody = {
    message: commitMessage || 'Initial commit - Projeto gerado pelo Gemini Studio',
    tree: tree.sha
  };
  if (parentSha) commitBody.parents = [parentSha];
  const commit = await githubRequest(token, 'POST', `/repos/${owner}/${repoName}/git/commits`, commitBody);

  // 5. Update branch ref (or create it)
  if (parentSha) {
    await githubRequest(token, 'PATCH', `/repos/${owner}/${repoName}/git/refs/heads/${defaultBranch}`, {
      sha: commit.sha
    });
  } else {
    await githubRequest(token, 'POST', `/repos/${owner}/${repoName}/git/refs`, {
      ref: `refs/heads/${defaultBranch}`,
      sha: commit.sha
    });
  }

  return { branch: defaultBranch, commitSha: commit.sha, fileCount: files.length };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'NÃ£o autorizado' }, { status: 401 });

    const body = await req.json();
    const { repoName, description, isPrivate, files, zipUrl, commitMessage } = body;

    // Get user's GitHub token
    const settings = await base44.entities.UserSetting.filter({});
    const githubToken = settings?.[0]?.github_token;
    const githubUsername = settings?.[0]?.github_username;

    if (!githubToken) {
      return Response.json({ error: 'Configure seu token do GitHub nas ConfiguraÃ§Ãµes.' }, { status: 400 });
    }

    let finalFiles = files || [];

    // If zipUrl provided, download and extract
    if (zipUrl && !finalFiles.length) {
      const zipResponse = await fetch(zipUrl);
      if (!zipResponse.ok) throw new Error('Falha ao baixar arquivo ZIP');
      const zipBuffer = await zipResponse.arrayBuffer();
      const zip = await JSZip.loadAsync(zipBuffer);

      const entries = Object.values(zip.files);
      for (const entry of entries) {
        if (!entry.dir) {
          const content = await entry.async('string');
          finalFiles.push({ path: entry.name, content });
        }
      }
    }

    if (!finalFiles.length) {
      return Response.json({ error: 'Nenhum arquivo para enviar.' }, { status: 400 });
    }

    // Determine owner
    let owner = githubUsername;
    if (!owner) {
      const userInfo = await githubRequest(githubToken, 'GET', '/user', null);
      owner = userInfo.login;
    }

    const finalRepoName = repoName || 'projeto-gerado';
    const cleanRepoName = finalRepoName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    // Create repo
    let repo;
    try {
      repo = await githubRequest(githubToken, 'POST', '/user/repos', {
        name: cleanRepoName,
        description: description || 'Projeto gerado pelo Gemini Studio',
        private: isPrivate || false,
        auto_init: false
      });
    } catch (e) {
      // Repo might already exist
      repo = await githubRequest(githubToken, 'GET', `/repos/${owner}/${cleanRepoName}`, null);
    }

    // Push files
    const pushResult = await pushFilesToRepo(githubToken, owner, cleanRepoName, finalFiles, commitMessage);

    return Response.json({
      success: true,
      repoUrl: repo.html_url,
      repoName: cleanRepoName,
      owner,
      branch: pushResult.branch,
      commitSha: pushResult.commitSha,
      fileCount: pushResult.fileCount,
      cloneUrl: repo.clone_url
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});