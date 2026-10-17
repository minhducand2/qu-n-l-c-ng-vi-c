-- TEAM360 V5.1B: protect directive content during review.
-- Does not modify existing rows or tables.

CREATE TRIGGER IF NOT EXISTS directive_draft_review_lock
BEFORE UPDATE OF title, body, version ON directive_drafts
WHEN EXISTS (
  SELECT 1
  FROM directive_approvals a
  WHERE a.draft_id = OLD.id
    AND a.status IN ('submitted', 'approved')
)
BEGIN
  SELECT RAISE(ABORT, 'DIRECTIVE_REVIEW_LOCKED');
END;
