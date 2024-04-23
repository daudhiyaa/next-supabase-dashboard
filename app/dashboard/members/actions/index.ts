'use server';

import { readUserSession } from '@/lib/actions';
import { createSupabaseAdmin } from '@/lib/supabase';

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

  if (resCreateAcc.error) {
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

      return JSON.stringify(resInsertPermission);
    }
  }
}

export async function updateMemberById(id: string) {
  console.log('update member');
}

export async function deleteMemberById(id: string) {}

export async function readMembers() {}
