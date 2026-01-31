-- Update Electrical Engineering template with complete requirements
-- This adds all 8 terms of required courses and detailed elective requirements

UPDATE public.program_templates
SET 
  required_courses = '{
    "1A": ["ECE 105", "ECE 150", "ECE 190", "MATH 115", "MATH 117"],
    "1B": ["ECE 106", "ECE 108", "ECE 124", "ECE 140", "ECE 192", "MATH 119"],
    "2A": ["ECE 200", "ECE 205", "ECE 209", "ECE 240", "MATH 211"],
    "2B": ["ECE 206", "ECE 207", "ECE 242", "ECE 290", "MATH 227"],
    "3A": ["ECE 316", "ECE 318", "ECE 320", "ECE 330", "ECE 350"],
    "3B": ["ECE 380", "ECE 405", "ECE 423"],
    "4A": ["ECE 498A"],
    "4B": ["ECE 498B"]
  }'::jsonb,
  elective_requirements = '{
    "TE": {
      "required": 8,
      "description": "Technical Electives", 
      "rules": {
        "min_from_other_dept": 1,
        "note": "1 must be from another engineering department"
      }
    },
    "CSE": {
      "required": 3,
      "description": "Complementary Studies Electives",
      "rules": {
        "list_c": 2,
        "list_any": 1,
        "note": "2 from List C, 1 from List A/C/D"
      }
    },
    "NSE": {
      "required": 2,
      "description": "Natural Science Electives"
    }
  }'::jsonb
WHERE program_code = 'ECE_ELECTRICAL';

-- Also update Computer Engineering with complete requirements
UPDATE public.program_templates
SET 
  required_courses = '{
    "1A": ["ECE 105", "ECE 150", "ECE 190", "MATH 115", "MATH 117"],
    "1B": ["ECE 106", "ECE 108", "ECE 124", "ECE 140", "ECE 192", "MATH 119"],
    "2A": ["ECE 200", "ECE 205", "ECE 222", "ECE 240", "ECE 250", "MATH 211"],
    "2B": ["ECE 207", "ECE 224", "ECE 252", "ECE 290", "MATH 227"],
    "3A": ["ECE 316", "ECE 318", "ECE 327", "ECE 358", "ECE 380"],
    "3B": ["ECE 356", "ECE 390", "ECE 454"],
    "4A": ["ECE 498A"],
    "4B": ["ECE 498B"]
  }'::jsonb,
  elective_requirements = '{
    "TE": {
      "required": 8,
      "description": "Technical Electives",
      "rules": {
        "min_from_other_dept": 1,
        "note": "1 must be from another engineering department"
      }
    },
    "CSE": {
      "required": 3,
      "description": "Complementary Studies Electives",
      "rules": {
        "list_c": 2,
        "list_any": 1,
        "note": "2 from List C, 1 from List A/C/D"
      }
    },
    "NSE": {
      "required": 2,
      "description": "Natural Science Electives"
    }
  }'::jsonb
WHERE program_code = 'ECE_COMPUTER';
