-- Fix and complete program templates for EE, CE, and add SE
-- This migration updates existing EE and CE templates with complete requirements
-- and adds the Software Engineering program

-- ============================================================================
-- 1. FIX ELECTRICAL ENGINEERING TEMPLATE
-- ============================================================================
UPDATE public.program_templates
SET 
  required_courses = '{
    "1A": ["ECE 105", "ECE 150", "ECE 190", "ECE 198", "MATH 115", "MATH 117"],
    "1B": ["ECE 106", "ECE 108", "ECE 124", "ECE 140", "ECE 192", "MATH 119"],
    "2A": ["ECE 109", "ECE 204", "ECE 222", "ECE 240", "ECE 250", "MATH 211"],
    "2B": ["ECE 203", "ECE 207", "ECE 231", "ECE 260", "ECE 298", "MATH 212"],
    "3A": ["ECE 318", "ECE 340", "ECE 375", "ECE 380"],
    "3B": ["ECE 307"],
    "4A": ["ECE 498A"],
    "4B": ["ECE 498B"]
  }'::jsonb,
  elective_requirements = '{
    "TE": {
      "required": 8,
      "description": "Technical Electives",
      "rules": {
        "list_1": 2,
        "list_1_or_2": 1,
        "list_3": 3,
        "list_4_or_5": 2,
        "min_from_other_dept": 1,
        "note": "At least 1-2 TEs must be from other engineering dept (not CE or EE). 2 from List 1, 1 from List 1 or 2, 3 from List 3, 2 from List 4 or 5."
      }
    },
    "CSE": {
      "required": 3,
      "description": "Complementary Studies Electives",
      "rules": {
        "list_c": 2,
        "list_acd": 1,
        "note": "2 from List C, 1 from List A, C, or D"
      }
    },
    "NSE": {
      "required": 2,
      "description": "Natural Science Electives",
      "rules": {
        "note": "2 lecture courses from Natural Science list"
      }
    },
    "ETHICS": {
      "required": 1,
      "description": "Ethics Requirement",
      "rules": {
        "note": "1 course from Ethics list"
      }
    },
    "COMM": {
      "required": 1,
      "description": "Communication Course (1A)",
      "rules": {
        "options": ["COMMST 192", "ENGL 192"],
        "note": "Choose 1 in 1A term"
      }
    }
  }'::jsonb,
  minimum_units = 21.25
WHERE program_code = 'ECE_ELECTRICAL';

-- ============================================================================
-- 2. FIX COMPUTER ENGINEERING TEMPLATE
-- ============================================================================
UPDATE public.program_templates
SET 
  required_courses = '{
    "1A": ["ECE 105", "ECE 150", "ECE 190", "ECE 198", "MATH 115", "MATH 117"],
    "1B": ["ECE 106", "ECE 108", "ECE 124", "ECE 140", "ECE 192", "MATH 119"],
    "2A": ["ECE 109", "ECE 204", "ECE 222", "ECE 240", "ECE 250", "MATH 211"],
    "2B": ["ECE 203", "ECE 207", "ECE 208", "ECE 224", "ECE 252", "ECE 298"],
    "3A": ["ECE 318", "ECE 327", "ECE 350", "ECE 380"],
    "3B": ["ECE 307"],
    "4A": ["ECE 498A"],
    "4B": ["ECE 498B"]
  }'::jsonb,
  elective_requirements = '{
    "TE": {
      "required": 8,
      "description": "Technical Electives",
      "rules": {
        "list_1": 2,
        "list_1_or_2": 1,
        "list_3": 3,
        "list_4_or_5": 2,
        "min_from_other_dept": 1,
        "note": "At least 1-2 TEs must be from other engineering dept (not CE or EE). 2 from List 1, 1 from List 1 or 2, 3 from List 3, 2 from List 4 or 5."
      }
    },
    "CSE": {
      "required": 3,
      "description": "Complementary Studies Electives",
      "rules": {
        "list_c": 2,
        "list_acd": 1,
        "note": "2 from List C, 1 from List A, C, or D"
      }
    },
    "NSE": {
      "required": 2,
      "description": "Natural Science Electives",
      "rules": {
        "note": "2 lecture courses from Natural Science list"
      }
    },
    "ETHICS": {
      "required": 1,
      "description": "Ethics Requirement",
      "rules": {
        "note": "1 course from Ethics list"
      }
    },
    "COMM": {
      "required": 1,
      "description": "Communication Course (1A)",
      "rules": {
        "options": ["COMMST 192", "ENGL 192"],
        "note": "Choose 1 in 1A term"
      }
    }
  }'::jsonb,
  minimum_units = 21.25
