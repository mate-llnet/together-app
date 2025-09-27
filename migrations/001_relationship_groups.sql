-- Migration: Add flexible relationship system
-- Replaces rigid "couples" table with multi-person relationship groups

-- Main relationship groups table
CREATE TABLE relationship_groups (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- "Smith Family", "Apartment 4B", "Our Relationship"
    type TEXT NOT NULL CHECK (type IN ('romantic', 'family', 'roommates', 'friends', 'work_team', 'other')),
    description TEXT,
    avatar_url TEXT, -- Group photo/icon
    settings JSON DEFAULT '{}', -- Group-specific settings (privacy, notifications, etc.)
    created_by VARCHAR NOT NULL REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Many-to-many memberships
CREATE TABLE relationship_memberships (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    group_id VARCHAR NOT NULL REFERENCES relationship_groups(id),
    role TEXT NOT NULL, -- 'partner', 'parent', 'child', 'roommate', 'friend', 'colleague', 'admin'
    status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'inactive', 'left')),
    permissions JSON DEFAULT '{}', -- Member-specific permissions
    joined_at TIMESTAMP DEFAULT NOW(),
    left_at TIMESTAMP,
    UNIQUE(user_id, group_id)
);

-- Invitation system
CREATE TABLE relationship_invitations (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id VARCHAR NOT NULL REFERENCES relationship_groups(id),
    inviter_id VARCHAR NOT NULL REFERENCES users(id),
    email TEXT NOT NULL,
    name TEXT, -- Optional: name of person being invited
    role TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
    token VARCHAR UNIQUE DEFAULT gen_random_uuid(), -- For invitation links
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_relationship_groups_type ON relationship_groups(type);
CREATE INDEX idx_relationship_groups_created_by ON relationship_groups(created_by);
CREATE INDEX idx_relationship_memberships_user ON relationship_memberships(user_id);
CREATE INDEX idx_relationship_memberships_group ON relationship_memberships(group_id);
CREATE INDEX idx_relationship_memberships_status ON relationship_memberships(status);
CREATE INDEX idx_relationship_invitations_email ON relationship_invitations(email);
CREATE INDEX idx_relationship_invitations_token ON relationship_invitations(token);
CREATE INDEX idx_relationship_invitations_status ON relationship_invitations(status);

-- Update function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_relationship_groups_updated_at BEFORE UPDATE ON relationship_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();