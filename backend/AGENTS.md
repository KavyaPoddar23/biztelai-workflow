# AI Workflow Document

## AI Tools Used
- **Claude (Anthropic):** Used for architecture planning, code generation, and debugging assistance
- **Groq API - Llama 4 Scout:** Used as the OCR/extraction model for reading handwritten documents

## How AI Was Used During Development

### Planning
- Used Claude to break down the assignment into phases
- Generated the database schema and API endpoint structure

### Code Generation
- Backend FastAPI endpoints generated with AI assistance
- Frontend React components scaffolded using AI
- Validation rules designed with AI suggestions

### Prompting Workflow
The extraction prompt was carefully designed to:
1. Describe the exact document format
2. List all field names and expected formats
3. Request confidence scores per field
4. Enforce strict JSON output format

### Debugging
- Used Claude to debug CORS issues
- Fixed SQLite query errors with AI assistance
- Resolved Groq API model name issues

## Areas Where AI Helped Most
- Generating boilerplate FastAPI and React code quickly
- Writing the extraction prompt for handwritten document parsing
- Designing validation business rules
- SQL query generation for analytics

## Areas Requiring Manual Intervention
- Choosing the right free AI API (Anthropic → Gemini → Groq)
- Configuring Tailwind CSS in Windows PowerShell environment
- Fine-tuning the extraction prompt for handwritten text accuracy
- Testing and verifying extracted data against original images