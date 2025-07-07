import { useAuth } from '@/hooks/use-auth';
import { SetupProvider } from '@/context/setup-context';
import { useToast } from '@/hooks/use-toast';
import SetupWizard from '@/components/setup/setup-wizard';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

function SetupContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateCompanyMutation = useMutation({
    mutationFn: async (companyData: any) => {
      return apiRequest('/api/company', {
        method: 'PUT',
        body: JSON.stringify(companyData),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Setup Complete',
        description: 'Your business setup has been completed successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      // Redirect to dashboard or next step
      window.location.href = '/';
    },
    onError: (error: any) => {
      toast({
        title: 'Setup Failed',
        description: error.message || 'Failed to complete setup. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSetupComplete = () => {
    // This will be called when the wizard is completed
    // You can add any final setup logic here
    updateCompanyMutation.mutate({
      setupCompleted: true,
      setupDate: new Date().toISOString(),
    });
  };

  return (
    <SetupWizard onComplete={handleSetupComplete} />
  );
}

export default function Setup() {
  return (
    <SetupProvider>
      <SetupContent />
    </SetupProvider>
  );
}