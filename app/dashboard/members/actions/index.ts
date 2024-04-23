'use server';

import { readUserSession } from '@/lib/actions';
import { createSupabaseAdmin, createSupbaseServerClient } from '@/lib/supabase';
import { revalidatePath, unstable_noStore } from 'next/cache';

export async function createMember(data: {
  name: string;
  role: 'user' | 'admin';
  status: 'active' | 'resigned';
  email: string;
  password: string;
  confirm: string;
}) {
  const { data: userSession } = await readUserSession();
  if (userSession.session?.user.user_metadata.role !== 'admin') {
    return JSON.stringify({ error: { message: 'Unauthorized' } });
  }

  const supabaseAdmin = await createSupabaseAdmin();

  // create account
  const resCreateAcc = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      role: data.role
    }
  });

  if (resCreateAcc.error?.message) {
    throw new Error(resCreateAcc.error.message);
  } else {
    const resInsertMember = await supabaseAdmin.from('member').insert({
      name: data.name,
      id: resCreateAcc.data.user?.id
    });

    if (resInsertMember.error) {
      throw new Error(resInsertMember.error.message);
    } else {
      const resInsertPermission = await supabaseAdmin
        .from('permission')
        .insert({
          member_id: resCreateAcc.data.user?.id,
          role: data.role,
          status: data.status
        });

      revalidatePath('/dashboard/member');
      return JSON.stringify(resInsertPermission);
    }
  }
}

export async function updateMemberById(id: string) {
  console.log('update member');
}

export async function deleteMemberById(user_id: string) {
  // admin only
  const { data: userSession } = await readUserSession();
  if (userSession.session?.user.user_metadata.role !== 'admin') {
    return JSON.stringify({ error: { message: 'Unauthorized' } });
  }

  // delete account
  const supabaseAdmin = await createSupabaseAdmin();
  const resDeleteAcc = await supabaseAdmin.auth.admin.deleteUser(user_id);

  if (resDeleteAcc.error?.message) {
    return JSON.stringify(resDeleteAcc);
  } else {
    const supabaseServerClient = await createSupbaseServerClient();
    const res = await supabaseServerClient
      .from('member')
      .delete()
      .eq('id', user_id);

    revalidatePath('/dashboard/member');
    return JSON.stringify(res);
  }
}

export async function readMembers() {
  unstable_noStore();
  const supabaseServerClient = await createSupbaseServerClient();
  return await supabaseServerClient.from('permission').select('*,member(*)');
}
