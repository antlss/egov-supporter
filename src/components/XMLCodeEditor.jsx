import React, { useRef, useEffect, useMemo } from 'react';
import './XMLCodeEditor.css';

const XMLCodeEditor = ({ value, onChange }) => {
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);

  useEffect(() => {
    syncScroll();
  }, [value]);

  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  const syncScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleScroll = (e) => {
    syncScroll();
  };

  // Memoize highlighted XML để tránh re-render không cần thiết
  const highlightedXML = useMemo(() => {
    if (!value) return '';

    let highlighted = value;

    // Escape HTML
    highlighted = highlighted
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // XML declaration
    highlighted = highlighted.replace(
      /(&lt;\?xml[^?]*\?&gt;)/g,
      '<span class="xml-declaration">$1</span>'
    );

    // Comments
    highlighted = highlighted.replace(
      /(&lt;!--[\s\S]*?--&gt;)/g,
      '<span class="xml-comment">$1</span>'
    );

    // CDATA
    highlighted = highlighted.replace(
      /(&lt;!\[CDATA\[[\s\S]*?\]\]&gt;)/g,
      '<span class="xml-cdata">$1</span>'
    );

    // Tags with attributes
    highlighted = highlighted.replace(
      /&lt;([a-zA-Z0-9_-]+)([^&]*?)(&gt;|\/&gt;)/g,
      (match, tagName, attributes, closing) => {
        let result = '&lt;<span class="xml-tag">' + tagName + '</span>';

        // Highlight attributes
        if (attributes) {
          result += attributes.replace(
            /([a-zA-Z0-9_-]+)=(["'])(.*?)\2/g,
            '<span class="xml-attr-name">$1</span>=<span class="xml-attr-value">$2$3$2</span>'
          );
        }

        result += '<span class="xml-bracket">' + closing + '</span>';
        return result;
      }
    );

    // Closing tags
    highlighted = highlighted.replace(
      /&lt;\/([a-zA-Z0-9_-]+)&gt;/g,
      '&lt;/<span class="xml-tag">$1</span><span class="xml-bracket">&gt;</span>'
    );

    // Fix opening brackets that weren't caught
    highlighted = highlighted.replace(
      /&lt;(?![\/?!])/g,
      '<span class="xml-bracket">&lt;</span>'
    );

    return highlighted;
  }, [value]);

  return (
    <div className="xml-code-editor">
      <div
        ref={highlightRef}
        className="xml-highlight"
        dangerouslySetInnerHTML={{ __html: highlightedXML }}
      />
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onScroll={handleScroll}
        className="xml-textarea"
        spellCheck="false"
      />
    </div>
  );
};

export default XMLCodeEditor;
