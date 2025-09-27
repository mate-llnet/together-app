-- Migration: Convert existing couples to relationship groups
-- This preserves all existing relationship data

-- First, check if there are any couples to migrate
DO $$
DECLARE
    couple_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO couple_count FROM couples;

    IF couple_count > 0 THEN
        RAISE NOTICE 'Migrating % couples to relationship groups...', couple_count;

        -- Create relationship groups from existing couples
        INSERT INTO relationship_groups (name, type, description, created_by, created_at)
        SELECT
            COALESCE(
                CONCAT(u1.name, ' & ', u2.name),
                'My Relationship'
            ) as name,
            'romantic' as type,
            'Migrated from couples system' as description,
            couples.user1_id as created_by,
            couples.created_at
        FROM couples
        JOIN users u1 ON couples.user1_id = u1.id
        LEFT JOIN users u2 ON couples.user2_id = u2.id;

        -- Create memberships for user1 (creator)
        INSERT INTO relationship_memberships (user_id, group_id, role, status, joined_at)
        SELECT
            couples.user1_id,
            rg.id,
            'partner',
            CASE
                WHEN couples.connection_status = 'connected' THEN 'active'
                ELSE 'pending'
            END,
            couples.created_at
        FROM couples
        JOIN relationship_groups rg ON rg.created_by = couples.user1_id
        WHERE rg.type = 'romantic';

        -- Create memberships for user2 (if user exists)
        INSERT INTO relationship_memberships (user_id, group_id, role, status, joined_at)
        SELECT
            couples.user2_id,
            rg.id,
            'partner',
            CASE
                WHEN couples.connection_status = 'connected' THEN 'active'
                ELSE 'pending'
            END,
            couples.created_at
        FROM couples
        JOIN relationship_groups rg ON rg.created_by = couples.user1_id
        JOIN users u2 ON couples.user2_id = u2.id
        WHERE rg.type = 'romantic';

        -- Create invitations for pending connections where user2 doesn't exist yet
        INSERT INTO relationship_invitations (group_id, inviter_id, email, role, status, created_at)
        SELECT
            rg.id,
            couples.user1_id,
            u2.email,
            'partner',
            'pending',
            couples.created_at
        FROM couples
        JOIN relationship_groups rg ON rg.created_by = couples.user1_id
        LEFT JOIN users u2 ON couples.user2_id = u2.id
        WHERE rg.type = 'romantic'
        AND couples.connection_status = 'pending'
        AND u2.id IS NOT NULL;

        RAISE NOTICE 'Migration completed successfully!';
    ELSE
        RAISE NOTICE 'No couples found to migrate.';
    END IF;
END $$;