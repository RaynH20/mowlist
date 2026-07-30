-- Add support for "Other" property type description on quote_requests
-- When a customer picks Property Type = "other", they can describe what they mean
ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS property_type_other TEXT;

-- Add a comment explaining when this is used
COMMENT ON COLUMN quote_requests.property_type_other IS
  'Freeform description when property_type = ''other''';
