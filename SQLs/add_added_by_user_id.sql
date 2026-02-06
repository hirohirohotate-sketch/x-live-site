-- Add added_by_user_id column to broadcasts table
-- This tracks which user first added each broadcast

-- Add column (nullable for backward compatibility with existing data)
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS added_by_user_id uuid NULL;

-- Add index for performance when querying user's broadcasts
CREATE INDEX IF NOT EXISTS idx_broadcasts_added_by_user ON broadcasts(added_by_user_id);

-- Add comment for documentation
COMMENT ON COLUMN broadcasts.added_by_user_id IS 'User who first added this broadcast (NULL for legacy data or unclaimed broadcasts)';
