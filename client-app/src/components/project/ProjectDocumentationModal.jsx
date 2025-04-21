import React, { useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../../styles/project-documentation.css';
import { pdfExporter } from 'quill-to-pdf';
import { saveAs } from 'file-saver';

const ProjectDocumentationModal = ({ isOpen, onClose, documentation, onSave }) => {
  const [content, setContent] = useState(documentation || '');
  const [isEditing, setIsEditing] = useState(false);
  const quillRef = useRef(null);

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setContent(e.target.result);
      };
      reader.readAsText(file);
    } else {
      alert('Please select a .txt file.');
    }
  };

  const handleExportTxt = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project_documentation.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    const editor = quillRef.current.getEditor();
    const delta = editor.getContents();
    const blob = await pdfExporter.generatePdf(delta);
    saveAs(blob, 'project_documentation.pdf');
  };

  const handleSave = () => {
    onSave(content);
    setIsEditing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="project-doc-modal-overlay">
      <div className="project-doc-modal-content">
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <h3 style={{ color: 'black' }}>Project Documentation</h3>

        <div className="button-container">
          <button
            style={{ marginRight: '10px' }}
            onClick={() => document.getElementById('import-file').click()}
          >
            Import
          </button>
          <input
            type="file"
            id="import-file"
            style={{ display: 'none' }}
            onChange={handleImport}
            accept=".txt"
          />
          <button style={{ marginRight: '10px' }} onClick={handleExportTxt}>
            Export as TXT
          </button>
          <button style={{ marginRight: '10px' }} onClick={handleExportPdf}>
            Export as PDF
          </button>
          <button style={{ marginRight: '10px' }} onClick={() => setIsEditing((prev) => !prev)}>
            {isEditing ? 'Finish Editing' : 'Edit'}
          </button>
          {isEditing && (
            <button style={{ marginRight: '10px' }} onClick={handleSave}>
              Save
            </button>
          )}
        </div>

        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={content}
          onChange={setContent}
          readOnly={!isEditing}
          style={{
            height: '70%',
            marginBottom: '20px',
            backgroundColor: isEditing ? 'white' : '#f0f0f0',
          }}
        />
      </div>
    </div>
  );
};

export default ProjectDocumentationModal;
