# AI-Powered Requirements Analysis Tool

## Overview

This project is an AI-powered tool that extracts and classifies requirements from text documents (PDF/TXT). It automates the process of analyzing requirement documents, improving efficiency and consistency in requirement gathering.

## Features

- Upload and analyze requirement documents.
- Extract and classify requirements into predefined categories.
- Supports multi-label classification using NLP models.
- RESTful API for backend processing.
- Frontend built with React for an interactive UI.

## Tech Stack

### Backend:

- **Python** (Flask for REST API)
- **spaCy** (NLP processing)
- **pdfminer.six** (PDF text extraction)
- **Hugging Face Transformers** (BART model for classification)
- **Node.js** (Routing and API handling)

### Frontend:

- **React.js** (UI Framework)
- **Material UI** (UI components)
- **Axios** (API communication)

## Installation

### Prerequisites

- Python 3.x
- Node.js & npm
- Git

### Creating virtual environmnet and installing necessary packages

```sh
New Terminal 1   

python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```
### Backend Setup

```sh
New Terminal 2

venv\Scripts\activate
cd backend
cd ai_service
flask run --host=0.0.0.0 --port=5000
```

### Frontend Setup

```sh
New Terminal 3
cd frontend
npm install
npm start
```

## API Endpoints

### Upload File

`POST /api/upload`

- **Request:** Multipart file upload
- **Response:** JSON with uploaded filename

### Analyze File

`POST /api/analyze`

- **Request:** `{ "filename": "example.pdf" }`
- **Response:** Extracted and classified requirements

## Deployment

- Use **Vercel** for frontend deployment.
- Use **Flask + Gunicorn** for backend hosting.

## Contributing

Feel free to submit pull requests and report issues.

## License

MIT License

