import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  Share2, 
  Copy, 
  Mail, 
  Globe, 
  Lock, 
  Users, 
  Link as LinkIcon,
  Check,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkflowTemplate } from '../../shared/workflow-templates';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface WorkflowTemplateSharingProps {
  template: WorkflowTemplate;
  isOpen: boolean;
  onClose: () => void;
}

export function WorkflowTemplateSharing({ template, isOpen, onClose }: WorkflowTemplateSharingProps) {
  const [shareSettings, setShareSettings] = useState({
    permissions: 'view' as 'view' | 'copy' | 'edit',
    expiresInDays: 30,
    requireAuth: true,
    allowDownload: true
  });
  const [shareLink, setShareLink] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/workflow-templates/${template.id}/share`, {
        method: 'POST',
        body: shareSettings
      });
    },
    onSuccess: (data) => {
      setShareLink(data.shareUrl);
      toast({
        title: "Share Link Generated",
        description: "Template share link has been created successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate share link",
        variant: "destructive"
      });
    }
  });

  const handleCopyLink = async () => {
    if (!shareLink) return;
    
    const fullUrl = `${window.location.origin}${shareLink}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: "Link Copied",
      description: "Share link has been copied to clipboard"
    });
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Check out this workflow template: ${template.name}`);
    const body = encodeURIComponent(
      `I thought you might find this workflow template useful:\n\n` +
      `${template.name}\n` +
      `${template.description}\n\n` +
      `Industry: ${template.industry}\n` +
      `Complexity: ${template.complexity}\n` +
      `Estimated Duration: ${template.estimatedDuration}\n\n` +
      `Access it here: ${window.location.origin}${shareLink}`
    );
    
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const getPermissionDescription = (permission: string) => {
    switch (permission) {
      case 'view': return 'Recipients can view the template details';
      case 'copy': return 'Recipients can view and copy the template';
      case 'edit': return 'Recipients can view, copy, and edit the template';
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-emerald-600" />
            Share Workflow Template
          </DialogTitle>
          <DialogDescription>
            Share "{template.name}" with colleagues and control access permissions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Preview */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{template.industry}</Badge>
                  <Badge variant="outline">{template.businessType}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{template.steps.length} steps</span>
                <span>{template.estimatedDuration}</span>
                <span>{template.complexity} complexity</span>
              </div>
            </CardContent>
          </Card>

          {/* Share Settings */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Share Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Permissions</Label>
                <Select 
                  value={shareSettings.permissions} 
                  onValueChange={(value) => setShareSettings(prev => ({ ...prev, permissions: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-500" />
                        <div>
                          <div>View Only</div>
                          <div className="text-xs text-gray-500">Can view template details</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="copy">
                      <div className="flex items-center gap-2">
                        <Copy className="h-4 w-4 text-green-500" />
                        <div>
                          <div>View & Copy</div>
                          <div className="text-xs text-gray-500">Can view and copy template</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="edit">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-500" />
                        <div>
                          <div>Full Access</div>
                          <div className="text-xs text-gray-500">Can view, copy, and edit</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">{getPermissionDescription(shareSettings.permissions)}</p>
              </div>

              <div className="space-y-2">
                <Label>Expires In</Label>
                <Select 
                  value={shareSettings.expiresInDays.toString()} 
                  onValueChange={(value) => setShareSettings(prev => ({ ...prev, expiresInDays: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="0">Never expires</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Authentication</Label>
                  <p className="text-sm text-gray-500">Recipients must log in to access</p>
                </div>
                <Switch
                  checked={shareSettings.requireAuth}
                  onCheckedChange={(checked) => setShareSettings(prev => ({ ...prev, requireAuth: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow Download</Label>
                  <p className="text-sm text-gray-500">Allow recipients to download template</p>
                </div>
                <Switch
                  checked={shareSettings.allowDownload}
                  onCheckedChange={(checked) => setShareSettings(prev => ({ ...prev, allowDownload: checked }))}
                />
              </div>
            </div>
          </div>

          {/* Generate Link */}
          {!shareLink ? (
            <Button 
              onClick={() => shareMutation.mutate()} 
              disabled={shareMutation.isPending}
              className="w-full"
            >
              <Share2 className="h-4 w-4 mr-2" />
              {shareMutation.isPending ? 'Generating Link...' : 'Generate Share Link'}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}${shareLink}`}
                    readOnly
                    className="flex-1"
                  />
                  <Button onClick={handleCopyLink} variant="outline">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleEmailShare} variant="outline" className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Share via Email
                </Button>
                <Button 
                  onClick={() => window.open(`${window.location.origin}${shareLink}`, '_blank')}
                  variant="outline" 
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Preview Link
                </Button>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Security & Privacy</p>
                <p className="text-blue-700 mt-1">
                  Share links are encrypted and can be revoked at any time. Recipients with edit access 
                  can modify the template but cannot access your account or other templates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}