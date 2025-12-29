import React, { useMemo } from 'react';
import './XMLHTMLPreview.css';

const XMLHTMLPreview = ({ xmlString, allFiles }) => {
  // Transform XML to HTML for visual preview with XSLT support
  const htmlContent = useMemo(() => {
    if (!xmlString) return '<div class="empty-preview">XMLデータがありません</div>';

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

      // Check for parsing errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        return `<div class="error-preview">XMLパースエラー: ${parseError.textContent}</div>`;
      }

      // Detect file type and render accordingly
      const rootElement = xmlDoc.documentElement;
      const rootName = rootElement.nodeName;

      // XSLT Stylesheet (.xsl files)
      if (rootName === 'xsl:stylesheet' || rootElement.getAttribute('xmlns:xsl')) {
        return renderXSLTStylesheet(xmlDoc);
      }

      // Data XML with stylesheet reference
      const stylesheetRef = xmlDoc.querySelector('xml-stylesheet, xsl-stylesheet');
      if (stylesheetRef || rootElement.querySelector('STYLESHEET')) {
        return renderDataXMLWithStylesheet(xmlDoc, allFiles);
      }

      // XSD Schema files
      if (rootName === 'xs:schema' || rootName === 'xsd:schema') {
        return renderXSDSchema(xmlDoc);
      }

      // Regular XML data
      return renderRegularXML(xmlDoc.documentElement);
    } catch (error) {
      return `<div class="error-preview">プレビューエラー: ${error.message}</div>`;
    }
  }, [xmlString, allFiles]);

  return (
    <div className="xml-html-preview">
      <div
        className="preview-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
};

/**
 * Render XSLT Stylesheet preview
 */
function renderXSLTStylesheet(xmlDoc) {
  const output = xmlDoc.querySelector('xsl\\:output, output');
  const templates = xmlDoc.querySelectorAll('xsl\\:template, template');

  let html = '<div class="xslt-preview">';
  html += '<div class="preview-header"><h3>📄 XSLTスタイルシート</h3></div>';

  // Output configuration
  if (output) {
    html += '<div class="xslt-section">';
    html += '<h4>出力設定</h4>';
    html += '<div class="xslt-info">';
    html += `<div>メソッド: <code>${output.getAttribute('method') || 'xml'}</code></div>`;
    html += `<div>エンコーディング: <code>${output.getAttribute('encoding') || 'UTF-8'}</code></div>`;
    html += '</div></div>';
  }

  // Templates
  if (templates.length > 0) {
    html += '<div class="xslt-section">';
    html += `<h4>テンプレート (${templates.length}個)</h4>`;
    templates.forEach((template, i) => {
      const match = template.getAttribute('match') || template.getAttribute('name') || '(unnamed)';
      html += `<div class="xslt-template"><span class="template-number">${i + 1}</span> <code>${escapeHtml(match)}</code></div>`;
    });
    html += '</div>';
  }

  html += '</div>';
  return html;
}

/**
 * Render Data XML with stylesheet reference
 */
function renderDataXMLWithStylesheet(xmlDoc, allFiles) {
  const root = xmlDoc.documentElement;
  const stylesheetElement = root.querySelector('STYLESHEET');

  let html = '<div class="data-xml-preview">';
  html += '<div class="preview-header"><h3>📋 データXML (XSLTスタイルシート参照)</h3></div>';

  // Stylesheet reference
  if (stylesheetElement) {
    const stylesheetRef = stylesheetElement.textContent;
    html += `<div class="stylesheet-ref">スタイルシート: <code>${escapeHtml(stylesheetRef)}</code></div>`;

    // Try to apply XSLT if stylesheet file exists
    if (allFiles) {
      try {
        const transformedHTML = applyXSLT(xmlDoc, stylesheetRef, allFiles);
        if (transformedHTML) {
          html += '<div class="transformed-content">';
          html += '<h4>📊 変換後のプレビュー</h4>';
          html += transformedHTML;
          html += '</div>';
          html += '</div>';
          return html;
        }
      } catch (error) {
        console.warn('XSLT transformation failed:', error);
      }
    }
  }

  // Fallback: Show XML structure
  html += '<div class="xml-structure">';
  html += '<h4>XMLデータ構造</h4>';
  html += renderRegularXML(root);
  html += '</div>';
  html += '</div>';

  return html;
}

