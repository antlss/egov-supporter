import { unzip, zip } from 'fflate';

/**
 * Decode base64 string và unzip để lấy danh sách files
 */
export async function decodeAndUnzip(base64String) {
  try {
    // Validate input
    if (!base64String || typeof base64String !== 'string') {
      throw new Error('無効な入力です。Base64文字列を入力してください。');
    }

    // Clean base64 string
    const cleanedBase64 = base64String.trim().replace(/\s/g, '');

    // Validate base64 format
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(cleanedBase64)) {
      throw new Error('Base64形式が正しくありません。');
    }

    // Decode base64 to binary
    let binaryString;
    try {
      binaryString = atob(cleanedBase64);
    } catch (e) {
      throw new Error('Base64デコードに失敗しました。文字列が正しくありません。');
    }

    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Check if it's a valid ZIP file (starts with PK signature)
    if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4B) {
      throw new Error('ZIPファイル形式ではありません。正しいZIPファイルのBase64文字列を入力してください。');
    }

    // Unzip
    return new Promise((resolve, reject) => {
      unzip(bytes, (err, unzipped) => {
        if (err) {
          reject(new Error(`ZIP解凍エラー: ${err.message}`));
          return;
        }

        // Convert to file objects
        const files = {};
        let fileCount = 0;

        for (const [path, content] of Object.entries(unzipped)) {
          // Skip directories
          if (path.endsWith('/')) continue;

          files[path] = {
            path,
            content,
            type: getFileType(path),
            isEditable: isEditableFile(path)
          };
          fileCount++;
        }

        if (fileCount === 0) {
          reject(new Error('ZIPファイルにファイルが含まれていません。'));
          return;
        }

        resolve(files);
      });
    });
  } catch (error) {
    if (error.message.includes('デコード') ||
        error.message.includes('形式') ||
        error.message.includes('解凍') ||
        error.message.includes('無効')) {
      throw error;
    }
    throw new Error(`処理エラー: ${error.message}`);
  }
}

/**
 * Zip và encode base64 để tạo chuỗi output
 */
export async function zipAndEncode(files) {
  try {
    // Validate input
    if (!files || Object.keys(files).length === 0) {
      throw new Error('ファイルがありません。');
    }

    // Prepare files for zipping
    const filesToZip = {};
    for (const [path, fileData] of Object.entries(files)) {
      if (!fileData.content) {
        console.warn(`ファイル ${path} にコンテンツがありません。スキップします。`);
        continue;
      }
      filesToZip[path] = fileData.content;
    }

    if (Object.keys(filesToZip).length === 0) {
      throw new Error('有効なファイルがありません。');
    }

    // Zip files
    return new Promise((resolve, reject) => {
      zip(filesToZip, { level: 6 }, (err, zipped) => {
        if (err) {
          reject(new Error(`ZIP圧縮エラー: ${err.message}`));
          return;
        }

        try {
          // Encode to base64
          let binary = '';
          const bytes = new Uint8Array(zipped);
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);

          resolve(base64);
        } catch (encodeError) {
          reject(new Error(`Base64エンコードエラー: ${encodeError.message}`));
        }
      });
    });
  } catch (error) {
    if (error.message.includes('圧縮') ||
        error.message.includes('エンコード') ||
        error.message.includes('ファイル')) {
      throw error;
    }
    throw new Error(`処理エラー: ${error.message}`);
  }
}

/**
 * Parse XML string to object for easier editing
 */
export function parseXML(xmlString) {
  try {
    if (!xmlString || typeof xmlString !== 'string') {
      throw new Error('XMLデータが無効です。');
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      const errorText = parseError.textContent || 'XML形式が正しくありません。';
      throw new Error(`XMLパースエラー: ${errorText}`);
    }

    return xmlDoc;
  } catch (error) {
    if (error.message.includes('パース') || error.message.includes('無効')) {
      throw error;
    }
    throw new Error(`XML処理エラー: ${error.message}`);
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
