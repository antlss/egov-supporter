import React, { useState, useEffect } from 'react';
import { Save, X, Eye, Code } from 'lucide-react';
import { uint8ArrayToString, parseXML, xmlToString } from '../utils/zipHandler';
import XMLCodeEditor from './XMLCodeEditor';
import './XMLEditor.css';

const XMLEditor = ({ file, onSave, onClose }) => {
  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState('formatted'); // 'formatted' or 'raw'
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
    const traverse = (node, path = '', level = 0) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const newPath = path + '/' + node.nodeName;

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
            isEmpty: !textContent.trim()
          });
        } else {
          // This element has children, traverse them
          childElements.forEach(child => {
            traverse(child, newPath, level + 1);
          });
        }
      }
    };

    traverse(root, '', 0);
    return fields;
  };

  const handleFieldChange = (index, newValue) => {
    const updatedFields = [...formFields];
    updatedFields[index].value = newValue;
    setFormFields(updatedFields);
    setHasChanges(true);
  };

  const handleRawContentChange = (e) => {
    setContent(e.target.value);
    setHasChanges(true);
  };

  const handleSave = () => {
    try {
      let updatedXmlString;

      if (viewMode === 'formatted') {
        // Update XML from form fields
        const xmlDoc = parseXML(content);
        formFields.forEach(field => {
          // Find the node in the current document using path
          const xpath = field.path.split('/').filter(p => p);
          let currentNode = xmlDoc.documentElement;

          // Navigate to the target element
          for (let i = 1; i < xpath.length; i++) {
            const tagName = xpath[i];
            const children = Array.from(currentNode.children);
            const found = children.find(child => child.nodeName === tagName);
            if (found) {
              currentNode = found;
            } else {
              console.warn(`Could not find element: ${tagName} in path ${field.path}`);
              return;
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
      alert('Lỗi khi lưu XML: ' + error.message);
    }
  };

  if (!file) {
    return (
      <div className="xml-editor empty">
        <div className="empty-state">
          <Code size={48} className="empty-icon" />
          <p>Chọn file XML để chỉnh sửa</p>
        </div>
      </div>
    );
  }

  return (
    <div className="xml-editor">
      <div className="xml-editor-header">
        <div className="header-left">
          <h3>{file.path.split('/').pop()}</h3>
          {hasChanges && <span className="unsaved-indicator">● Chưa lưu</span>}
        </div>
        <div className="header-actions">
          <div className="view-mode-toggle">
            <button
              className={viewMode === 'formatted' ? 'active' : ''}
              onClick={() => setViewMode('formatted')}
              title="Chế độ form"
            >
              <Eye size={16} />
              Form
            </button>
            <button
              className={viewMode === 'raw' ? 'active' : ''}
              onClick={() => setViewMode('raw')}
              title="Chế độ code"
            >
              <Code size={16} />
              Code
            </button>
          </div>
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={!hasChanges}
            title="Lưu thay đổi"
          >
            <Save size={16} />
            Lưu
          </button>
          <button className="close-btn" onClick={onClose} title="Đóng">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="xml-editor-content">
        {viewMode === 'formatted' ? (
          <div className="formatted-view">
            {formFields.length === 0 ? (
              <div className="no-fields">
                <p>Không tìm thấy trường dữ liệu</p>
              </div>
            ) : (
              <>
                <div className="form-controls">
                  <input
                    type="text"
                    placeholder="Tìm kiếm field..."
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
                    <span>Chỉ hiện field trống ({formFields.filter(f => f.isEmpty).length})</span>
                  </label>
                  <div className="field-stats">
                    Tổng: {formFields.length} fields | Trống: {formFields.filter(f => f.isEmpty).length} | Đã điền: {formFields.filter(f => !f.isEmpty).length}
                  </div>
                </div>
                <div className="form-fields">
                  {formFields
                    .filter(field => {
                      // Filter by search term
                      const matchesSearch = !searchTerm ||
                        field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        field.path.toLowerCase().includes(searchTerm.toLowerCase());

                      // Filter by empty status
                      const matchesEmptyFilter = !showOnlyEmpty || field.isEmpty;

                      return matchesSearch && matchesEmptyFilter;
                    })
                    .map((field, index) => {
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
                            placeholder={field.isEmpty ? 'Nhập giá trị...' : ''}
                          />
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="raw-view">
            <XMLCodeEditor
              value={content}
              onChange={handleRawContentChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default XMLEditor;
