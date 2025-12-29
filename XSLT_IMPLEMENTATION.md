# XSLT Preview Implementation Guide

## 📋 Tổng quan

eGov XML Editor hiện đã hỗ trợ đầy đủ XSLT transformation để render chính xác các file XML có liên kết với nhau.

## 🎯 Các loại file được hỗ trợ

### 1. XSLT Stylesheet Files (.xsl)
**Phát hiện**: Root element là `xsl:stylesheet` hoặc có namespace `xmlns:xsl`

**Hiển thị**:
- 📄 Header với gradient tím (purple)
- Thông tin output configuration (method, encoding)
- Danh sách templates với số thứ tự
- Mỗi template hiển thị match pattern hoặc name

**CSS Classes**: `.xslt-preview`, `.xslt-section`, `.xslt-template`

### 2. Data XML with Stylesheet Reference
**Phát hiện**: Có element `<STYLESHEET>` hoặc `<?xml-stylesheet?>` processing instruction

**Hiển thị**:
- 📋 Header với gradient xanh (blue)
- Reference đến file stylesheet
- **XSLT Transformation**: Tự động tìm file .xsl trong `allFiles` và apply transformation
- Kết quả HTML sau khi transform
- Fallback: XML structure nếu không tìm thấy stylesheet

**CSS Classes**: `.data-xml-preview`, `.stylesheet-ref`, `.transformed-content`

### 3. XSD Schema Files (.xsd)
**Phát hiện**: Root element là `xs:schema` hoặc `xsd:schema`

**Hiển thị**:
- 📐 Header với gradient vàng cam (amber)
- Danh sách element definitions
- Tên element và type cho mỗi definition

**CSS Classes**: `.xsd-preview`, `.xsd-section`, `.xsd-element`

### 4. Regular XML
**Phát hiện**: Không thuộc các loại trên

**Hiển thị**:
- Cấu trúc cây XML với hierarchy
- Tag names, attributes, và text content
- Color-coded theo level (purple → blue → green → orange)

**CSS Classes**: `.xml-element`, `.xml-tag-name`, `.xml-text-content`

## 🔧 Implementation Details

### Core Function: `applyXSLT()`

```javascript
function applyXSLT(xmlDoc, stylesheetPath, allFiles) {
  // 1. Tìm stylesheet file từ allFiles
  const stylesheetFile = Object.values(allFiles).find(file =>
    file.path.includes(stylesheetPath) || file.path.endsWith('.xsl')
  );

  if (!stylesheetFile) return null;

  // 2. Parse stylesheet XML
  const parser = new DOMParser();
  const decoder = new TextDecoder('utf-8');
  const xslString = decoder.decode(stylesheetFile.content);
  const xslDoc = parser.parseFromString(xslString, 'text/xml');

  // 3. Perform XSLT transformation
  const xsltProcessor = new XSLTProcessor();
  xsltProcessor.importStylesheet(xslDoc);
  const resultDoc = xsltProcessor.transformToFragment(xmlDoc, document);

  // 4. Serialize result to HTML string
  const serializer = new XMLSerializer();
  return serializer.serializeToString(resultDoc);
}
```

### Data Flow

```
App.jsx
  └─> files state (all ZIP contents)
      └─> XMLEditor (receives allFiles prop)
          └─> XMLHTMLPreview (receives xmlString + allFiles)
              └─> Detect file type
                  ├─> XSLT Stylesheet → renderXSLTStylesheet()
                  ├─> Data XML → renderDataXMLWithStylesheet()
                  │                └─> applyXSLT() → Transform với XSLTProcessor
                  ├─> XSD Schema → renderXSDSchema()
                  └─> Regular XML → renderRegularXML()
```

## 🎨 Visual Design

### Color Scheme
- **XSLT Stylesheet**: Purple gradient (#667eea → #764ba2)
- **Data XML**: Blue gradient (#4facfe → #00f2fe)
- **XSD Schema**: Amber gradient (#f59e0b → #d97706)
- **Regular XML**: Blue tones với level-based colors

### Interactive Elements
- Hover effects với `transform: translateX(4px)`
- Box shadows on hover
- Smooth transitions (0.2s)
- Template numbering với circular badges

## 📦 Props & Dependencies

### XMLHTMLPreview Props
```javascript
<XMLHTMLPreview
  xmlString={string}   // XML content to render
  allFiles={object}    // All files from ZIP (for XSLT lookup)
/>
```

### Required Data Structure
```javascript
allFiles = {
  'path/to/file.xml': {
    path: 'path/to/file.xml',
    content: Uint8Array,
    type: 'xml',
    isEditable: true
  },
  'path/to/layout.xsl': {
    path: 'path/to/layout.xsl',
    content: Uint8Array,
    type: 'xml',
    isEditable: true
  }
}
```

## ⚠️ Browser Compatibility

**XSLTProcessor Support**:
- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ✅ Safari: Full support
- ❌ IE11: Deprecated (không hỗ trợ)

## 🐛 Error Handling

### Parsing Errors
```javascript
const parseError = xmlDoc.querySelector('parsererror');
if (parseError) {
  return `<div class="error-preview">XMLパースエラー: ${parseError.textContent}</div>`;
}
```

### Transformation Errors
```javascript
try {
  const transformedHTML = applyXSLT(xmlDoc, stylesheetRef, allFiles);
  if (transformedHTML) {
    // Success
  }
} catch (error) {
  console.warn('XSLT transformation failed:', error);
  // Fallback to XML structure view
}
```

## 🧪 Testing Checklist

- [ ] XSLT file hiển thị danh sách templates
- [ ] Data XML với STYLESHEET reference tự động transform
- [ ] Stylesheet file được tìm thấy từ allFiles
- [ ] XSD schema hiển thị element definitions
- [ ] Regular XML hiển thị cấu trúc cây
- [ ] Error handling khi parse fails
- [ ] Error handling khi transformation fails
- [ ] CSS styling cho tất cả preview types
- [ ] Responsive design
- [ ] Print styles

## 📚 References

- **XSLTProcessor MDN**: https://developer.mozilla.org/en-US/docs/Web/API/XSLTProcessor
- **DOMParser**: https://developer.mozilla.org/en-US/docs/Web/API/DOMParser
- **XMLSerializer**: https://developer.mozilla.org/en-US/docs/Web/API/XMLSerializer

---

**Implementation Date**: 2025-12-29
**Author**: Claude Sonnet 4.5
**Status**: ✅ COMPLETED
