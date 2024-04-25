'use server';

import { readUserSession } from '@/lib/actions';
import { createSupabaseAdmin, createSupbaseServerClient } from '@/lib/supabase';
import { revalidatePath, unstable_noStore } from 'next/cache';

/**
 * * CREATE MEMBER
 * @param data
 * @returns
 */

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
      id: resCreateAcc.data.user?.id,
      email: data.email
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

/**
 * * UPDATE MEMBER BASIC INFO
 * @param member_id
 * @param data
 * @returns
 */

export async function updateMemberBasicInfoById(
  member_id: string,
  data: { name: string }
) {
  const supabaseServerClient = await createSupbaseServerClient();
  const res = await supabaseServerClient
    .from('member')
    .update(data)
    .eq('id', member_id);

  revalidatePath('/dashboard/member');
  return JSON.stringify(res);
}

/**
 * * UPDATE MEMBER ADVANCE INFO
 * @param permission_id
 * @param user_id
 * @param data
 * @returns
 */

export async function updateMemberAdvanceInfoById(
  permission_id: string,
  user_id: string,
  data: {
    role: 'admin' | 'user';
    status: 'active' | 'resigned';
  }
) {
  const { data: userSession } = await readUserSession();
  if (userSession.session?.user.user_metadata.role !== 'admin') {
    return JSON.stringify({ error: { message: 'Unauthorized' } });
  }

  const supabaseAdmin = await createSupabaseAdmin();

  // update account
  const resUpdateAcc = await supabaseAdmin.auth.admin.updateUserById(user_id, {
    user_metadata: { role: data.role }
  });

  if (resUpdateAcc.error?.message) {
    return JSON.stringify(resUpdateAcc);
  } else {
    const supabaseServerClient = await createSupbaseServerClient();
    const res = await supabaseServerClient
      .from('permission')
      .update(data)
      .eq('id', permission_id);

    revalidatePath('/dashboard/member');
    return JSON.stringify(res);
  }
}

/**
 * * UPDATE MEMBER ACCOUNT
 * @param user_id
 * @param data
 * @returns
 */

export async function updateMemberAccountById(
  user_id: string,
  data: {
    email: string;
    password?: string | undefined;
    confirm?: string | undefined;
  }
) {
  const { data: userSession } = await readUserSession();
  if (userSession.session?.user.user_metadata.role !== 'admin') {
    return JSON.stringify({ error: { message: 'Unauthorized' } });
  }

  let updateObject: {
    email: string;
    password?: string | undefined;
  } = { email: data.email };

  if (data.password) {
    updateObject.password = data.password;
  }

  const supabaseAdmin = await createSupabaseAdmin();
  const resUpdateAcc = await supabaseAdmin.auth.admin.updateUserById(
    user_id,
    updateObject
  );

  if (resUpdateAcc.error?.message) {
    return JSON.stringify(resUpdateAcc);
  } else {
    const supabaseServerClient = await createSupbaseServerClient();
    const res = await supabaseServerClient
      .from('member')
      .update({ email: data.email })
      .eq('id', user_id);

    revalidatePath('/dashboard/member');
    return JSON.stringify(res);
  }
}

/**
 * * DELETE MEMBER
 * @param user_id
 * @returns
 */

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

/**
 * * FETCH / READ MEMBERS
 * @returns
 */

export async function readMembers() {
  unstable_noStore();
  const supabaseServerClient = await createSupbaseServerClient();
  return await supabaseServerClient.from('permission').select('*,member(*)');
}
