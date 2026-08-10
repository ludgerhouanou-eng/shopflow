'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { registerSchema, loginSchema, resetPasswordSchema, RegisterInput, LoginInput } from '@/lib/validations/auth';
import { slugify } from '@/lib/utils/image';
import { redirect } from 'next/navigation';

export async function registerUser(input: RegisterInput) {
  const validation = registerSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0].message,
    };
  }

  const { email, password, firstName, lastName, phone, businessName } = validation.data;
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // 1. Inscription Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        phone,
      },
    },
  });

  if (authError || !authData.user) {
    return {
      success: false,
      error: authError?.message || 'Échec de l’inscription de l’utilisateur.',
    };
  }

  const userId = authData.user.id;
  const baseSlug = slugify(businessName);
  const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    // 2. Création du Profil Utilisateur
    const { error: profileError } = await adminSupabase.from('profiles').insert({
      id: userId,
      first_name: firstName,
      last_name: lastName,
      phone,
    });
    if (profileError) throw new Error(`Profil: ${profileError.message}`);

    // 3. Création de la Boutique (Tenant)
    const { data: businessData, error: businessError } = await adminSupabase
      .from('businesses')
      .insert({
        name: businessName,
        slug,
        whatsapp_number: phone,
        currency: 'XOF',
        city: 'Cotonou',
      })
      .select()
      .single();

    if (businessError || !businessData) throw new Error(`Boutique: ${businessError?.message || 'Impossible de créer la boutique'}`);

    // 4. Association Rôle Propriétaire (Owner)
    const { error: memberError } = await adminSupabase.from('business_members').insert({
      business_id: businessData.id,
      user_id: userId,
      role: 'owner',
    });
    if (memberError) throw new Error(`Membre: ${memberError.message}`);

    // 5. Création Abonnement Gratuit par défaut
    await adminSupabase.from('subscriptions').insert({
      business_id: businessData.id,
      plan_code: 'free',
      status: 'active',
      max_products: 20,
      max_orders_per_month: 50,
      max_users: 2,
    });
  } catch (err: any) {
    console.error('Erreur initialisation tenant:', err);
    return {
      success: false,
      error: `Erreur d’initialisation de la boutique : ${err.message}`,
    };
  }

  return { success: true, redirectUrl: '/dashboard' };
}

export async function loginUser(input: LoginInput) {
  const validation = loginSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0].message,
    };
  }

  const { email, password } = validation.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      error: 'Identifiants incorrects. Veuillez vérifier votre email et mot de passe.',
    };
  }

  return { success: true, redirectUrl: '/dashboard' };
}

export async function logoutUser() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function resetPassword(emailInput: string) {
  const validation = resetPasswordSchema.safeParse({ email: emailInput });
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0].message,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(validation.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  if (error) {
    return {
      success: false,
      error: 'Impossible d’envoyer l’email de réinitialisation.',
    };
  }

  return {
    success: true,
    message: 'Un e-mail de réinitialisation a été envoyé à votre adresse.',
  };
}
