import spacy
import os
import re
import logging
import werkzeug
import uuid
from flask import Flask, request, jsonify
from pdfminer.high_level import extract_text
from flask_cors import CORS
from transformers import pipeline

app = Flask(__name__)
CORS(app)

# Configure Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Load NLP Model
try:
    nlp = spacy.load("en_core_web_sm")
    logging.info("✅ NLP model loaded successfully")
except Exception as e:
    logging.error(f"❌ Error loading NLP model: {e}")

# Load Zero-Shot Classifier
try:
    classifier = pipeline(
        "zero-shot-classification",
        model="facebook/bart-large-mnli",
        multi_label=True
    )
    logging.info("✅ Zero-shot classification model loaded successfully")
except Exception as e:
    logging.error(f"❌ Error loading zero-shot classification model: {e}")

# Define categories for classification
candidate_labels = ["Functional", "Non-Functional", "UI", "Security", "Performance"]

# Ensure upload directory exists
UPLOAD_DIR = "uploads/"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Storage for analyzed data (Temporary - use a database for production)
analyzed_requirements = []

def extract_text_from_file(file_path):
    """Extract text from PDF or TXT files"""
    if not os.path.exists(file_path):
        logging.error(f"❌ File not found: {file_path}")
        return None

    try:
        if file_path.endswith(".pdf"):
            return extract_text(file_path)
        elif file_path.endswith(".txt"):
            with open(file_path, "r", encoding="utf-8") as file:
                return file.read()
        else:
            logging.error(f"❌ Unsupported file type: {file_path}")
            return None
    except Exception as e:
        logging.error(f"❌ Error extracting text from file: {e}")
        return None

def clean_sentence(sentence):
    """Clean and normalize a sentence for classification."""
    sentence = re.sub(r"[•\t\n]+", " ", sentence)
    sentence = re.sub(r"\s+", " ", sentence).strip()
    return sentence

@app.route("/upload", methods=["POST"])
def upload_file():
    """Upload a file (PDF/TXT)"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    filename = werkzeug.utils.secure_filename(file.filename)
    file.save(os.path.join(UPLOAD_DIR, filename))
    logging.info(f"✅ File Uploaded: {filename}")

    return jsonify({'message': 'File uploaded successfully', 'filename': filename})

@app.route("/analyze", methods=["POST"])
def analyze_file():
    """Analyze the uploaded file and classify requirements"""
    global analyzed_requirements

    try:
        data = request.get_json()
        filename = data.get("filename")
        if not filename:
            return jsonify({"error": "Filename not provided"}), 400

        file_path = os.path.join(UPLOAD_DIR, filename)

        if not os.path.exists(file_path):
            return jsonify({"error": "File not found"}), 404

        text = extract_text_from_file(file_path)
        if not text or text.strip() == "":
            return jsonify({"error": "No valid text found in the file"}), 500

        doc = nlp(text)
        extracted_requirements = []

        for sent in doc.sents:
            cleaned_sentence = clean_sentence(sent.text)
            if not cleaned_sentence or len(cleaned_sentence.split()) < 2:
                continue

            try:
                classification = classifier(
                    cleaned_sentence,
                    candidate_labels,
                    hypothesis_template="This requirement is about {}."
                )

                valid_labels = [
                    label for label, score in zip(classification["labels"], classification["scores"])
                    if score >= 0.4
                ] if "labels" in classification and "scores" in classification else []

                if not valid_labels:
                    valid_labels = ["General"] 

                extracted_requirements.append({
                    "id": str(uuid.uuid4()),
                    "categories": ", ".join(valid_labels),
                    "requirement": cleaned_sentence,
                    "status": "Review"  # Default status
                })
            except Exception as e:
                logging.error(f"❌ Error classifying sentence: {e}")

        analyzed_requirements = extracted_requirements

        return jsonify({
            "requirements": extracted_requirements,
            "total": len(extracted_requirements),
            "approved": len([req for req in extracted_requirements if req.get("status") == "Approved"]),
            "inReview": len([req for req in extracted_requirements if req.get("status") == "Review"])
        })

    except Exception as e:
        logging.error(f"❌ Error analyzing file: {e}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500

@app.route("/stats", methods=["GET"])
def get_stats():
    """Fetch statistics for the dashboard"""
    global analyzed_requirements

    total = len(analyzed_requirements)
    approved = len([req for req in analyzed_requirements if req.get("status") == "Approved"])
    in_review = len([req for req in analyzed_requirements if req.get("status") == "Review"])

    return jsonify({
        "total": total,
        "approved": approved,
        "inReview": in_review
    })

@app.route("/update_status", methods=["POST"])
def update_status():
    global analyzed_requirements

    try:
        data = request.get_json()
        logging.info(f"Received data: {data}")

        requirement_id = data.get("id")
        new_status = data.get("status")

        if not requirement_id or not new_status:
            logging.error("❌ Missing requirement ID or status in request")
            return jsonify({"error": "Missing requirement ID or status"}), 400

        for req in analyzed_requirements:
            if req["id"] == requirement_id:
                req["status"] = new_status
                return jsonify({
                    "message": "Status updated successfully",
                    "total": len(analyzed_requirements),
                    "approved": len([req for req in analyzed_requirements if req.get("status") == "Approved"]),
                    "inReview": len([req for req in analyzed_requirements if req.get("status") == "Review"])
                }), 200

        return jsonify({"error": "Requirement not found"}), 404

    except Exception as e:
        logging.error(f"❌ Error updating requirement status: {e}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500

@app.route("/classify", methods=["POST"])
def classify_requirement():
    global analyzed_requirements

    try:
        data = request.get_json()
        new_requirement = data.get("text")
        if not new_requirement:
            logging.error("❌ Requirement text not provided in request")
            return jsonify({"error": "Requirement text not provided"}), 400

        cleaned_sentence = clean_sentence(new_requirement)
        logging.info(f"Cleaned sentence for classification: '{cleaned_sentence}'")

        try:
            classification = classifier(
                cleaned_sentence,
                candidate_labels,
                hypothesis_template="This requirement is about {}."
            )
            logging.info(f"Classification result: {classification}")

            valid_labels = [
                label for label, score in zip(classification["labels"], classification["scores"])
                if score >= 0.4
            ] if "labels" in classification and "scores" in classification else []

            analyzed_requirements.append({
                "id": str(uuid.uuid4()),
                "categories": ", ".join(valid_labels) if valid_labels else "General",
                "requirement": cleaned_sentence,
                "status": "Review"  # Default status
            })

            return jsonify({
                "category": ", ".join(valid_labels) if valid_labels else "General"
            })

        except Exception as classification_error:
            logging.error(f"❌ Error during classification: {classification_error}", exc_info=True)
            return jsonify({"error": "Classification failed"}), 500

    except Exception as general_error:
        logging.error(f"❌ General error in /classify: {general_error}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)