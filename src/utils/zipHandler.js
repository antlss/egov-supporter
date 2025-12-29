import { unzip, zip } from 'fflate';

/**
 * Decode base64 string và unzip để lấy danh sách files
 */
export async function decodeAndUnzip(base64String) {
  try {
    // Decode base64 to binary
    const binaryString = atob(base64String.trim());
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Unzip
    return new Promise((resolve, reject) => {
      unzip(bytes, (err, unzipped) => {
        if (err) {
          reject(err);
          return;
        }

        // Convert to file objects
        const files = {};
        for (const [path, content] of Object.entries(unzipped)) {
          // Skip directories
          if (path.endsWith('/')) continue;

          files[path] = {
            path,
            content,
            type: getFileType(path),
            isEditable: isEditableFile(path)
          };
        }

        resolve(files);
      });
    });
  } catch (error) {
    throw new Error(`Lỗi decode/unzip: ${error.message}`);
  }
}

/**
 * Zip và encode base64 để tạo chuỗi output
 */
export async function zipAndEncode(files) {
  try {
    // Prepare files for zipping
    const filesToZip = {};
    for (const [path, fileData] of Object.entries(files)) {
      filesToZip[path] = fileData.content;
    }

    // Zip files
    return new Promise((resolve, reject) => {
      zip(filesToZip, { level: 6 }, (err, zipped) => {
        if (err) {
          reject(err);
          return;
        }

        // Encode to base64
        let binary = '';
        const bytes = new Uint8Array(zipped);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        resolve(base64);
      });
    });
  } catch (error) {
    throw new Error(`Lỗi zip/encode: ${error.message}`);
  }
}

/**
 * Parse XML string to object for easier editing
 */
export function parseXML(xmlString) {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error('XML parsing error');
    }

    return xmlDoc;
  } catch (error) {
    throw new Error(`Lỗi parse XML: ${error.message}`);
  }
}

/**
 * Convert XML Document back to string
 */
export function xmlToString(xmlDoc) {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(xmlDoc);
}

/**
 * Detect file type from extension
 */
function getFileType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const typeMap = {
    'xml': 'xml',
    'xsd': 'schema',
    'txt': 'text',
    'pdf': 'pdf',
    'jpg': 'image',
    'jpeg': 'image',
    'png': 'image',
    'gif': 'image'
  };
  return typeMap[ext] || 'unknown';
}

/**
 * Check if file is editable (XML files)
 */
function isEditableFile(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  return ext === 'xml';
}

/**
 * Convert Uint8Array to string
 */
export function uint8ArrayToString(uint8Array) {
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(uint8Array);
}

/**
 * Convert string to Uint8Array
 */
export function stringToUint8Array(str) {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}
