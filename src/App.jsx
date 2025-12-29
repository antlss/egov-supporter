import React, { useState } from 'react';
import FileList from './components/FileList';
import XMLEditor from './components/XMLEditor';
import InputPanel from './components/InputPanel';
import { decodeAndUnzip, zipAndEncode, stringToUint8Array } from './utils/zipHandler';
import './App.css';

function App() {
  const [files, setFiles] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDecode = async (base64String) => {
    const decodedFiles = await decodeAndUnzip(base64String);
    setFiles(decodedFiles);
    setSelectedFile(null);
  };

  const handleEncode = async () => {
    const result = await zipAndEncode(files);
    return result;
  };

  const handleSelectFile = (path) => {
    setSelectedFile(path);
  };

  const handleDeleteFile = (path) => {
    if (confirm(`ファイル「${path}」を削除してもよろしいですか？`)) {
      const newFiles = { ...files };
      delete newFiles[path];
      setFiles(newFiles);

      if (selectedFile === path) {
        setSelectedFile(null);
      }
    }
  };

  const handleSaveXML = (xmlString) => {
    if (!selectedFile) return;

    const updatedFiles = { ...files };
    updatedFiles[selectedFile] = {
      ...updatedFiles[selectedFile],
      content: stringToUint8Array(xmlString)
    };
    setFiles(updatedFiles);
    alert('変更を保存しました！');
  };

  const handleAddFile = (filename, content) => {
    // Generate a unique path
    let path = filename;
    let counter = 1;
    while (files[path]) {
      const ext = filename.split('.').pop();
      const name = filename.substring(0, filename.lastIndexOf('.'));
      path = `${name}_${counter}.${ext}`;
      counter++;
    }

    const fileType = path.split('.').pop().toLowerCase();
    const newFile = {
      path,
      content,
      type: fileType === 'xml' ? 'xml' : fileType === 'txt' ? 'text' : 'unknown',
      isEditable: fileType === 'xml'
    };

    setFiles({ ...files, [path]: newFile });
    alert(`ファイルを追加しました：${path}`);
  };

  const handleCloseEditor = () => {
    setSelectedFile(null);
  };

  const selectedFileData = selectedFile ? files[selectedFile] : null;

  return (
    <div className="app">
      <header className="app-header">
        <h1>eGov XML Editor</h1>
        <p>日本政府 eGov API の XMLファイル処理ツール</p>
      </header>

      <div className="app-container">
        <div className="left-panel">
          <InputPanel
            onDecode={handleDecode}
            onEncode={handleEncode}
            onAddFile={handleAddFile}
            hasFiles={Object.keys(files).length > 0}
          />
        </div>

        <div className="middle-panel">
          <FileList
            files={files}
            onSelectFile={handleSelectFile}
            selectedFile={selectedFile}
            onDeleteFile={handleDeleteFile}
          />
        </div>

        <div className="right-panel">
          <XMLEditor
            file={selectedFileData}
            onSave={handleSaveXML}
            onClose={handleCloseEditor}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
