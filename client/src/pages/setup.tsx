import { SetupProvider } from '@/context/setup-context';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import SetupWizard from '@/components/setup/setup-wizard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Users, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Setup() {
  const { user } = useAuth();
  const { language } = useLanguage();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            {language === 'ar' ? 'مطلوب تسجيل الدخول' : 'Authentication Required'}
          </h2>
          <p className="text-gray-600 mb-4">
            {language === 'ar' 
              ? 'يرجى تسجيل الدخول لإعداد حسابك التجاري'
              : 'Please log in to set up your business account'
            }
          </p>
          <Button onClick={() => window.location.href = '/login'}>
            {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SetupProvider>
      <div className={cn("min-h-screen bg-gray-50 py-8", language === 'ar' && "rtl")}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Building2 className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                {language === 'ar' ? 'إعداد الأعمال' : 'Business Setup'}
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {language === 'ar' 
                ? 'أكمل إعداد ملف شركتك للامتثال الضريبي في دولة الإمارات العربية المتحدة'
                : 'Complete your company profile setup for UAE tax compliance'
              }
            </p>
          </div>

          {/* Welcome Card */}
          <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    {language === 'ar' ? 'مرحباً بك في نظام Peergos' : 'Welcome to Peergos Setup'}
                  </h3>
                  <p className="text-blue-800 text-sm mb-3">
                    {language === 'ar' 
                      ? 'سيقوم هذا المعالج بإرشادك خلال 5 خطوات بسيطة لإعداد ملف شركتك والامتثال الضريبي. يتم حفظ التقدم تلقائياً.'
                      : 'This wizard will guide you through 5 simple steps to set up your company profile and tax compliance. Progress is automatically saved.'
                    }
                  </p>
                  <div className="flex items-center gap-4 text-sm text-blue-700">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{language === 'ar' ? 'الامتثال لقوانين الإمارات' : 'UAE Compliant'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowRight className="h-4 w-4" />
                      <span>{language === 'ar' ? '5 دقائق فقط' : 'Only 5 minutes'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Setup Wizard */}
          <SetupWizard />

          {/* Help Section */}
          <Alert className="mt-8 border-gray-200 bg-gray-50">
            <Building2 className="h-4 w-4 text-gray-600" />
            <AlertDescription className="text-gray-700 text-sm">
              <strong>
                {language === 'ar' ? 'تحتاج مساعدة؟' : 'Need help?'}
              </strong>{' '}
              {language === 'ar' 
                ? 'تواصل مع فريق الدعم لدينا أو راجع دليل الإعداد المفصل.'
                : 'Contact our support team or refer to the detailed setup guide.'
              }
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </SetupProvider>
  );
}