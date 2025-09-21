
"use client";

import { useState, type FC } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { X, Edit, Plus, BookCopy, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubjectManagerProps {
  subjects: string[];
  setSubjects: (subjects: string[] | ((prev: string[]) => string[])) => void;
}

export const SubjectManager: FC<SubjectManagerProps> = ({ subjects, setSubjects }) => {
  const [newSubject, setNewSubject] = useState('');
  const [editingSubject, setEditingSubject] = useState<{ oldName: string; newName: string } | null>(null);
  const { toast } = useToast();

  const handleAddSubject = () => {
    const trimmedSubject = newSubject.trim();
    if (!trimmedSubject) return;

    if (subjects.find(s => s.toLowerCase() === trimmedSubject.toLowerCase())) {
      toast({ title: "Error", description: "Subject already exists.", variant: "destructive" });
      return;
    }
    
    setSubjects(prev => [...prev, trimmedSubject]);
    setNewSubject('');
    toast({ title: "Success", description: "Subject added." });
  };

  const handleUpdateSubject = () => {
    if (!editingSubject || !editingSubject.newName.trim()) {
        setEditingSubject(null);
        return;
    }
    
    const newNameTrimmed = editingSubject.newName.trim();
    const oldName = editingSubject.oldName;

    if (newNameTrimmed.toLowerCase() === oldName.toLowerCase()) {
        setEditingSubject(null);
        return;
    }
    
    if (subjects.find(s => s.toLowerCase() === newNameTrimmed.toLowerCase())) {
        toast({ title: "Error", description: "Subject name already exists.", variant: "destructive" });
        return;
    }

    setSubjects(prev => prev.map(s => s === oldName ? newNameTrimmed : s));
    setEditingSubject(null);
    toast({ title: "Success", description: "Subject updated." });
  };

  const handleDeleteSubject = (subjectName: string) => {
    setSubjects(prev => prev.filter(s => s !== subjectName));
    toast({ title: "Success", description: "Subject removed." });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Subjects</CardTitle>
        <CardDescription>Add, edit, or remove subjects.</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog onOpenChange={(isOpen) => { if (!isOpen) setEditingSubject(null)}}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <BookCopy className="mr-2" />
              Edit Subjects
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Subjects</DialogTitle>
              <DialogDescription>
                Manage your list of subjects for attendance tracking.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="New subject name"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                />
                <Button onClick={handleAddSubject} size="icon" aria-label="Add subject" disabled={!newSubject.trim()}>
                  <Plus />
                </Button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {[...subjects].sort((a,b) => a.localeCompare(b)).map((subject) => (
                  <div key={subject} className="flex items-center gap-2 group">
                    {editingSubject?.oldName === subject ? (
                      <Input
                        value={editingSubject.newName}
                        onChange={(e) => setEditingSubject({ ...editingSubject, newName: e.target.value })}
                        onBlur={handleUpdateSubject}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateSubject();
                            if (e.key === 'Escape') setEditingSubject(null);
                        }}
                        autoFocus
                      />
                    ) : (
                      <>
                        <div className="flex-grow p-2 bg-muted rounded-md text-sm truncate">{subject}</div>
                        <Button onClick={() => setEditingSubject({ oldName: subject, newName: subject })} size="icon" variant="ghost" aria-label="Edit subject" className="opacity-0 group-hover:opacity-100">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleDeleteSubject(subject)} size="icon" variant="ghost" className="text-destructive hover:text-destructive opacity-0 group-hover:opacity-100" aria-label="Delete subject">
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
                {subjects.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                        <List className="mx-auto h-8 w-8 mb-2" />
                        No subjects found. Add one to get started.
                    </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
