# Contributing to Secure E-Voting System

Thank you for your interest in contributing to the **Secure E-Voting System with Face Recognition**.

## Code of Conduct
We are committed to providing a welcoming and inspiring community for all. Please treat others with respect and professionalism.

## Getting Started
1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/e-voting-system.git
   cd e-voting-system
   ```
3. Set up the Python virtual environment and install backend dependencies:
   ```bash
   python -m venv backend/venv
   # Windows PowerShell:
   backend\venv\Scripts\Activate.ps1
   pip install -r backend/requirements.txt
   ```
4. Set up the frontend:
   ```bash
   cd frontend
   npm install
   ```

## Development Guidelines
- **Security-First**: Never log passwords, biometric vectors, raw images, session tokens, or election secrets.
- **Atomic Operations**: All vote transactions must enforce duplicate vote prevention through database constraints and atomic writes.
- **Testing**: Add automated unit and integration tests under `backend/tests/` for any new service, repository, or endpoint.
- **Code Style**: Follow PEP 8 for Python and standard ESLint / modern React component conventions for the frontend.

## Pull Request Process
1. Create a feature branch: `git checkout -b feature/your-feature-name`.
2. Ensure all backend tests pass:
   ```bash
   pytest backend/tests -v
   ```
3. Ensure frontend builds cleanly:
   ```bash
   cd frontend && npm run build
   ```
4. Commit your changes with clear, descriptive commit messages.
5. Push to your fork and submit a Pull Request against `main`.
