import { supabase, isSupabaseConfigured } from '../supabase/client';
import type { Database } from '../supabase/types';

export type StudentProfile = Database['public']['Tables']['student_profiles']['Row'];
export type StudentEducation = Database['public']['Tables']['student_education']['Row'];
export type StudentExperience = Database['public']['Tables']['student_experience']['Row'];
export type StudentCertification = Database['public']['Tables']['student_certifications']['Row'];

export interface FullStudentProfile extends StudentProfile {
  education: StudentEducation[];
  experience: StudentExperience[];
  certifications: StudentCertification[];
  email?: string;
  name?: string;
  githubUsername?: string;
}

export const getAllStudents = async (includeInactive = false): Promise<FullStudentProfile[]> => {
  if (!isSupabaseConfigured()) return [];

  let query = supabase
    .from('student_profiles')
    .select(`
      *,
      profiles:user_id (email, full_name, avatar_url),
      education:student_education (*),
      experience:student_experience (*),
      certifications:student_certifications (*)
    `);

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get student profiles:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    ...item,
    name: item.profiles?.full_name || item.name || item.username,
    email: item.profiles?.email || item.email || '',
    githubUsername: item.github_username || item.githubUsername,
    education: item.education || [],
    experience: item.experience || [],
    certifications: item.certifications || [],
  }));
};

export const getStudentByUsername = async (username: string): Promise<FullStudentProfile | null> => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('student_profiles')
    .select(`
      *,
      profiles:user_id (email, full_name, avatar_url),
      education:student_education (*),
      experience:student_experience (*),
      certifications:student_certifications (*)
    `)
    .eq('username', username)
    .single();

  if (error || !data) return null;

  return {
    ...data,
    name: (data as any).profiles?.full_name || (data as any).name || data.username,
    email: (data as any).profiles?.email || (data as any).email || '',
    githubUsername: (data as any).github_username || (data as any).githubUsername,
    education: (data as any).education || [],
    experience: (data as any).experience || [],
    certifications: (data as any).certifications || [],
  };
};

export const getStudentByUserId = async (userId: string): Promise<FullStudentProfile | null> => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('student_profiles')
    .select(`
      *,
      profiles:user_id (email, full_name, avatar_url),
      education:student_education (*),
      experience:student_experience (*),
      certifications:student_certifications (*)
    `)
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  return {
    ...data,
    name: (data as any).profiles?.full_name || (data as any).name || data.username,
    email: (data as any).profiles?.email || (data as any).email || '',
    githubUsername: (data as any).github_username || (data as any).githubUsername,
    education: (data as any).education || [],
    experience: (data as any).experience || [],
    certifications: (data as any).certifications || [],
  };
};

export interface RegisterStudentInput {
  name: string;
  email: string;
  password: string;
  rollNumber?: string;
  course?: string;
  year?: string;
  bio?: string;
  githubUsername: string;
  linkedinUrl?: string;
  interests?: string[];
  skills?: string[];
}

export const registerStudentProfile = async (
  input: RegisterStudentInput
): Promise<FullStudentProfile | null> => {
  if (!isSupabaseConfigured()) {
    console.warn('[TECHSHASTRA] Backend not configured, skipping remote student registration.');
    return null;
  }

  // 1. Sign up user with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      data: {
        full_name: input.name.trim(),
        role: 'student_member',
      },
    },
  });

  if (authError) {
    const msg = authError.message.toLowerCase();
    if (msg.includes('already registered') || msg.includes('user already exists')) {
      throw new Error('EMAIL_EXISTS');
    }
    console.error('Supabase auth.signUp error:', authError);
    throw authError;
  }

  if (!authData.user) {
    throw new Error('Authentication user creation failed.');
  }

  const userId = authData.user.id;
  const username = input.githubUsername.trim().toLowerCase();

  // 2. Insert into student_profiles table
  const { data: studentRecord, error: studentError } = await supabase
    .from('student_profiles')
    .insert({
      user_id: userId,
      username: username,
      github_username: input.githubUsername.trim(),
      roll_number: input.rollNumber?.trim() || null,
      course: input.course?.trim() || null,
      year: input.year?.trim() || null,
      bio: input.bio?.trim() || null,
      linkedin_url: input.linkedinUrl?.trim() || null,
      interests: input.interests || [],
      skills: input.skills || [],
      is_active: true,
    })
    .select()
    .single();

  if (studentError) {
    if (studentError.code === '23505' || studentError.message.includes('student_profiles_username_key')) {
      throw new Error('USERNAME_EXISTS');
    }
    console.error('Failed to create student_profiles record in Supabase:', studentError);
    throw studentError;
  }

  return {
    ...studentRecord,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    githubUsername: input.githubUsername.trim(),
    education: [],
    experience: [],
    certifications: [],
  };
};

export const signInStudentRemote = async (email: string, password: string) => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error || !data.user) {
    return null;
  }

  const student = await getStudentByUserId(data.user.id);
  return {
    user: data.user,
    student,
  };
};

export const updateStudentProfile = async (
  profileId: string,
  updates: Partial<Database['public']['Tables']['student_profiles']['Update']>
) => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('student_profiles')
    .update(updates)
    .eq('id', profileId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ─── EDUCATION / EXPERIENCE / CERTIFICATION MUTATIONS ──────────────────

export const addEducation = async (edu: Database['public']['Tables']['student_education']['Insert']) => {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('student_education').insert(edu).select().single();
  if (error) throw error;
  return data;
};

export const deleteEducation = async (id: string) => {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('student_education').delete().eq('id', id);
  if (error) throw error;
};

export const addExperience = async (exp: Database['public']['Tables']['student_experience']['Insert']) => {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('student_experience').insert(exp).select().single();
  if (error) throw error;
  return data;
};

export const deleteExperience = async (id: string) => {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('student_experience').delete().eq('id', id);
  if (error) throw error;
};

export const addCertification = async (cert: Database['public']['Tables']['student_certifications']['Insert']) => {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('student_certifications').insert(cert).select().single();
  if (error) throw error;
  return data;
};

export const deleteCertification = async (id: string) => {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('student_certifications').delete().eq('id', id);
  if (error) throw error;
};
