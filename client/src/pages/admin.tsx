import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, FileText, Mail, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import SiteSettingsAdmin from "@/components/admin/site-settings-admin";
// TODO: Create these components
// import SitePagesAdmin from "@/components/admin/site-pages-admin";
// import ContactSubmissionsAdmin from "@/components/admin/contact-submissions-admin";
// import AdminDashboard from "@/components/admin/admin-dashboard";

export default function Admin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Simple admin check - in production you'd want proper role-based access
  const isAdmin = user?.email === 'admin@example.com';

  useEffect(() => {
    if (!user) {
      setLocation('/auth');
      return;
    }
  }, [user, setLocation]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" data-testid="admin-unauthorized">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>You don't have permission to access the admin panel.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="admin-panel">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="admin-title">
            Admin Panel
          </h1>
          <p className="text-muted-foreground" data-testid="admin-description">
            Manage your AppreciateMate website content and settings
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6" data-testid="admin-tabs">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2" data-testid="tab-dashboard">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2" data-testid="tab-settings">
              <Settings className="h-4 w-4" />
              Site Settings
            </TabsTrigger>
            <TabsTrigger value="pages" className="flex items-center gap-2" data-testid="tab-pages">
              <FileText className="h-4 w-4" />
              Pages
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2" data-testid="tab-contact">
              <Mail className="h-4 w-4" />
              Contact Submissions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6" data-testid="tab-content-dashboard">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Admin Dashboard
                </CardTitle>
                <CardDescription>
                  Overview of your website statistics and recent activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Dashboard coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6" data-testid="tab-content-settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Site Settings
                </CardTitle>
                <CardDescription>
                  Configure your website's basic information, contact details, and branding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SiteSettingsAdmin />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages" className="space-y-6" data-testid="tab-content-pages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Site Pages
                </CardTitle>
                <CardDescription>
                  Manage your website pages like About, Privacy Policy, and Terms of Service
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Page management coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6" data-testid="tab-content-contact">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Submissions
                </CardTitle>
                <CardDescription>
                  View and manage contact form submissions from your website
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Contact submissions coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}