import { useState, useEffect } from "react";
import axios from "axios";
import {
  FaUpload,
  FaSearch,
  FaEye,
  FaTrash,
  FaEdit,
  FaSyncAlt,
  FaFilePdf
} from "react-icons/fa";

import "./PdfManager.css";

function PdfManager({ pdfs, loadPDFs }) {

  const [search, setSearch] = useState("");

  

  // TEMPORARY
  async function uploadPDF(e) {

    const file = e.target.files[0];

    if (!file) return;

    const formData = new FormData();

    formData.append("file", file);

    try {

        await axios.post(
            "http://localhost:8000/upload-pdf",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            }
        );

        alert("PDF uploaded successfully.");

        loadPDFs();

    } catch (err) {

        console.log(err);

        alert("Upload failed.");

    }

}

  async function deletePDF(name) {

    const confirmDelete = window.confirm(
        "Delete this PDF?"
    );

    if (!confirmDelete) return;

    try {

        await axios.delete(

            `http://localhost:8000/delete-pdf/${name}`

        );

        alert("PDF deleted successfully.");

        loadPDFs();

    }

    catch (err) {

        console.log(err);

        alert("Delete failed.");

    }

}

  async function renamePDF(oldName) {

    const newName = prompt(
        "Enter new PDF name",
        oldName.replace(".pdf", "")
    );

    if (!newName) return;

    try {

        await axios.put(

            "http://localhost:8000/rename-pdf",

            {

                old_name: oldName,

                new_name: newName

            }

        );

        alert("PDF renamed successfully.");

        loadPDFs();

    }

    catch (err) {

        console.log(err);

        alert("Rename failed.");

    }

}

  async function replacePDF(oldName) {

    const input = document.createElement("input");

    input.type = "file";

    input.accept = ".pdf";

    input.onchange = async (e) => {

        const file = e.target.files[0];

        if (!file) return;

        const formData = new FormData();

        formData.append("file", file);

        try {

            await axios.put(

                `http://localhost:8000/replace-pdf/${oldName}`,

                formData,

                {

                    headers: {

                        "Content-Type": "multipart/form-data"

                    }

                }

            );

            alert("PDF replaced successfully.");

            loadPDFs();

        }

        catch (err) {

            console.log(err);

            alert("Replacement failed.");

        }

    };

    input.click();

}

  function viewPDF(pdf) {

    window.open(

        `http://localhost:8000/uploads/${pdf.name}`,

        "_blank"

    );

}

  const filtered = pdfs.filter(pdf =>
    pdf.name.toLowerCase().includes(search.toLowerCase())
  );

  return (

    <div className="pdf-page">

      <h1>📚 Study Material Manager</h1>

      <p className="subtitle">
        Manage all your uploaded PDFs
      </p>

      <div className="stats">

        <div className="stat-card">

          <h2>{pdfs.length}</h2>

          <span>Total PDFs</span>

        </div>

        <div className="stat-card">

          <h2>

            {pdfs
              .reduce((sum, pdf) => sum + Number(pdf.size || 0), 0)
              .toFixed(2)} MB

          </h2>

          <span>Storage Used</span>

        </div>

      </div>

      <label className="upload-box">

        <FaUpload size={28} />

        <h2>Upload PDF</h2>

        <p>Select a PDF from your computer</p>

        <input
          type="file"
          accept=".pdf"
          hidden
          onChange={uploadPDF}
        />

      </label>

      <div className="search-box">

        <FaSearch />

        <input
          placeholder="Search PDF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

      </div>

      <div className="pdf-list">

        {filtered.map((pdf) => (

          <div
            key={pdf.name}
            className="pdf-card"
          >

            <div className="pdf-info">

              <FaFilePdf className="pdf-icon" />

              <div>

                <h3>{pdf.name}</h3>

                <p>

                  {Number(pdf.size).toFixed(2)} MB • {pdf.date}

                </p>

              </div>

            </div>

            <div className="actions">

              <button onClick={() => viewPDF(pdf)}>
                <FaEye />
              </button>

              <button onClick={() => renamePDF(pdf.name)}>
                <FaEdit />
              </button>

              <button onClick={() => replacePDF(pdf.name)}>
                <FaSyncAlt />
              </button>

              <button
                className="delete"
                onClick={() => deletePDF(pdf.name)}
              >
                <FaTrash />
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}

export default PdfManager;