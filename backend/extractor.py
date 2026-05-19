import base64
import json
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def encode_image(file_path: str) -> tuple:
    """Convert image to base64"""
    with open(file_path, "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")
    
    ext = file_path.split(".")[-1].lower()
    media_types = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "pdf": "application/pdf"
    }
    media_type = media_types.get(ext, "image/jpeg")
    return data, media_type


def extract_data_from_image(file_path: str) -> dict:
    """Send image to Groq and extract structured data"""

    image_data, media_type = encode_image(file_path)

    prompt = """You are an AI assistant that extracts data from handwritten machine shop log sheets.

This image contains a table called "Machine shop data" with these columns:
- S.No (row number)
- Date (format: DD/MM/YY e.g. 20/4/26)
- Shift (written as I, II, III or 1, 2, 3)
- Emp. No (Employee Number, format: BT followed by 4 digits, e.g. BT4710)
- Opn Code (Operation Code, 6 digit number, e.g. 856430)
- Machine No (format: MC-XXX where XXX is 3 digits, e.g. MC-730)
- Work Order No (6-7 digit number, e.g. 165460)
- Qty. Prod. (Quantity Produced, a number. If written as dash or blank, use null)
- Time taken in hrs (decimal number like 4.0, 7.5)

Extract ONLY rows that have data. Skip empty rows.

For each field give a confidence score between 0 and 1:
- 1.0 = very clearly readable
- 0.7-0.9 = mostly readable
- 0.4-0.6 = uncertain
- 0.0-0.3 = very unclear

Return ONLY valid JSON, no markdown, no extra text, no explanation.

Format exactly like this:
{
  "rows": [
    {
      "sno": 1,
      "date": "20/4/26",
      "shift": "I",
      "emp_no": "BT4710",
      "opn_code": "856430",
      "machine_no": "MC-730",
      "work_order_no": "165460",
      "qty_produced": "25",
      "time_taken": "4.0",
      "confidence": {
        "date": 0.95,
        "shift": 0.99,
        "emp_no": 0.90,
        "opn_code": 0.85,
        "machine_no": 0.95,
        "work_order_no": 0.80,
        "qty_produced": 0.99,
        "time_taken": 0.99
      }
    }
  ]
}"""

    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{media_type};base64,{image_data}"
                            }
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ],
            max_tokens=2000,
            temperature=0.1
        )

        response_text = response.choices[0].message.content.strip()

        # Clean markdown if present
        if "```" in response_text:
            parts = response_text.split("```")
            for part in parts:
                if "{" in part:
                    response_text = part
                    if response_text.startswith("json"):
                        response_text = response_text[4:]
                    break
        response_text = response_text.strip()

        extracted = json.loads(response_text)

        return {
            "success": True,
            "rows": extracted.get("rows", []),
            "total_rows": len(extracted.get("rows", []))
        }

    except json.JSONDecodeError as e:
        return {
            "success": False,
            "error": f"Failed to parse AI response: {str(e)}",
            "rows": []
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Extraction failed: {str(e)}",
            "rows": []
        }