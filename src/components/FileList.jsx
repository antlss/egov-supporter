import React, { useState, useRef, useEffect } from 'react';
import { FileText, Trash2, Image, FileCode, Download, FolderDown, Pencil, Check, X } from 'lucide-react';
import { useToast } from './ToastContainer';
import './FileList.css';
import { zip } from 'fflate';

const FileList = ({ files, onSelectFile, selectedFile, onDeleteFile, onRenameFile }) => {
  const toast = useToast();
  const [editingPath, setEditingPath] = useState(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editingPath && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingPath]);

  const handleStartEdit = (e, path) => {
    e.stopPropagation();
    const fileName = path.split('/').pop();
    setEditingPath(path);
    setEditValue(fileName);
  };

  const handleCancelEdit = (e) => {
    if (e) e.stopPropagation();
    setEditingPath(null);
    setEditValue('');
  };

  const handleConfirmEdit = (e) => {
    if (e) e.stopPropagation();
    if (editingPath && editValue.trim()) {
      const success = onRenameFile(editingPath, editValue.trim());
      if (success) {
        setEditingPath(null);
        setEditValue('');
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleConfirmEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };
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

  const handleDownloadFile = (e, path, fileData) => {
    e.stopPropagation();

    const blob = new Blob([fileData.content], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = path.split('/').pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    if (Object.keys(files).length === 0) {
      toast.showWarning('ダウンロードするファイルがありません');
      return;
    }

    const filesToZip = {};
    for (const [path, fileData] of Object.entries(files)) {
      if (fileData.content) {
        filesToZip[path] = fileData.content;
      }
    }

    zip(filesToZip, { level: 6 }, (err, zipped) => {
      if (err) {
        toast.showError('ZIPファイルの作成に失敗しました: ' + err.message);
        return;
      }

      const blob = new Blob([zipped], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `egov-files-${new Date().getTime()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.showSuccess('ファイルをダウンロードしました');
    });
  };

  const fileEntries = Object.entries(files);

  return (
    <div className="file-list">
      <div className="file-list-header">
        <h3>ファイル一覧 ({fileEntries.length})</h3>
        {fileEntries.length > 0 && (
          <button
            className="download-all-files-btn"
            onClick={handleDownloadAll}
            title="全ファイルをダウンロード"
          >
            <FolderDown size={18} />
            全てダウンロード
          </button>
        )}
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
                className={`file-item ${selectedFile === path ? 'selected' : ''} ${editingPath === path ? 'editing' : ''}`}
                onClick={() => editingPath !== path && onSelectFile(path)}
              >
                <div className="file-item-info">
                  {getFileIcon(file.type)}
                  <div className="file-details">
                    {editingPath === path ? (
                      <div className="file-name-edit">
                        <input
                          ref={inputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onClick={(e) => e.stopPropagation()}
                          className="file-name-input"
                        />
                        <button
                          className="edit-confirm-btn"
                          onClick={handleConfirmEdit}
                          title="確定"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          className="edit-cancel-btn"
                          onClick={handleCancelEdit}
                          title="キャンセル"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="file-name">{path.split('/').pop()}</div>
                    )}
                    <div className="file-meta">
                      <span className="file-path">{path}</span>
                      <span className="file-size">{getFileSize(file.content)}</span>
                    </div>
                  </div>
                </div>
                <div className="file-actions">
                  {editingPath !== path && (
                    <button
                      className="edit-btn"
                      onClick={(e) => handleStartEdit(e, path)}
                      title="ファイル名を編集"
                    >
                      <Pencil size={16} />
                    </button>
                  )}
                  <button
                    className="download-btn"
                    onClick={(e) => handleDownloadFile(e, path, file)}
                    title="ファイルをダウンロード"
                  >
                    <Download size={16} />
                  </button>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileList;
