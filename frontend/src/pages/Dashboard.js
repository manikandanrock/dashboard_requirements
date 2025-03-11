import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiPlus, FiUpload } from "react-icons/fi";
import { AiOutlineCheckCircle, AiOutlineSearch } from "react-icons/ai";
import { BsList } from "react-icons/bs";
import "bootstrap/dist/css/bootstrap.min.css";

const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, approved: 0, inReview: 0 });
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requirements, setRequirements] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [newRequirement, setNewRequirement] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/stats");
      setStats(res.data || { total: 0, approved: 0, inReview: 0 });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleFileChange = (event) => {
    if (event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setLoading(true);
      const response = await axios.post("http://localhost:5000/upload", formData);
      if (response.data.filename) {
        await analyzeFile(response.data.filename);
        fetchStats();
      } else {
        alert("File upload failed.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("An error occurred while uploading the file.");
    } finally {
      setLoading(false);
      setSelectedFile(null); // Reset file selection
    }
  };

  const analyzeFile = async (filename) => {
    try {
      setLoading(true);
      const response = await axios.post("http://localhost:5000/analyze", { filename });
      setRequirements(response.data.requirements || []);
    } catch (error) {
      console.error("Error analyzing file:", error);
      alert("An error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  const updateRequirementStatus = async (index, newStatus) => {
    try {
      const requirement = requirements[index];
      if (!requirement || !requirement.id) return;

      setRequirements((prevRequirements) => {
        const updated = [...prevRequirements];
        updated[index] = { ...updated[index], status: newStatus };
        return updated;
      });

      await axios.post("http://localhost:5000/update_status", {
        id: requirement.id,
        status: newStatus,
      });

      fetchStats();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update requirement status.");
    }
  };

  const handleNewRequirementClick = () => {
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setNewRequirement("");
  };

  const handleInputChange = (event) => {
    setNewRequirement(event.target.value);
  };

  const handleAddRequirement = async () => {
    try {
      const response = await axios.post("http://localhost:5000/classify", { text: newRequirement });

      const classifiedRequirement = {
        id: Date.now().toString(), // Generate a unique ID (replace if you have a better way)
        categories: response.data.category,
        requirement: newRequirement,
        status: "Review", // Changed from "Pending" to "Review"
      };

      setRequirements([...requirements, classifiedRequirement]);
      handleClosePopup();
      fetchStats();
    } catch (error) {
      console.error("Error classifying requirement:", error);
      alert("Failed to classify new requirement.");
    }
  };

  return (
    <div className="container mt-4">
      <h2>Requirements Dashboard</h2>
      <p className="text-muted">Manage and track all your project requirements</p>

      <div className="d-flex gap-3 mb-4">
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleNewRequirementClick}>
          <FiPlus /> New Requirement
        </button>

        <label className="btn btn-secondary d-flex align-items-center gap-2">
          <FiUpload /> Import
          <input type="file" hidden onChange={handleFileChange} />
        </label>

        <button className="btn btn-success" onClick={handleUpload} disabled={loading || !selectedFile}>
          {loading ? "Processing..." : "Upload & Analyze"}
        </button>
      </div>

      <div className="row">
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted">Total Requirements</p>
                <h3 className="fw-bold">{stats.total}</h3>
              </div>
              <BsList className="text-primary fs-1" />
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted">Approved</p>
                <h3 className="fw-bold">{stats.approved}</h3>
              </div>
              <AiOutlineCheckCircle className="text-success fs-1" />
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted">In Review</p>
                <h3 className="fw-bold">{stats.inReview}</h3>
              </div>
              <AiOutlineSearch className="text-warning fs-1" />
            </div>
          </div>
        </div>
      </div>

      {!loading && requirements.length > 0 && (
        <div className="mt-4">
          <h3>Extracted Requirements:</h3>
          <table className="table table-bordered table-hover">
            <thead className="table-dark">
              <tr>
                <th>Category</th>
                <th>Requirement</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requirements.map((req, index) =>
                req.requirement?.trim() !== "" ? (
                  <tr key={index}>
                    <td>
                      {(req.categories || "").split(", ").map((category, i) => (
                        <span key={i} className="badge bg-secondary me-2">{category}</span>
                      ))}
                    </td>
                    <td>{req.requirement}</td>
                    <td>
                      <span className={`badge ${req.status === "Approved" ? "bg-success" : req.status === "Review" ? "bg-warning" : "bg-danger"}`}>
                        {req.status || "Review"} {/* Changed from "Pending" to "Review" */}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-success btn-sm me-1" onClick={() => updateRequirementStatus(index, "Approved")}>✅ Approve</button>
                      <button className="btn btn-warning btn-sm me-1" onClick={() => updateRequirementStatus(index, "Review")}>⏳ Review</button> {/* Changed from "Pending" to "Review" */}
                      <button className="btn btn-danger btn-sm" onClick={() => updateRequirementStatus(index, "Disapproved")}>❌ Disapprove</button>
                    </td>
                  </tr>
                ) : null
              )}
            </tbody>
          </table>
        </div>
      )}

      {loading && (
        <div className="mt-3 text-center">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-warning">Analyzing... Please wait</p>
        </div>
      )}

      {showPopup && (
        <div className="modal" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Requirement</h5>
                <button type="button" className="btn-close" onClick={handleClosePopup}></button>
              </div>
              <div className="modal-body">
                <textarea
                  className="form-control"
                  value={newRequirement}
                  onChange={handleInputChange}
                  placeholder="Enter your requirement here..."
                  rows="4"
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={handleAddRequirement}>Add</button>
                <button className="btn btn-secondary" onClick={handleClosePopup}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;