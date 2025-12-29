import React, { useState } from 'react';
import { Upload, Download, Plus } from 'lucide-react';
import './InputPanel.css';

const InputPanel = ({ onDecode, onEncode, onAddFile, hasFiles }) => {
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
          <h3>新規ファイル追加</h3>
        </div>
        <div className="upload-area">
          <label className="upload-btn">
            <Plus size={16} />
            ファイルを選択
            <input
              type="file"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
          <p className="upload-hint">全てのファイル形式に対応</p>
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
