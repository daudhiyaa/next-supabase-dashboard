'use client';

import { Button } from '@/components/ui/button';
import { TrashIcon } from '@radix-ui/react-icons';
import React from 'react';
import { deleteMemberById } from '../actions';
import { toast } from '@/components/ui/use-toast';

export default function DeleteMember({ user_id }: { user_id: string }) {
  const [isPending, startTransition] = React.useTransition();

  const onSubmit = () => {
    startTransition(async () => {
      const res = JSON.parse(await deleteMemberById(user_id));
      if (res?.error?.message) {
        toast({ title: 'Error', description: res.error.message });
      } else {
        toast({ title: 'Success', description: 'Member deleted' });
      }
    });
  };

  return (
    <form action={onSubmit}>
      <Button variant='outline'>
        <TrashIcon />
        Delete
      </Button>
    </form>
  );
}
