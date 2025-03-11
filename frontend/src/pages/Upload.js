import React, { useState } from "react";
import axios from "axios";

const Upload = () => {
    const [file, setFile] = useState(null);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file first.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await axios.post("http://localhost:5000/upload", formData);
            const uploadedFilename = response.data.filename;

            // Store the filename for analysis later
            localStorage.setItem("uploadedFilename", uploadedFilename);
            setSuccessMessage("File uploaded successfully. Go to Dashboard to analyze.");

        } catch (err) {
            setError("Upload failed. Please try again.");
        }
    };

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            <h2>Upload Requirement Document</h2>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload</button>

            {error && <p style={{ color: "red" }}>{error}</p>}
            {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
        </div>
    );
};

export default Upload;
