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
import { Label } from '@/components/ui/label';
import { X, Edit, Plus, BookCopy, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubjectManagerProps {
  subjects: string[];
  setSubjects: (subjects: string[] | ((subjects: string[]) => string[])) => void;
}

export const SubjectManager: FC<SubjectManagerProps> = ({ subjects, setSubjects }) => {
  const [newSubject, setNewSubject] = useState('');
  const [editingSubject, setEditingSubject] = useState<{ index: number; name: string } | null>(null);
  const { toast } = useToast();

  const handleAddSubject = () => {
    if (newSubject.trim() && !subjects.includes(newSubject.trim())) {
      setSubjects(prev => [...prev, newSubject.trim()]);
      setNewSubject('');
      toast({ title: "Success", description: "Subject added." });
    } else if (subjects.includes(newSubject.trim())) {
      toast({ title: "Error", description: "Subject already exists.", variant: "destructive" });
    }
  };

  const handleUpdateSubject = () => {
    if (editingSubject && editingSubject.name.trim() && !subjects.includes(editingSubject.name.trim())) {
      setSubjects(prev => {
        const updated = [...prev];
        updated[editingSubject.index] = editingSubject.name.trim();
        return updated;
      });
      setEditingSubject(null);
      toast({ title: "Success", description: "Subject updated." });
    } else if (editingSubject && subjects.includes(editingSubject.name.trim())) {
        toast({ title: "Error", description: "Subject already exists.", variant: "destructive" });
    }
  };

  const handleDeleteSubject = (index: number) => {
    setSubjects(prev => prev.filter((_, i) => i !== index));
    toast({ title: "Success", description: "Subject removed." });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Subjects</CardTitle>
        <CardDescription>Add, edit, or remove subjects.</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog>
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
                />
                <Button onClick={handleAddSubject} size="icon" aria-label="Add subject">
                  <Plus />
                </Button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {subjects.map((subject, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {editingSubject?.index === index ? (
                      <Input
                        value={editingSubject.name}
                        onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                        onBlur={handleUpdateSubject}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateSubject()}
                        autoFocus
                      />
                    ) : (
                      <div className="flex-grow p-2 bg-muted rounded-md text-sm">{subject}</div>
                    )}
                     <Button onClick={() => setEditingSubject({ index, name: subject })} size="icon" variant="ghost" aria-label="Edit subject">
                      <Edit />
                    </Button>
                    <Button onClick={() => handleDeleteSubject(index)} size="icon" variant="destructive" aria-label="Delete subject">
                      <X />
                    </Button>
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
