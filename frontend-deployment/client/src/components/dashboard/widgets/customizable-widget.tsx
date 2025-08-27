import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Edit3, 
  Save, 
  X,
  Plus,
  Trash2,
  StickyNote,
  Calculator,
  Calendar,
  FileText
} from 'lucide-react';

interface CustomizableWidgetProps {
  title: string;
}

interface WidgetNote {
  id: string;
  title: string;
  content: string;
  type: 'note' | 'reminder' | 'calculation' | 'link';
  createdAt: Date;
}

export function CustomizableWidget({ title }: CustomizableWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [widgetTitle, setWidgetTitle] = useState(title);
  const [notes, setNotes] = useState<WidgetNote[]>([
    {
      id: '1',
      title: 'VAT Filing Reminder',
      content: 'Remember to submit VAT return by March 28th',
      type: 'reminder',
      createdAt: new Date()
    },
    {
      id: '2',
      title: 'Q1 Revenue Target',
      content: 'Target: AED 250,000 | Current: AED 186,000',
      type: 'calculation',
      createdAt: new Date()
    }
  ]);
  
  const [newNote, setNewNote] = useState<{
    title: string;
    content: string;
    type: 'note' | 'reminder' | 'calculation' | 'link';
  }>({
    title: '',
    content: '',
    type: 'note'
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const addNote = () => {
    if (newNote.title.trim() && newNote.content.trim()) {
      const note: WidgetNote = {
        id: Date.now().toString(),
        title: newNote.title,
        content: newNote.content,
        type: newNote.type,
        createdAt: new Date()
      };
      
      setNotes(prev => [...prev, note]);
      setNewNote({ title: '', content: '', type: 'note' });
      setShowAddForm(false);
    }
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reminder':
        return Calendar;
      case 'calculation':
        return Calculator;
      case 'link':
        return FileText;
      default:
        return StickyNote;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'reminder':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'calculation':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'link':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={widgetTitle}
                onChange={(e) => setWidgetTitle(e.target.value)}
                className="flex-1"
                placeholder="Widget title"
              />
              <Button 
                size="sm" 
                onClick={() => setIsEditing(false)}
                className="p-2"
              >
                <Save className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <CardTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-purple-500" />
              {widgetTitle}
            </CardTitle>
          )}
          
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="p-2"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              className="p-2"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* Add Note Form */}
          {showAddForm && (
            <Card className="p-3 border-dashed border-2 border-purple-200 bg-purple-50">
              <div className="space-y-2">
                <Input
                  placeholder="Note title"
                  value={newNote.title}
                  onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                />
                <Textarea
                  placeholder="Note content"
                  value={newNote.content}
                  onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                  rows={2}
                />
                <div className="flex justify-between">
                  <div className="flex gap-1">
                    {(['note', 'reminder', 'calculation', 'link'] as const).map(type => (
                      <Button
                        key={type}
                        variant={newNote.type === type ? "default" : "outline"}
                        size="sm"
                        onClick={() => setNewNote(prev => ({ ...prev, type }))}
                        className="text-xs capitalize"
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" onClick={addNote}>
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setShowAddForm(false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Notes List */}
          {notes.map((note) => {
            const IconComponent = getTypeIcon(note.type);
            
            return (
              <div key={note.id} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4 text-gray-500" />
                    <h4 className="font-medium text-gray-900 text-sm">{note.title}</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getTypeColor(note.type)}`}
                    >
                      {note.type}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNote(note.id)}
                      className="p-1 h-auto"
                    >
                      <Trash2 className="h-3 w-3 text-gray-400" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{note.content}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {note.createdAt.toLocaleDateString()}
                </p>
              </div>
            );
          })}

          {notes.length === 0 && !showAddForm && (
            <div className="text-center py-6">
              <StickyNote className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-2">No notes yet</p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add First Note
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}