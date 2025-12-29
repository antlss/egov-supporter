import React from 'react';
import { FileText, Trash2, Image, FileCode } from 'lucide-react';
import './FileList.css';

const FileList = ({ files, onSelectFile, selectedFile, onDeleteFile }) => {
  const getFileIcon = (type) => {
    switch (type) {
      case 'xml':
        return <FileCode size={20} className="file-icon xml" />;
      case 'image':
        return <Image size={20} className="file-icon image" />;
      default:
        return <FileText size={20} className="file-icon" />;
    }
  };

  const getFileSize = (content) => {
    const bytes = content.byteLength;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fileEntries = Object.entries(files);

  return (
    <div className="file-list">
      <div className="file-list-header">
        <h3>ファイル一覧 ({fileEntries.length})</h3>
      </div>
      <div className="file-list-content">
        {fileEntries.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} className="empty-icon" />
            <p>ファイルがありません</p>
            <p className="empty-hint">Base64データをアップロードして開始</p>
          </div>
        ) : (
          <div className="file-items">
            {fileEntries.map(([path, file]) => (
              <div
                key={path}
                className={`file-item ${selectedFile === path ? 'selected' : ''}`}
                onClick={() => onSelectFile(path)}
              >
                <div className="file-item-info">
                  {getFileIcon(file.type)}
                  <div className="file-details">
                    <div className="file-name">{path.split('/').pop()}</div>
                    <div className="file-meta">
                      <span className="file-path">{path}</span>
                      <span className="file-size">{getFileSize(file.content)}</span>
                    </div>
                  </div>
                </div>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFile(path);
                  }}
                  title="ファイルを削除"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileList;
