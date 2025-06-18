
// src/app/admin/send-notifications/page.tsx
'use client';

import { useState } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { sendBulkNotificationsByAdmin } from '@/app/actions/notification.actions';
import type { AdminNotificationPayload, TargetingOptions } from '@/types';
import { Loader2, Send } from 'lucide-react';
import { UserMultiSelect } from '@/components/admin/user-multi-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { categories as staticCategories } from '@/lib/data';

const notificationFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  description: z.string().min(10, "Description must be at least 10 characters.").max(500, "Description can be up to 500 characters."),
  externalLink: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  targetAudienceType: z.enum(["all", "specific", "category"], { required_error: "Please select a target audience type." }),
  targetUserIds: z.array(z.string()).optional(),
  targetCategorySlug: z.string().optional(),
}).refine(data => {
  if (data.targetAudienceType === "specific" && (!data.targetUserIds || data.targetUserIds.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Please select at least one user if targeting specific users.",
  path: ["targetUserIds"],
}).refine(data => {
  if (data.targetAudienceType === "category" && !data.targetCategorySlug) {
    return false;
  }
  return true;
}, {
  message: "Please select a category if targeting by category.",
  path: ["targetCategorySlug"],
});

type NotificationFormValues = z.infer<typeof notificationFormSchema>;

export default function SendNotificationsPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      title: '',
      description: '',
      externalLink: '',
      targetAudienceType: "all",
      targetUserIds: [],
      targetCategorySlug: undefined,
    },
  });

  const watchedTargetAudienceType = form.watch("targetAudienceType");

  const onSubmit: SubmitHandler<NotificationFormValues> = async (data) => {
    setIsSubmitting(true);
    let targeting: TargetingOptions;

    if (data.targetAudienceType === 'all') {
      targeting = { type: 'all' };
    } else if (data.targetAudienceType === 'specific' && data.targetUserIds) {
      targeting = { type: 'specific', userIds: data.targetUserIds };
    } else if (data.targetAudienceType === 'category' && data.targetCategorySlug) {
      targeting = { type: 'category', categorySlug: data.targetCategorySlug };
    } else {
      toast({ title: "Invalid Targeting", description: "Please select a valid target audience.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    const payload: AdminNotificationPayload = {
      title: data.title,
      description: data.description,
      externalLink: data.externalLink || undefined,
      targeting: targeting,
    };

    try {
      const result = await sendBulkNotificationsByAdmin(payload);
      if (result.success || result.count > 0) { // Consider partial success as a form of success message
        toast({
          title: "Notifications Processed!",
          description: `Successfully sent ${result.count} notifications to ${result.totalTargeted} targeted users. ${result.errors > 0 ? `${result.errors} failed.` : ''}`,
        });
        form.reset();
      } else {
        toast({
          title: "Sending Failed",
          description: `No notifications were sent. ${result.errors > 0 ? `${result.errors} attempts failed.` : 'Please check your targeting.'}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">Send Notifications</CardTitle>
          <CardDescription>
            Compose and send notifications to users.
            <br />
            <strong className="text-destructive">Warning:</strong> Sending to "All Users" or large categories may be slow for very large user bases.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="title">Notification Title</Label>
              <Input id="title" {...form.register('title')} disabled={isSubmitting} />
              {form.formState.errors.title && <p className="text-sm text-destructive mt-1">{form.formState.errors.title.message}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description / Message Body</Label>
              <Textarea
                id="description"
                rows={4}
                maxLength={500}
                {...form.register('description')}
                disabled={isSubmitting}
                placeholder="Enter the main content of your notification..."
              />
              <p className="text-xs text-muted-foreground text-right mt-1">{form.watch('description').length}/500</p>
              {form.formState.errors.description && <p className="text-sm text-destructive mt-1">{form.formState.errors.description.message}</p>}
            </div>

            <div>
              <Label htmlFor="externalLink">External Link (Optional)</Label>
              <Input id="externalLink" type="url" placeholder="https://example.com/more-info" {...form.register('externalLink')} disabled={isSubmitting} />
              {form.formState.errors.externalLink && <p className="text-sm text-destructive mt-1">{form.formState.errors.externalLink.message}</p>}
            </div>
            
            <Controller
              control={form.control}
              name="targetAudienceType"
              render={({ field }) => (
                <RadioGroup
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (value !== 'specific') form.setValue('targetUserIds', []);
                    if (value !== 'category') form.setValue('targetCategorySlug', undefined);
                  }}
                  defaultValue={field.value}
                  className="space-y-2"
                  disabled={isSubmitting}
                >
                  <Label className="text-base font-semibold">Target Audience</Label>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all-users" />
                    <Label htmlFor="all-users">All Users</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="specific" id="specific-users" />
                    <Label htmlFor="specific-users">Specific Users</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="category" id="specific-category" />
                    <Label htmlFor="specific-category">Specific Category</Label>
                  </div>
                </RadioGroup>
              )}
            />
            {form.formState.errors.targetAudienceType && <p className="text-sm text-destructive">{form.formState.errors.targetAudienceType.message}</p>}

            {watchedTargetAudienceType === "specific" && (
              <div className="space-y-2">
                <Label>Select Users</Label>
                 <Controller
                    control={form.control}
                    name="targetUserIds"
                    render={({ field }) => (
                        <UserMultiSelect
                            selectedUserIds={field.value || []}
                            onChange={field.onChange}
                            disabled={isSubmitting}
                        />
                    )}
                  />
                {form.formState.errors.targetUserIds && <p className="text-sm text-destructive mt-1">{form.formState.errors.targetUserIds.message}</p>}
              </div>
            )}

            {watchedTargetAudienceType === "category" && (
              <div className="space-y-2">
                <Label htmlFor="targetCategorySlug">Select Category</Label>
                <Controller
                    name="targetCategorySlug"
                    control={form.control}
                    render={({ field }) => (
                        <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isSubmitting}
                        >
                            <SelectTrigger id="targetCategorySlug">
                                <SelectValue placeholder="Choose a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {staticCategories.map(cat => (
                                    <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                {form.formState.errors.targetCategorySlug && <p className="text-sm text-destructive mt-1">{form.formState.errors.targetCategorySlug.message}</p>}
              </div>
            )}

            <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Send Notification
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
