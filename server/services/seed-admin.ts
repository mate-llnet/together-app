import bcrypt from "bcryptjs";
import { storage } from '../storage.js';

const DEFAULT_ADMIN = {
  name: 'Administrator',
  email: 'admin@example.com',
  password: 'admin123' // Simple default password that can be changed after first login
};

export async function seedDefaultAdmin(): Promise<void> {
  console.log("👤 Seeding default admin user...");
  
  try {
    // Check if admin user already exists
    const existingAdmin = await storage.getUserByEmail(DEFAULT_ADMIN.email);
    
    if (existingAdmin) {
      console.log(`✅ Admin user already exists (${DEFAULT_ADMIN.email}), skipping seed.`);
      return;
    }
    
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 12);
    
    // Create the default admin user
    const adminUser = await storage.createUser({
      name: DEFAULT_ADMIN.name,
      email: DEFAULT_ADMIN.email,
      password: hashedPassword,
      role: 'admin'
    });
    
    console.log(`✅ Successfully created default admin user!`);
    console.log(`📧 Email: ${DEFAULT_ADMIN.email}`);
    console.log(`🔑 Password: ${DEFAULT_ADMIN.password}`);
    console.log(`⚠️  Please change the password after first login for security!`);
    
  } catch (error) {
    console.error("❌ Failed to seed default admin:", error);
    throw error;
  }
}