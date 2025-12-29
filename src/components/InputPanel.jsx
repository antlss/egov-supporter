import React, { useState } from 'react';
import { Upload, Download, Plus, FolderDown } from 'lucide-react';
import './InputPanel.css';
import { zip } from 'fflate';

const InputPanel = ({ onDecode, onEncode, onAddFile, hasFiles, allFiles }) => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDecode = async () => {
    if (!inputText.trim()) {
      alert('Base64文字列を入力してください');
      return;
    }

    setIsLoading(true);
    try {
      await onDecode(inputText);
      setInputText('');
    } catch (error) {
      alert('エラー: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEncode = async () => {
    if (!hasFiles) {
      alert('エンコードするファイルがありません');
      return;
    }

    setIsLoading(true);
    try {
      const result = await onEncode();
      setOutputText(result);
    } catch (error) {
      alert('エラー: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/sample.md');
      const text = await response.text();
      setInputText(text.trim());
    } catch (error) {
      alert('サンプルファイルを読み込めません: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = new Uint8Array(event.target.result);
        onAddFile(file.name, content);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputText);
    alert('クリップボードにコピーしました！');
  };

  const handleDownloadAll = async () => {
    if (!allFiles || Object.keys(allFiles).length === 0) {
      alert('ダウンロードするファイルがありません');
      return;
    }

    setIsLoading(true);
    try {
      // Prepare files for zipping
      const filesToZip = {};
      for (const [path, fileData] of Object.entries(allFiles)) {
        if (fileData.content) {
          filesToZip[path] = fileData.content;
        }
      }

      // Create ZIP file
      zip(filesToZip, { level: 6 }, (err, zipped) => {
        if (err) {
          alert('ZIPファイルの作成に失敗しました: ' + err.message);
          setIsLoading(false);
          return;
        }

        // Create download link
        const blob = new Blob([zipped], { type: 'application/zip' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `egov-files-${new Date().getTime()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        alert('ファイルをダウンロードしました！');
        setIsLoading(false);
      });
    } catch (error) {
      alert('エラー: ' + error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="input-panel">
      <div className="panel-section">
        <div className="section-header">
          <h3>Input - Base64データ</h3>
          <button className="load-sample-btn" onClick={handleLoadSample}>
            サンプル読込
          </button>
        </div>
        <textarea
          className="input-textarea"
          placeholder="ZIPファイルのBase64文字列を入力..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isLoading}
        />
        <button
          className="action-btn primary"
          onClick={handleDecode}
          disabled={isLoading || !inputText.trim()}
        >
          <Upload size={16} />
          Decode & Unzip
        </button>
      </div>

      <div className="panel-section">
        <div className="section-header">
          <h3>ファイル操作</h3>
        </div>
        <div className="upload-area">
          <label className="upload-btn">
            <Plus size={16} />
            ファイルを追加
            <input
              type="file"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
          <button
            className="download-all-btn"
            onClick={handleDownloadAll}
            disabled={isLoading || !hasFiles}
          >
            <FolderDown size={16} />
            全ファイルをダウンロード
          </button>
          <p className="upload-hint">ZIPファイルとして一括保存</p>
        </div>
      </div>

      <div className="panel-section">
        <div className="section-header">
          <h3>Output - Base64結果</h3>
        </div>
        <textarea
          className="output-textarea"
          placeholder="エンコード後の結果がここに表示されます..."
          value={outputText}
          readOnly
        />
        <div className="output-actions">
          <button
            className="action-btn primary"
            onClick={handleEncode}
            disabled={isLoading || !hasFiles}
          >
            <Download size={16} />
            Zip & Encode
          </button>
          {outputText && (
            <button className="action-btn" onClick={copyToClipboard}>
              コピー
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InputPanel;
