import "./PdfModeModal.css";

function PdfModeModal({

  setMode,
  setPdfView,
  setShowPdfModal

}) {

  function chooseExisting() {

    setMode("pdf");

    setPdfView("chat");

    setShowPdfModal(false);

  }

  function managePdf() {

    setMode("pdf");

    setPdfView("manager");

    setShowPdfModal(false);

  }

  function cancel() {

    setMode("ai");

    setShowPdfModal(false);

  }

  return (

    <div className="modal-overlay">

      <div className="pdf-modal">

        <h2>📄 PDF Tutor</h2>

        <p>
          What would you like to do?
        </p>

        <button
          className="pdf-btn"
          onClick={chooseExisting}
        >
          📂 Choose Existing PDF
        </button>

        <button
          className="pdf-btn"
          onClick={managePdf}
        >
          📤 Upload / Edit PDFs
        </button>

        <button
          className="cancel-btn"
          onClick={cancel}
        >
          Cancel
        </button>

      </div>

    </div>

  );

}

export default PdfModeModal;