WHERE program_code = 'ECE_COMPUTER';

-- ============================================================================
-- 3. ADD SOFTWARE ENGINEERING TEMPLATE
-- ============================================================================
INSERT INTO public.program_templates (
  program_code, 
  program_name, 
  description, 
  degree_type, 
  required_courses, 
  elective_requirements,
  minimum_units
) VALUES (
  'SE',
  'Software Engineering',
  'Software Engineering program at the University of Waterloo',
  'BSE',
  '{
    "1A": ["CS 137", "CHE 102", "MATH 115", "MATH 117", "MATH 135", "SE 101"],
    "1B": ["CS 138", "ECE 124", "ECE 140", "ECE 192", "MATH 119", "SE 102"],
    "2A": ["CS 241", "ECE 222", "SE 201", "SE 212", "STAT 206"],
    "2B": ["CS 240", "CS 247", "CS 348", "MATH 239", "SE 202"],
    "3A": ["CS 341", "MATH 213", "SE 301", "SE 350", "SE 464", "SE 465"],
    "3B": ["CS 343", "ECE 358", "SE 302", "SE 380", "SE 463"],
    "4A": ["SE 401"],
    "4B": ["SE 402"]
  }'::jsonb,
  '{
    "CSE": {
      "required": 2,
      "description": "Complementary Studies Electives",
      "rules": {
        "list_a": 1,
        "list_c": 1,
        "note": "1 from List A, 1 from List C"
      }
    },
    "NSE": {
      "required": 3,
      "description": "Natural Science Electives",
      "rules": {
        "note": "3 lecture courses from Natural Science list"
      }
    },
    "TE": {
      "required": 4,
      "description": "Technical Electives",
      "rules": {
        "minimum": 2,
        "note": "Min 4 TEs from Lists 1-3. At least 2 additional courses from List 1, 2, or 3."
      }
    },
    "FREE": {
      "required": 2,
      "description": "Free Electives",
      "rules": {
        "note": "2 electives from any 0.5-unit courses"
      }
    },
    "COMM": {
      "required": 1,
      "description": "Communication Requirement",
      "rules": {
        "deadline": "3A",
        "note": "Must complete before 3A term"
      }
    },
    "DESIGN": {
      "required": 2,
      "description": "Design Project",
      "rules": {
        "4A": ["GENE 403", "SE 490"],
        "4B": ["GENE 404", "SE 491"],
        "note": "Choose 1 option in 4A and corresponding option in 4B"
      }
    },
    "PHYSICS": {
      "required": 1,
      "description": "Physics Requirement (2A)",
      "rules": {
        "options": ["ECE 105", "PHYS 115", "PHYS 121"],
        "note": "Choose 1 in 2A term"
      }
    },
    "UI": {
      "required": 1,
      "description": "User Interface Course (3B)",
      "rules": {
        "options": ["CS 349", "CS 449", "MSE 343"],
        "note": "Choose 1 in 3B term"
      }
    },
    "SUSTAINABILITY": {
      "required": 1,
      "description": "Sustainability Course",
      "rules": {
        "note": "1 sustainability-related course (can overlap with NSE/CSE)"
      }
    }
  }'::jsonb,
  21.50
)
ON CONFLICT (program_code) DO UPDATE SET
  program_name = EXCLUDED.program_name,
  description = EXCLUDED.description,
  degree_type = EXCLUDED.degree_type,
  required_courses = EXCLUDED.required_courses,
  elective_requirements = EXCLUDED.elective_requirements,
  minimum_units = EXCLUDED.minimum_units,
  updated_at = now();

-- ============================================================================
-- 4. ADD HELPFUL COMMENTS
-- ============================================================================
COMMENT ON TABLE public.program_templates IS 
'Stores program requirements for each engineering major. required_courses contains term-by-term required courses, elective_requirements contains elective rules.';

COMMENT ON COLUMN public.program_templates.required_courses IS 
'JSONB object with term labels as keys (e.g. "1A", "2B") and arrays of course codes as values';

COMMENT ON COLUMN public.program_templates.elective_requirements IS 
'JSONB object with elective type as keys (TE, CSE, NSE, etc.) containing required counts and rules';

COMMENT ON COLUMN public.program_templates.minimum_units IS 
'Minimum units required for graduation (excluding COOP and PD courses)';
