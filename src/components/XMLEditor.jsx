import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Save, X, Eye, Code, FileText } from 'lucide-react';
import { uint8ArrayToString, parseXML, xmlToString } from '../utils/zipHandler';
import XMLCodeEditor from './XMLCodeEditor';
import XMLHTMLPreview from './XMLHTMLPreview';
import './XMLEditor.css';

// Memoized sub-components for better performance
const FormControls = memo(({ searchTerm, setSearchTerm, showOnlyEmpty, setShowOnlyEmpty, formFields }) => {
  const emptyCount = useMemo(() => formFields.filter(f => f.isEmpty).length, [formFields]);
  const filledCount = formFields.length - emptyCount;

  return (
    <div className="form-controls">
      <input
        type="text"
        placeholder="フィールドを検索..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={showOnlyEmpty}
          onChange={(e) => setShowOnlyEmpty(e.target.checked)}
        />
        <span>空のフィールドのみ表示 ({emptyCount})</span>
      </label>
      <div className="field-stats">
        合計: {formFields.length} | 空: {emptyCount} | 入力済: {filledCount}
      </div>
    </div>
  );
});

const FormFieldsList = memo(({ formFields, searchTerm, showOnlyEmpty, handleFieldChange }) => {
  const filteredFields = useMemo(() => {
    return formFields.filter(field => {
      const matchesSearch = !searchTerm ||
        field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.path.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEmptyFilter = !showOnlyEmpty || field.isEmpty;

      return matchesSearch && matchesEmptyFilter;
    });
  }, [formFields, searchTerm, showOnlyEmpty]);

  return (
    <div className="form-fields">
      {filteredFields.map((field) => {
        const originalIndex = formFields.indexOf(field);
        return (
          <div
            key={originalIndex}
            className={`form-field ${field.isEmpty ? 'empty-field' : 'filled-field'}`}
            style={{ paddingLeft: `${field.level * 12}px` }}
          >
            <label>
              <span className="field-name">{field.name}</span>
              <span className="field-path">{field.path}</span>
            </label>
            <input
              type="text"
              value={field.value}
              onChange={(e) => handleFieldChange(originalIndex, e.target.value)}
              className="field-input"
              placeholder={field.isEmpty ? '値を入力...' : ''}
            />
          </div>
        );
      })}
    </div>
  );
});