/**
 * Apply XSLT transformation
 */
function applyXSLT(xmlDoc, stylesheetPath, allFiles) {
  try {
    // Find stylesheet file
    const stylesheetFile = Object.values(allFiles).find(file =>
      file.path.includes(stylesheetPath) || file.path.endsWith('.xsl')
    );

    if (!stylesheetFile) {
      return null;
    }

    // Parse stylesheet
    const parser = new DOMParser();
    const decoder = new TextDecoder('utf-8');
    const xslString = decoder.decode(stylesheetFile.content);
    const xslDoc = parser.parseFromString(xslString, 'text/xml');

    // Perform XSLT transformation
    const xsltProcessor = new XSLTProcessor();
    xsltProcessor.importStylesheet(xslDoc);
    const resultDoc = xsltProcessor.transformToFragment(xmlDoc, document);

    // Convert result to HTML string
    const serializer = new XMLSerializer();
    return serializer.serializeToString(resultDoc);
  } catch (error) {
    console.error('XSLT transformation error:', error);
    return null;
  }
}

/**
 * Render XSD Schema preview
 */
function renderXSDSchema(xmlDoc) {
  const elements = xmlDoc.querySelectorAll('xs\\:element, element');
  const complexTypes = xmlDoc.querySelectorAll('xs\\:complexType, complexType');

  let html = '<div class="xsd-preview">';
  html += '<div class="preview-header"><h3>📐 XMLスキーマ定義 (XSD)</h3></div>';

  if (elements.length > 0) {
    html += '<div class="xsd-section">';
    html += `<h4>要素定義 (${elements.length}個)</h4>`;
    html += '<div class="xsd-elements">';
    elements.forEach(el => {
      const name = el.getAttribute('name');
      const type = el.getAttribute('type');
      if (name) {
        html += `<div class="xsd-element">`;
        html += `<span class="element-name">${escapeHtml(name)}</span>`;
        if (type) {
          html += ` : <span class="element-type">${escapeHtml(type)}</span>`;
        }
        html += `</div>`;
      }
    });
    html += '</div></div>';
  }

  html += '</div>';
  return html;
}

/**
 * Render regular XML as structured document
 */
function renderRegularXML(node, level = 0) {
  if (!node) return '';

  let html = '';

  // Element node
  if (node.nodeType === Node.ELEMENT_NODE) {
    const tagName = node.nodeName;
    const hasChildren = node.children.length > 0;
    const textContent = node.textContent?.trim() || '';

    // Opening tag
    html += `<div class="xml-element level-${level}">`;
    html += `<div class="xml-element-header">`;
    html += `<span class="xml-tag-name">${escapeHtml(tagName)}</span>`;

    // Attributes
    if (node.attributes.length > 0) {
      html += '<span class="xml-attributes">';
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        html += ` <span class="xml-attr-name">${escapeHtml(attr.name)}</span>=<span class="xml-attr-value">"${escapeHtml(attr.value)}"</span>`;
      }
      html += '</span>';
    }

    html += '</div>';

    // Content
    if (hasChildren) {
      // Has child elements
      html += '<div class="xml-children">';
      for (let i = 0; i < node.children.length; i++) {
        html += renderRegularXML(node.children[i], level + 1);
      }
      html += '</div>';
    } else if (textContent) {
      // Leaf node with text content
      html += `<div class="xml-text-content">${escapeHtml(textContent)}</div>`;
    }

    html += '</div>';
  }

  return html;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export default XMLHTMLPreview;
