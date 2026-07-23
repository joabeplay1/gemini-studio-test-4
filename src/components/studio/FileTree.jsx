import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Folder, FileCode2, FileText, FileJson, FileType, Image, Music, FolderOpen } from 'lucide-react';

function getFileIcon(path) {
  const ext = path.split('.').pop()?.toLowerCase();
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'go', 'rs', 'rb', 'php'].includes(ext)) return FileCode2;
  if (['json'].includes(ext)) return FileJson;
  if (['md', 'txt'].includes(ext)) return FileText;
  if (['css', 'scss', 'html', 'xml', 'svg'].includes(ext)) return FileType;
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico'].includes(ext)) return Image;
  if (['mp3', 'wav', 'ogg', 'mp4'].includes(ext)) return Music;
  return FileText;
}

function getFileColor(path) {
  const ext = path.split('.').pop()?.toLowerCase();
  if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) return 'text-yellow-400';
  if (['json'].includes(ext)) return 'text-green-400';
  if (['css', 'scss'].includes(ext)) return 'text-blue-400';
  if (['html', 'svg'].includes(ext)) return 'text-orange-400';
  if (['md'].includes(ext)) return 'text-slate-400';
  if (['py'].includes(ext)) return 'text-cyan-400';
  return 'text-slate-400';
}

function buildTree(files) {
  const root = { name: '', path: '', children: {}, files: [] };
  for (const file of files) {
    const parts = file.path.split('/').filter(Boolean);
    let current = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current.children[part]) {
        current.children[part] = { name: part, path: parts.slice(0, i + 1).join('/'), children: {}, files: [] };
      }
      current = current.children[part];
    }
    current.files.push(file);
  }
  return root;
}

function TreeNode({ node, level, selectedFile, onSelect, expanded, toggleExpand, pathPrefix }) {
  const childFolders = Object.values(node.children).sort((a, b) => a.name.localeCompare(b.name));
  const childFiles = node.files.sort((a, b) => a.path.localeCompare(b.path));
  const fullPath = pathPrefix ? `${pathPrefix}/${node.name}` : node.name;
  const isExpanded = expanded[fullPath] ?? level < 1;

  return (
    <>
      {childFolders.map((folder) => {
        const folderPath = pathPrefix ? `${pathPrefix}/${folder.name}` : folder.name;
        const isOpen = expanded[folderPath] ?? true;
        return (
          <div key={folderPath}>
            <button
              onClick={() => toggleExpand(folderPath)}
              className="w-full flex items-center gap-1 px-2 py-1.5 hover:bg-slate-800 rounded text-sm text-slate-300"
              style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
              {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
              {isOpen ? <FolderOpen className="w-4 h-4 text-violet-400" /> : <Folder className="w-4 h-4 text-violet-400" />}
              <span>{folder.name}</span>
            </button>
            {isOpen && (
              <TreeNode
                node={folder}
                level={level + 1}
                selectedFile={selectedFile}
                onSelect={onSelect}
                expanded={expanded}
                toggleExpand={toggleExpand}
                pathPrefix={folderPath}
              />
            )}
          </div>
        );
      })}
      {childFiles.map((file) => {
        const Icon = getFileIcon(file.path);
        const color = getFileColor(file.path);
        const isSelected = selectedFile?.path === file.path;
        const fileName = file.path.split('/').pop();
        return (
          <button
            key={file.path}
            onClick={() => onSelect(file)}
            className={`w-full flex items-center gap-1 px-2 py-1.5 rounded text-sm transition-colors ${isSelected ? 'bg-violet-600/30 text-violet-200' : 'hover:bg-slate-800 text-slate-400'}`}
            style={{ paddingLeft: `${level * 12 + 24}px` }}
          >
            <Icon className={`w-4 h-4 ${isSelected ? 'text-violet-300' : color}`} />
            <span className="truncate">{fileName}</span>
          </button>
        );
      })}
    </>
  );
}

export default function FileTree({ files, selectedFile, onSelect }) {
  const [expanded, setExpanded] = useState({});
  const tree = useMemo(() => buildTree(files), [files]);

  const toggleExpand = (path) => {
    setExpanded((prev) => ({ ...prev, [path]: !(prev[path] ?? true) }));
  };

  if (!files?.length) {
    return (
      <div className="p-4 text-sm text-slate-500 text-center">
        Nenhum arquivo gerado ainda.
      </div>
    );
  }

  return (
    <div className="py-2 max-h-full overflow-y-auto">
      <TreeNode
        node={tree}
        level={0}
        selectedFile={selectedFile}
        onSelect={onSelect}
        expanded={expanded}
        toggleExpand={toggleExpand}
        pathPrefix=""
      />
    </div>
  );
}