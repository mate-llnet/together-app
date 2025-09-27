import type { Express, Request, Response } from "express";
import { db } from '../storage';
import { relationshipGroups, relationshipMemberships, relationshipInvitations, users } from '../../shared/schema';
import { eq, and, or } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth } from '../routes';

export function registerRelationshipRoutes(app: Express) {
  // Get user's relationship groups
  app.get('/api/relationships/my-groups', requireAuth, async (req: Request, res: Response) => {
    const userId = req.session.userId!;

    try {
      const groups = await db
        .select({
          id: relationshipGroups.id,
          name: relationshipGroups.name,
          type: relationshipGroups.type,
          description: relationshipGroups.description,
          avatarUrl: relationshipGroups.avatarUrl,
          settings: relationshipGroups.settings,
          isActive: relationshipGroups.isActive,
          createdAt: relationshipGroups.createdAt,
          role: relationshipMemberships.role,
          status: relationshipMemberships.status,
          memberCount: relationshipMemberships.id // Will be aggregated later
        })
        .from(relationshipGroups)
        .innerJoin(relationshipMemberships, eq(relationshipGroups.id, relationshipMemberships.groupId))
        .where(and(
          eq(relationshipMemberships.userId, userId),
          eq(relationshipMemberships.status, 'active'),
          eq(relationshipGroups.isActive, true)
        ));

      return res.json({ groups });
    } catch (error) {
      console.error('Error fetching user groups:', error);
      return res.status(500).json({ error: 'Failed to fetch groups' });
    }
  });

  // Get specific group details with members
  app.get('/api/relationships/:groupId', requireAuth, async (req: Request, res: Response) => {
    const userId = req.session.userId!;
    const groupId = req.params.groupId;

    try {
      // Check if user is member of this group
      const membership = await db
        .select()
        .from(relationshipMemberships)
        .where(and(
          eq(relationshipMemberships.userId, userId),
          eq(relationshipMemberships.groupId, groupId),
          eq(relationshipMemberships.status, 'active')
        ))
        .limit(1);

      if (membership.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get group details
      const group = await db
        .select()
        .from(relationshipGroups)
        .where(eq(relationshipGroups.id, groupId))
        .limit(1);

      if (group.length === 0) {
        return res.status(404).json({ error: 'Group not found' });
      }

      // Get all members
      const members = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatar,
          role: relationshipMemberships.role,
          status: relationshipMemberships.status,
          joinedAt: relationshipMemberships.joinedAt
        })
        .from(relationshipMemberships)
        .innerJoin(users, eq(relationshipMemberships.userId, users.id))
        .where(eq(relationshipMemberships.groupId, groupId));

      return res.json({
        group: group[0],
        members,
        userRole: membership[0].role
      });
    } catch (error) {
      console.error('Error fetching group details:', error);
      return res.status(500).json({ error: 'Failed to fetch group details' });
    }
  });

  // Create new relationship group
  const createGroupSchema = z.object({
    name: z.string().min(1).max(100),
    type: z.enum(['romantic', 'family', 'roommates', 'friends', 'work_team', 'other']),
    description: z.string().optional(),
    avatarUrl: z.string().url().optional(),
    settings: z.record(z.any()).optional()
  });

  app.post('/api/relationships/create', requireAuth, async (req: Request, res: Response) => {
    const userId = req.session.userId!;

    try {
      console.log('Creating group with data:', req.body);
      const validatedData = createGroupSchema.parse(req.body);
      console.log('Validation passed, creating group for user:', userId);

      // Create group
      const [newGroup] = await db
        .insert(relationshipGroups)
        .values({
          name: validatedData.name,
          type: validatedData.type,
          description: validatedData.description,
          avatarUrl: validatedData.avatarUrl,
          settings: JSON.stringify(validatedData.settings || {}),
          createdBy: userId
        })
        .returning();

      console.log('Group created:', newGroup);

      // Add creator as admin member
      await db
        .insert(relationshipMemberships)
        .values({
          userId: userId,
          groupId: newGroup.id,
          role: 'admin',
          status: 'active'
        });

      console.log('Membership created for user:', userId);

      return res.status(201).json({ group: newGroup });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors);
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      console.error('Error creating group:', error);
      return res.status(500).json({ error: 'Failed to create group' });
    }
  });

  // Invite user to group
  const inviteSchema = z.object({
    email: z.string().email(),
    name: z.string().optional(),
    role: z.string().min(1),
    message: z.string().optional()
  });

  app.post('/api/relationships/:groupId/invite', requireAuth, async (req: Request, res: Response) => {
    const userId = req.session.userId!;
    const groupId = req.params.groupId;

    try {
      const validatedData = inviteSchema.parse(req.body);

      // Check if user can invite (is admin or has permission)
      const membership = await db
        .select()
        .from(relationshipMemberships)
        .where(and(
          eq(relationshipMemberships.userId, userId),
          eq(relationshipMemberships.groupId, groupId),
          eq(relationshipMemberships.status, 'active')
        ))
        .limit(1);

      if (membership.length === 0 || (membership[0].role !== 'admin' && membership[0].role !== 'partner')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      // Check if user already exists and is already in group
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, validatedData.email))
        .limit(1);

      if (existingUser.length > 0) {
        const existingMembership = await db
          .select()
          .from(relationshipMemberships)
          .where(and(
            eq(relationshipMemberships.userId, existingUser[0].id),
            eq(relationshipMemberships.groupId, groupId)
          ))
          .limit(1);

        if (existingMembership.length > 0) {
          return res.status(400).json({ error: 'User is already a member of this group' });
        }
      }

      // Check for existing pending invitation
      const existingInvitation = await db
        .select()
        .from(relationshipInvitations)
        .where(and(
          eq(relationshipInvitations.groupId, groupId),
          eq(relationshipInvitations.email, validatedData.email),
          eq(relationshipInvitations.status, 'pending')
        ))
        .limit(1);

      if (existingInvitation.length > 0) {
        return res.status(400).json({ error: 'Invitation already pending for this email' });
      }

      // Create invitation
      const [invitation] = await db
        .insert(relationshipInvitations)
        .values({
          groupId: groupId,
          inviterId: userId,
          email: validatedData.email,
          name: validatedData.name,
          role: validatedData.role,
          message: validatedData.message
        })
        .returning();

      return res.status(201).json({ invitation });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      console.error('Error creating invitation:', error);
      return res.status(500).json({ error: 'Failed to send invitation' });
    }
  });

  // Respond to invitation
  const respondSchema = z.object({
    token: z.string(),
    action: z.enum(['accept', 'decline'])
  });

  app.post('/api/relationships/invitations/respond', requireAuth, async (req: Request, res: Response) => {
    const userId = req.session.userId!;

    try {
      const validatedData = respondSchema.parse(req.body);

      // Find invitation by token
      const invitation = await db
        .select()
        .from(relationshipInvitations)
        .where(and(
          eq(relationshipInvitations.token, validatedData.token),
          eq(relationshipInvitations.status, 'pending')
        ))
        .limit(1);

      if (invitation.length === 0) {
        return res.status(404).json({ error: 'Invalid or expired invitation' });
      }

      const inv = invitation[0];

      // Check if invitation has expired
      if (inv.expiresAt && new Date() > new Date(inv.expiresAt)) {
        await db
          .update(relationshipInvitations)
          .set({ status: 'expired' })
          .where(eq(relationshipInvitations.id, inv.id));

        return res.status(400).json({ error: 'Invitation has expired' });
      }

      // Update invitation status
      await db
        .update(relationshipInvitations)
        .set({
          status: validatedData.action === 'accept' ? 'accepted' : 'declined',
          respondedAt: new Date()
        })
        .where(eq(relationshipInvitations.id, inv.id));

      if (validatedData.action === 'accept') {
        // Check if user is already a member
        const existingMembership = await db
          .select()
          .from(relationshipMemberships)
          .where(and(
            eq(relationshipMemberships.userId, userId),
            eq(relationshipMemberships.groupId, inv.groupId)
          ))
          .limit(1);

        if (existingMembership.length === 0) {
          // Add user to group
          await db
            .insert(relationshipMemberships)
            .values({
              userId: userId,
              groupId: inv.groupId,
              role: inv.role,
              status: 'active'
            });
        }
      }

      return res.json({ success: true, action: validatedData.action });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      console.error('Error responding to invitation:', error);
      return res.status(500).json({ error: 'Failed to respond to invitation' });
    }
  });

  // Get user's pending invitations
  app.get('/api/relationships/invitations/pending', requireAuth, async (req: Request, res: Response) => {
    const userId = req.session.userId!;

    try {
      // Get user email
      const user = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get pending invitations for user's email
      const invitations = await db
        .select({
          id: relationshipInvitations.id,
          groupName: relationshipGroups.name,
          groupType: relationshipGroups.type,
          groupDescription: relationshipGroups.description,
          inviterName: users.name,
          role: relationshipInvitations.role,
          message: relationshipInvitations.message,
          token: relationshipInvitations.token,
          createdAt: relationshipInvitations.createdAt,
          expiresAt: relationshipInvitations.expiresAt
        })
        .from(relationshipInvitations)
        .innerJoin(relationshipGroups, eq(relationshipInvitations.groupId, relationshipGroups.id))
        .innerJoin(users, eq(relationshipInvitations.inviterId, users.id))
        .where(and(
          eq(relationshipInvitations.email, user[0].email),
          eq(relationshipInvitations.status, 'pending')
        ));

      return res.json({ invitations });
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      return res.status(500).json({ error: 'Failed to fetch invitations' });
    }
  });

  // Leave group
  app.post('/api/relationships/:groupId/leave', requireAuth, async (req: Request, res: Response) => {
    const userId = req.session.userId!;
    const groupId = req.params.groupId;

    try {
      // Check if user is member
      const membership = await db
        .select()
        .from(relationshipMemberships)
        .where(and(
          eq(relationshipMemberships.userId, userId),
          eq(relationshipMemberships.groupId, groupId),
          eq(relationshipMemberships.status, 'active')
        ))
        .limit(1);

      if (membership.length === 0) {
        return res.status(404).json({ error: 'Not a member of this group' });
      }

      // Update membership status
      await db
        .update(relationshipMemberships)
        .set({
          status: 'left',
          leftAt: new Date()
        })
        .where(and(
          eq(relationshipMemberships.userId, userId),
          eq(relationshipMemberships.groupId, groupId)
        ));

      return res.json({ success: true });
    } catch (error) {
      console.error('Error leaving group:', error);
      return res.status(500).json({ error: 'Failed to leave group' });
    }
  });
}