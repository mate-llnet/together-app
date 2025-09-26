import bcrypt from "bcryptjs";
import { storage } from '../storage.js';
import { randomBytes } from 'crypto';

// Generate secure random password
function generateSecurePassword(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  const randomArray = randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    result += chars[randomArray[i] % chars.length];
  }
  return result;
}

export async function seedDefaultAdmin(): Promise<void> {
  // Only seed admin in development or if explicitly enabled
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_ADMIN_SEEDING) {
    console.log("🔒 Admin seeding disabled in production. Use ENABLE_ADMIN_SEEDING=true to enable.");
    return;
  }

  console.log("👤 Seeding admin user...");
  
  try {
    // Get admin credentials from environment or generate secure defaults
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminName = process.env.ADMIN_NAME || 'Administrator';
    
    // Check if admin user already exists
    const existingAdmin = await storage.getUserByEmail(adminEmail);
    
    if (existingAdmin) {
      console.log(`✅ Admin user already exists, skipping seed.`);
      return;
    }
    
    // Use environment password or generate a secure random one
    const adminPassword = process.env.ADMIN_PASSWORD || generateSecurePassword();
    
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    // Create the admin user
    await storage.createUser({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin'
    });
    
    console.log(`✅ Successfully created admin user!`);
    console.log(`📧 Email: ${adminEmail}`);
    
    // Only show password in development if it was generated (not from env)
    if (process.env.NODE_ENV === 'development' && !process.env.ADMIN_PASSWORD) {
      console.log(`🔑 Generated Password: ${adminPassword}`);
      console.log(`⚠️  This password was randomly generated. Save it now!`);
    } else if (!process.env.ADMIN_PASSWORD) {
      console.log(`🔐 A secure password was generated. Check server logs or set ADMIN_PASSWORD env var.`);
    } else {
      console.log(`🔐 Using password from ADMIN_PASSWORD environment variable.`);
    }
    
  } catch (error) {
    console.error("❌ Failed to seed admin user:", error);
    throw error;
  }
}