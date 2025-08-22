"use client";

import { useState, useEffect, type FC } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogIn, LogOut } from 'lucide-react';

export const UserStatus: FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage('isLoggedIn', false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleLogin = () => {
    setIsLoggedIn(prev => !prev);
  };

  if (!mounted) {
    return null; // or a skeleton loader
  }

  return (
    <div className="flex items-center gap-4">
      {isLoggedIn ? (
        <>
          <div className="flex items-center gap-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://placehold.co/40x40.png" alt="User" data-ai-hint="user avatar" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="text-sm">
                <p className="font-semibold">User</p>
                <p className="text-muted-foreground">Logged In</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={toggleLogin}>
            <LogOut className="mr-2" /> Logout
          </Button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Avatar className="h-9 w-9">
               <AvatarFallback>G</AvatarFallback>
            </Avatar>
            <div className="text-sm">
                <p className="font-semibold">Guest</p>
                <p className="text-muted-foreground">Logged Out</p>
            </div>
          </div>
          <Button variant="default" size="sm" onClick={toggleLogin}>
            <LogIn className="mr-2" /> Login
          </Button>
        </>
      )}
    </div>
  );
};
