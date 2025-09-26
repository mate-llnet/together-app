import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { insertSiteSettingsSchema, type InsertSiteSettings, type SiteSettings } from "@shared/schema";

export default function SiteSettingsAdmin() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/site/settings'],
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<InsertSiteSettings>({
    resolver: zodResolver(insertSiteSettingsSchema),
    values: settings || {
      siteName: "AppreciateMate",
      tagline: "Appreciate Life Together",
      description: "A relationship appreciation app that helps couples track and appreciate each other's daily contributions.",
      logoUrl: "",
      contactEmail: "hello@appreciatemate.com",
      contactPhone: "",
      contactAddress: "",
      socialLinks: ""
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertSiteSettings) =>
      fetch('/api/site/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Site settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/site/settings'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update site settings. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: InsertSiteSettings) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8" data-testid="settings-loading">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="settings-form">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="siteName" data-testid="label-site-name">Site Name</Label>
            <Input
              id="siteName"
              type="text"
              data-testid="input-site-name"
              {...register("siteName")}
              className={errors.siteName ? "border-red-500" : ""}
            />
            {errors.siteName && (
              <p className="text-sm text-red-500" data-testid="error-site-name">
                {errors.siteName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagline" data-testid="label-tagline">Tagline</Label>
            <Input
              id="tagline"
              type="text"
              data-testid="input-tagline"
              {...register("tagline")}
              className={errors.tagline ? "border-red-500" : ""}
            />
            {errors.tagline && (
              <p className="text-sm text-red-500" data-testid="error-tagline">
                {errors.tagline.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" data-testid="label-description">Description</Label>
          <Textarea
            id="description"
            rows={3}
            data-testid="input-description"
            {...register("description")}
            className={errors.description ? "border-red-500" : ""}
          />
          {errors.description && (
            <p className="text-sm text-red-500" data-testid="error-description">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="logoUrl" data-testid="label-logo-url">Logo URL</Label>
          <Input
            id="logoUrl"
            type="url"
            placeholder="https://example.com/logo.png"
            data-testid="input-logo-url"
            {...register("logoUrl")}
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Contact Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactEmail" data-testid="label-contact-email">Contact Email</Label>
            <Input
              id="contactEmail"
              type="email"
              data-testid="input-contact-email"
              {...register("contactEmail")}
              className={errors.contactEmail ? "border-red-500" : ""}
            />
            {errors.contactEmail && (
              <p className="text-sm text-red-500" data-testid="error-contact-email">
                {errors.contactEmail.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone" data-testid="label-contact-phone">Contact Phone</Label>
            <Input
              id="contactPhone"
              type="tel"
              data-testid="input-contact-phone"
              {...register("contactPhone")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactAddress" data-testid="label-contact-address">Contact Address</Label>
          <Textarea
            id="contactAddress"
            rows={2}
            data-testid="input-contact-address"
            {...register("contactAddress")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="socialLinks" data-testid="label-social-links">Social Links (JSON format)</Label>
          <Textarea
            id="socialLinks"
            rows={3}
            placeholder='{"twitter": "https://twitter.com/appreciatemate", "linkedin": "https://linkedin.com/company/appreciatemate"}'
            data-testid="input-social-links"
            {...register("socialLinks")}
          />
          <p className="text-sm text-muted-foreground">
            Enter social media links as JSON object
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!isDirty || updateMutation.isPending}
          className="flex items-center gap-2"
          data-testid="button-save-settings"
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {updateMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}