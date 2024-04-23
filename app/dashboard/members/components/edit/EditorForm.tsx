import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BasicForm from './BasicForm';
import AccountForm from './AccountForm';
import AdvanceForm from './AdvanceForm';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/lib/store/user';

export default function EditForm() {
  const user = useUserStore.getState().user;
  const isAdmin = user?.user_metadata.role === 'admin';

  return (
    <Tabs defaultValue='basic' className='w-full space-y-5'>
      <TabsList
        className={cn('grid w-full ', isAdmin ? 'grid-cols-3' : 'grid-cols-1')}>
        <TabsTrigger value='basic'>Basic</TabsTrigger>
        {isAdmin && (
          <>
            <TabsTrigger value='account'>Acccount</TabsTrigger>
            <TabsTrigger value='advance'>Advance</TabsTrigger>
          </>
        )}
      </TabsList>
      <TabsContent value='basic'>
        <BasicForm />
      </TabsContent>
      {isAdmin && (
        <>
          <TabsContent value='account'>
            <AccountForm />
          </TabsContent>
          <TabsContent value='advance'>
            <AdvanceForm />
          </TabsContent>
        </>
      )}
    </Tabs>
  );
}
