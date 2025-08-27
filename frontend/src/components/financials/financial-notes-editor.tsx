import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronRight, 
  Edit3, 
  Save, 
  X, 
  FileText, 
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { FinancialNote, UAE_NOTE_TEMPLATES } from '@/lib/financial-reports';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FinancialNotesEditorProps {
  reportType: 'INCOME_STATEMENT' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'TAX_SUMMARY';
  notes: FinancialNote[];
  onNotesChange: (notes: FinancialNote[]) => void;
  readOnly?: boolean;
  className?: string;
}

export default function FinancialNotesEditor({
  reportType,
  notes,
  onNotesChange,
  readOnly = false,
  className = ''
}: FinancialNotesEditorProps) {
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const { language } = useLanguage();
  const { toast } = useToast();

  // Initialize notes from templates if empty
  useEffect(() => {
    if (notes.length === 0) {
      const templates = UAE_NOTE_TEMPLATES[language][reportType] || [];
      const initialNotes: FinancialNote[] = templates.map((template, index) => ({
        id: template.id,
        reportType,
        noteNumber: index + 1,
        title: template.title,
        content: template.content,
        isEditable: template.isEditable,
        lastModified: new Date().toISOString(),
        modifiedBy: 'System'
      }));
      
      if (initialNotes.length > 0) {
        onNotesChange(initialNotes);
      }
    }
  }, [reportType, language, notes.length, onNotesChange]);

  const toggleNoteExpansion = (noteId: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };

  const startEditing = (note: FinancialNote) => {
    if (readOnly || !note.isEditable) return;
    
    setEditingNote(note.id);
    setEditContent(note.content);
    setExpandedNotes(prev => new Set([...prev, note.id]));
  };

  const cancelEditing = () => {
    setEditingNote(null);
    setEditContent('');
  };

  const saveNote = async (noteId: string) => {
    if (!editContent.trim()) {
      toast({
        title: 'Invalid Content',
        description: 'Note content cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    setIsAutoSaving(true);
    
    try {
      const updatedNotes = notes.map(note => 
        note.id === noteId 
          ? {
              ...note,
              content: editContent.trim(),
              lastModified: new Date().toISOString(),
              modifiedBy: 'User' // In production, this would be the actual user
            }
          : note
      );

      onNotesChange(updatedNotes);
      setEditingNote(null);
      setEditContent('');

      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 800));

      toast({
        title: 'Note Saved',
        description: 'Financial note has been updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save note. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAutoSaving(false);
    }
  };

  const getReportTitle = () => {
    const titles = {
      en: {
        INCOME_STATEMENT: 'Income Statement',
        BALANCE_SHEET: 'Balance Sheet', 
        CASH_FLOW: 'Cash Flow Statement',
        TAX_SUMMARY: 'Tax Calculation Summary'
      },
      ar: {
        INCOME_STATEMENT: 'قائمة الدخل',
        BALANCE_SHEET: 'الميزانية العمومية',
        CASH_FLOW: 'بيان التدفق النقدي', 
        TAX_SUMMARY: 'ملخص الضرائب'
      }
    };

    return titles[language][reportType];
  };

  if (notes.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">
            {language === 'ar' 
              ? 'لا توجد ملاحظات متاحة لهذا التقرير'
              : 'No notes available for this report'
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          {language === 'ar' ? 'ملاحظات على' : 'Notes to'} {getReportTitle()}
          {readOnly && (
            <Badge variant="outline" className="text-xs">
              {language === 'ar' ? 'للقراءة فقط' : 'Read Only'}
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-gray-600">
          {language === 'ar'
            ? 'الملاحظات التفسيرية للبيانات المالية وفقاً للمعايير الدولية'
            : 'Explanatory notes to financial statements in accordance with IFRS'
          }
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {notes.map((note) => {
          const isExpanded = expandedNotes.has(note.id);
          const isEditing = editingNote === note.id;

          return (
            <div key={note.id} className="border rounded-lg">
              <Collapsible 
                open={isExpanded} 
                onOpenChange={() => !isEditing && toggleNoteExpansion(note.id)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900">{note.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {language === 'ar' ? 'آخر تعديل:' : 'Last modified:'} {' '}
                            {new Date(note.lastModified).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>{note.modifiedBy}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {note.isEditable && !readOnly && !isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(note);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      )}
                      
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          note.isEditable ? "border-blue-200 text-blue-700" : "border-gray-200 text-gray-700"
                        )}
                      >
                        {note.isEditable 
                          ? (language === 'ar' ? 'قابل للتعديل' : 'Editable')
                          : (language === 'ar' ? 'ثابت' : 'Standard')
                        }
                      </Badge>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 pb-4 pt-0">
                    {isEditing ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          placeholder={language === 'ar' 
                            ? 'أدخل محتوى الملاحظة...'
                            : 'Enter note content...'
                          }
                          className="min-h-32 resize-none"
                          dir={language === 'ar' ? 'rtl' : 'ltr'}
                        />
                        
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            {editContent.length} {language === 'ar' ? 'حرف' : 'characters'}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEditing}
                              disabled={isAutoSaving}
                            >
                              <X className="h-3 w-3 mr-1" />
                              {language === 'ar' ? 'إلغاء' : 'Cancel'}
                            </Button>
                            
                            <Button
                              size="sm"
                              onClick={() => saveNote(note.id)}
                              disabled={isAutoSaving || !editContent.trim()}
                            >
                              {isAutoSaving ? (
                                <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                              ) : (
                                <Save className="h-3 w-3 mr-1" />
                              )}
                              {isAutoSaving 
                                ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                                : (language === 'ar' ? 'حفظ' : 'Save')
                              }
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        <div 
                          className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed"
                          dir={language === 'ar' ? 'rtl' : 'ltr'}
                        >
                          {note.content}
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          );
        })}

        {/* Compliance Notice */}
        <Alert className="border-blue-200 bg-blue-50">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            <strong>
              {language === 'ar' ? 'ملاحظة امتثال:' : 'Compliance Note:'}
            </strong>{' '}
            {language === 'ar'
              ? 'هذه الملاحظات تتبع المعايير الدولية للتقارير المالية ومتطلبات الهيئة الاتحادية للضرائب في دولة الإمارات.'
              : 'These notes follow International Financial Reporting Standards and UAE Federal Tax Authority requirements.'
            }
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}