const XMLEditor = ({ file, onSave, onClose, allFiles }) => {
  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState('formatted'); // 'formatted', 'code', or 'preview'
  const [formFields, setFormFields] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyEmpty, setShowOnlyEmpty] = useState(false);

  useEffect(() => {
    if (file) {
      const xmlString = uint8ArrayToString(file.content);
      setContent(xmlString);
      setHasChanges(false);

      // Parse XML để tạo form fields
      try {
        const xmlDoc = parseXML(xmlString);
        const fields = extractFields(xmlDoc);
        setFormFields(fields);
      } catch (error) {
        console.error('Error parsing XML:', error);
        setFormFields([]);
      }
    }
  }, [file]);

  const extractFields = (xmlDoc) => {
    const fields = [];
    const root = xmlDoc.documentElement;

    // Recursive function to extract ALL elements (both with and without text content)
    const traverse = (node, path = '', level = 0, indexMap = {}) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Create unique path with index for duplicate tag names
        const tagName = node.nodeName;
        const tagKey = path + '/' + tagName;

        // Track index for this tag at this level
        if (!indexMap[tagKey]) {
          indexMap[tagKey] = 0;
        }
        const tagIndex = indexMap[tagKey]++;

        const newPath = `${path}/${tagName}[${tagIndex}]`;

        // Check if this element has child elements
        const childElements = Array.from(node.children);

        if (childElements.length === 0) {
          // This is a leaf element (no child elements), it can contain text
          // Get the text content (might be empty)
          const textContent = node.textContent || '';

          // Add this as an editable field
          fields.push({
            path: newPath,
            name: node.nodeName,
            value: textContent,
            element: node,
            level: level,
            isEmpty: !textContent.trim(),
            index: tagIndex
          });
        } else {
          // This element has children, traverse them
          const childIndexMap = {};
          childElements.forEach(child => {
            traverse(child, newPath, level + 1, childIndexMap);
          });
        }
      }
    };

    traverse(root, '', 0, {});
    return fields;
  };

  const handleFieldChange = useCallback((index, newValue) => {
    setFormFields(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value: newValue, isEmpty: !newValue.trim() };
      return updated;
    });
    setHasChanges(true);

    // Sync content with form fields for preview
    try {
      const xmlDoc = parseXML(content);
      const pathParts = formFields[index].path.split('/').filter(p => p);
      let currentNode = xmlDoc.documentElement;

      for (let i = 1; i < pathParts.length; i++) {
        const part = pathParts[i];
        const match = part.match(/^(.+)\[(\d+)\]$/);
        if (match) {
          const tagName = match[1];
          const idx = parseInt(match[2], 10);
          const children = Array.from(currentNode.children).filter(
            child => child.nodeName === tagName
          );
          if (children[idx]) {
            currentNode = children[idx];
          }
        }
      }

      if (currentNode) {
        currentNode.textContent = newValue;
        setContent(xmlToString(xmlDoc));
      }
    } catch (error) {
      console.warn('Failed to sync content:', error);
    }
  }, [content, formFields]);

  const handleRawContentChange = useCallback((e) => {
    setContent(e.target.value);
    setHasChanges(true);
  }, []);

  const handleSave = () => {
    try {
      let updatedXmlString;

      if (viewMode === 'formatted') {
        // Update XML from form fields
        const xmlDoc = parseXML(content);
        formFields.forEach(field => {
          // Parse path with indices: /root/tag[0]/subtag[1]
          const pathParts = field.path.split('/').filter(p => p);
          let currentNode = xmlDoc.documentElement;

          // Navigate to the target element using indices
          for (let i = 1; i < pathParts.length; i++) {
            const part = pathParts[i];
            const match = part.match(/^(.+)\[(\d+)\]$/);

            if (match) {
              const tagName = match[1];
              const index = parseInt(match[2], 10);

              const children = Array.from(currentNode.children).filter(
                child => child.nodeName === tagName
              );

              if (children[index]) {
                currentNode = children[index];
              } else {
                console.warn(`Could not find element: ${tagName}[${index}] in path ${field.path}`);
                return;
              }
            }
          }

          // Update the text content
          if (currentNode) {
            currentNode.textContent = field.value;
          }
        });

        updatedXmlString = xmlToString(xmlDoc);
      } else {
        updatedXmlString = content;
      }

      onSave(updatedXmlString);
      setHasChanges(false);
    } catch (error) {
      console.error('Save error:', error);
      alert('XML保存エラー: ' + error.message);
    }
  };

  if (!file) {
    return (
      <div className="xml-editor empty">
        <div className="empty-state">
          <Code size={48} className="empty-icon" />
          <p>XMLファイルを選択して編集</p>
        </div>
      </div>
    );
  }

  return (
    <div className="xml-editor">
      <div className="xml-editor-header">
        <div className="header-left">
          <h3>{file.path.split('/').pop()}</h3>
          {hasChanges && <span className="unsaved-indicator">● 未保存</span>}
        </div>
        <div className="header-actions">
          <div className="view-mode-toggle">
            <button
              className={viewMode === 'formatted' ? 'active' : ''}
              onClick={() => setViewMode('formatted')}
              title="フォームモード"
            >
              <Eye size={16} />
              Form
            </button>
            <button
              className={viewMode === 'code' ? 'active' : ''}
              onClick={() => setViewMode('code')}
              title="コードモード"
            >
              <Code size={16} />
              Code
            </button>
            <button
              className={viewMode === 'preview' ? 'active' : ''}
              onClick={() => setViewMode('preview')}
              title="プレビューモード"
            >
              <FileText size={16} />
              Preview
            </button>
          </div>
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={!hasChanges}
            title="変更を保存"
          >
            <Save size={16} />
            保存
          </button>
          <button className="close-btn" onClick={onClose} title="閉じる">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="xml-editor-content">
        {viewMode === 'formatted' ? (
          <div className="formatted-view">
            {formFields.length === 0 ? (
              <div className="no-fields">
                <p>データフィールドが見つかりません</p>
              </div>
            ) : (
              <>
                <FormControls
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  showOnlyEmpty={showOnlyEmpty}
                  setShowOnlyEmpty={setShowOnlyEmpty}
                  formFields={formFields}
                />
                <FormFieldsList
                  formFields={formFields}
                  searchTerm={searchTerm}
                  showOnlyEmpty={showOnlyEmpty}
                  handleFieldChange={handleFieldChange}
                />
              </>
            )}
          </div>
        ) : viewMode === 'code' ? (
          <div className="raw-view">
            <XMLCodeEditor
              value={content}
              onChange={handleRawContentChange}
            />
          </div>
        ) : (
          <XMLHTMLPreview xmlString={content} allFiles={allFiles} />
        )}
      </div>
    </div>
  );
};

export default XMLEditor;
