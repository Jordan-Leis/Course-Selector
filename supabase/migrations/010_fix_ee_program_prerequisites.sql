-- Fix EE program template prerequisites
-- Add missing ECE 205 and ECE 206 courses that are required for prerequisite chains

UPDATE public.program_templates
SET required_courses = '{
  "1A": ["ECE 105", "ECE 150", "ECE 190", "ECE 198", "MATH 115", "MATH 117"],
  "1B": ["ECE 106", "ECE 108", "ECE 124", "ECE 140", "ECE 192", "MATH 119"],
  "2A": ["ECE 109", "ECE 204", "ECE 205", "ECE 222", "ECE 240", "ECE 250", "MATH 211"],
  "2B": ["ECE 203", "ECE 206", "ECE 207", "ECE 231", "ECE 260", "ECE 298", "MATH 212"],
  "3A": ["ECE 318", "ECE 340", "ECE 375", "ECE 380"],
  "3B": ["ECE 307"],
  "4A": ["ECE 498A"],
  "4B": ["ECE 498B"]
}'::jsonb
WHERE program_code = 'ECE_ELECTRICAL';

COMMENT ON UPDATE IS 'Added ECE 205 (2A) and ECE 206 (2B) which are required for prerequisite chains';
