
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
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';


interface SubjectManagerProps {
  subjects: string[];
}

export const SubjectManager: FC<SubjectManagerProps> = ({ subjects }) => {
  const [newSubject, setNewSubject] = useState('');
  const [editingSubject, setEditingSubject] = useState<{ oldName: string; newName: string } | null>(null);
  const { toast } = useToast();

  const handleAddSubject = async () => {
    const trimmedSubject = newSubject.trim();
    if (trimmedSubject && !subjects.includes(trimmedSubject)) {
      await addDoc(collection(db, 'subjects'), { name: trimmedSubject });
      setNewSubject('');
      toast({ title: "Success", description: "Subject added." });
    } else if (subjects.includes(trimmedSubject)) {
      toast({ title: "Error", description: "Subject already exists.", variant: "destructive" });
    }
  };

  const handleUpdateSubject = async () => {
    if (editingSubject && editingSubject.newName.trim() && !subjects.includes(editingSubject.newName.trim())) {
        const q = query(collection(db, "subjects"), where("name", "==", editingSubject.oldName));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (document) => {
            await updateDoc(doc(db, "subjects", document.id), { name: editingSubject.newName.trim() });
        });

        toast({ title: "Success", description: "Subject updated." });
        setEditingSubject(null);
    } else if (editingSubject && subjects.includes(editingSubject.newName.trim())) {
        toast({ title: "Error", description: "Subject already exists.", variant: "destructive" });
    }
  };

  const handleDeleteSubject = async (subjectName: string) => {
    const q = query(collection(db, "subjects"), where("name", "==", subjectName));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (document) => {
        await deleteDoc(doc(db, "subjects", document.id));
    });
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
                <Button onClick={handleAddSubject} size="icon" aria-label="Add subject">
                  <Plus />
                </Button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {[...subjects].sort().map((subject) => (
                  <div key={subject} className="flex items-center gap-2">
                    {editingSubject?.oldName === subject ? (
                      <Input
                        value={editingSubject.newName}
                        onChange={(e) => setEditingSubject({ ...editingSubject, newName: e.target.value })}
                        onBlur={handleUpdateSubject}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateSubject()}
                        autoFocus
                      />
                    ) : (
                      <div className="flex-grow p-2 bg-muted rounded-md text-sm">{subject}</div>
                    )}
                     <Button onClick={() => setEditingSubject({ oldName: subject, newName: subject })} size="icon" variant="ghost" aria-label="Edit subject">
                      <Edit />
                    </Button>
                    <Button onClick={() => handleDeleteSubject(subject)} size="icon" variant="destructive" aria-label="Delete subject">
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
