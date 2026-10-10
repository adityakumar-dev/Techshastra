export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'editor'
  | 'viewer'
  | 'student_member'
  | 'public';

export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
export type BlogCategory = 'blog' | 'news' | 'announcement';
export type PublicationType = 'paper' | 'book';
export type SocialPlatform = 'instagram' | 'linkedin' | 'twitter' | 'facebook' | 'other';
export type ContactStatus = 'new' | 'read' | 'in_progress' | 'resolved' | 'archived';
export type ApplicationStatus = 'pending' | 'under_review' | 'accepted' | 'rejected' | 'withdrawn';
export type CertificateStatus = 'active' | 'revoked' | 'expired';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          avatar_url: string | null;
          phone: string | null;
          is_blocked: boolean;
          blocked_at: string | null;
          block_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: UserRole;
          avatar_url?: string | null;
          phone?: string | null;
          is_blocked?: boolean;
          blocked_at?: string | null;
          block_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      student_profiles: {
        Row: {
          id: string;
          user_id: string;
          username: string;
          roll_number: string | null;
          course: string | null;
          branch: string | null;
          year: string | null;
          semester: string | null;
          bio: string | null;
          location: string | null;
          github_username: string;
          linkedin_url: string | null;
          portfolio_url: string | null;
          skills: string[];
          interests: string[];
          resume_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          username: string;
          roll_number?: string | null;
          course?: string | null;
          branch?: string | null;
          year?: string | null;
          semester?: string | null;
          bio?: string | null;
          location?: string | null;
          github_username: string;
          linkedin_url?: string | null;
          portfolio_url?: string | null;
          skills?: string[];
          interests?: string[];
          resume_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['student_profiles']['Insert']>;
      };
      student_education: {
        Row: {
          id: string;
          student_profile_id: string;
          institution: string;
          degree: string;
          field: string | null;
          start_year: string;
          end_year: string | null;
          grade: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_profile_id: string;
          institution: string;
          degree: string;
          field?: string | null;
          start_year: string;
          end_year?: string | null;
          grade?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['student_education']['Insert']>;
      };
      student_experience: {
        Row: {
          id: string;
          student_profile_id: string;
          company: string;
          role: string;
          start_date: string;
          end_date: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_profile_id: string;
          company: string;
          role: string;
          start_date: string;
          end_date?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['student_experience']['Insert']>;
      };
      student_certifications: {
        Row: {
          id: string;
          student_profile_id: string;
          name: string;
          issuer: string;
          issue_date: string | null;
          url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_profile_id: string;
          name: string;
          issuer: string;
          issue_date?: string | null;
          url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['student_certifications']['Insert']>;
      };
      admin_credentials: {
        Row: {
          id: string;
          name: string;
          mobile: string;
          dob: string;
          email: string | null;
          role: string;
          is_blocked: boolean;
          blocked_at: string | null;
          block_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          mobile: string;
          dob: string;
          email?: string | null;
          role?: string;
          is_blocked?: boolean;
          blocked_at?: string | null;
          block_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['admin_credentials']['Insert']>;
      };
      admin_sessions: {
        Row: {
          id: string;
          user_id: string | null;
          admin_credential_id: string | null;
          admin_name: string | null;
          session_token: string;
          ip_address: string | null;
          user_agent: string | null;
          browser: string | null;
          device: string | null;
          login_time: string;
          last_activity: string;
          is_active: boolean;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          admin_credential_id?: string | null;
          admin_name?: string | null;
          session_token: string;
          ip_address?: string | null;
          user_agent?: string | null;
          browser?: string | null;
          device?: string | null;
          login_time?: string;
          last_activity?: string;
          is_active?: boolean;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['admin_sessions']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          actor_name: string;
          actor_role: UserRole;
          action: string;
          entity_type: string;
          entity_id: string | null;
          details: Json;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          actor_name: string;
          actor_role: UserRole;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          details?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
      };
      page_visibility: {
        Row: {
          id: string;
          page_path: string;
          page_name: string;
          is_visible: boolean;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          page_path: string;
          page_name: string;
          is_visible?: boolean;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['page_visibility']['Insert']>;
      };
      projects: {
        Row: {
          id: string;
          title: string;
          description: string;
          image_url: string | null;
          tags: string[];
          lead_name: string;
          designer_name: string | null;
          github_url: string;
          demo_url: string | null;
          status: string;
          language: string;
          is_published: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          image_url?: string | null;
          tags?: string[];
          lead_name: string;
          designer_name?: string | null;
          github_url: string;
          demo_url?: string | null;
          status?: string;
          language?: string;
          is_published?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['projects']['Insert']>;
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string;
          long_description: string | null;
          image_url: string | null;
          event_date: string;
          location: string | null;
          max_attendees: number | null;
          status: EventStatus;
          featured: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          long_description?: string | null;
          image_url?: string | null;
          event_date: string;
          location?: string | null;
          max_attendees?: number | null;
          status?: EventStatus;
          featured?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
      };
      event_registrations: {
        Row: {
          id: string;
          event_id: string;
          user_id: string | null;
          name: string;
          email: string;
          phone: string | null;
          status: string;
          attended: boolean;
          registered_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id?: string | null;
          name: string;
          email: string;
          phone?: string | null;
          status?: string;
          attended?: boolean;
          registered_at?: string;
        };
        Update: Partial<Database['public']['Tables']['event_registrations']['Insert']>;
      };
      blog_posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          excerpt: string;
          content: string;
          image_url: string | null;
          category: BlogCategory;
          author_id: string | null;
          author_name: string;
          published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          excerpt: string;
          content: string;
          image_url?: string | null;
          category?: BlogCategory;
          author_id?: string | null;
          author_name: string;
          published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['blog_posts']['Insert']>;
      };
      publications: {
        Row: {
          id: string;
          title: string;
          authors: string;
          description: string;
          type: PublicationType;
          file_url: string | null;
          link_url: string | null;
          isbn_doi: string | null;
          published_at: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          authors: string;
          description: string;
          type?: PublicationType;
          file_url?: string | null;
          link_url?: string | null;
          isbn_doi?: string | null;
          published_at: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['publications']['Insert']>;
      };
      gallery_photos: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          image_url: string;
          category: string | null;
          order_index: number | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          image_url: string;
          category?: string | null;
          order_index?: number | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['gallery_photos']['Insert']>;
      };
      learning_resources: {
        Row: {
          id: string;
          title: string;
          description: string;
          url: string;
          category: string;
          difficulty: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          url: string;
          category: string;
          difficulty?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['learning_resources']['Insert']>;
      };
      faqs: {
        Row: {
          id: string;
          question: string;
          answer: string;
          category: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question: string;
          answer: string;
          category?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['faqs']['Insert']>;
      };
      achievements: {
        Row: {
          id: string;
          title: string;
          description: string;
          image_url: string | null;
          achievement_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          image_url?: string | null;
          achievement_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['achievements']['Insert']>;
      };
      social_links: {
        Row: {
          id: string;
          platform: SocialPlatform;
          content: string;
          url: string;
          image_url: string | null;
          author: string | null;
          posted_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          platform: SocialPlatform;
          content: string;
          url: string;
          image_url?: string | null;
          author?: string | null;
          posted_at?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['social_links']['Insert']>;
      };
      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          subject: string;
          message: string;
          status: ContactStatus;
          priority: string | null;
          assigned_to: string | null;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          subject: string;
          message: string;
          status?: ContactStatus;
          priority?: string | null;
          assigned_to?: string | null;
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['contact_messages']['Insert']>;
      };
      membership_applications: {
        Row: {
          id: string;
          applicant_type: string;
          name: string;
          email: string;
          phone: string;
          organization: string | null;
          academic_details: Json;
          interests: string[];
          reason: string;
          github_username: string | null;
          linkedin_url: string | null;
          status: ApplicationStatus;
          reviewer_id: string | null;
          review_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          applicant_type: string;
          name: string;
          email: string;
          phone: string;
          organization?: string | null;
          academic_details?: Json;
          interests?: string[];
          reason: string;
          github_username?: string | null;
          linkedin_url?: string | null;
          status?: ApplicationStatus;
          reviewer_id?: string | null;
          review_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['membership_applications']['Insert']>;
      };
      certificates: {
        Row: {
          id: string;
          verification_id: string;
          recipient_name: string;
          recipient_email: string;
          event_name: string;
          issue_date: string;
          certificate_url: string | null;
          status: CertificateStatus;
          metadata: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          verification_id: string;
          recipient_name: string;
          recipient_email: string;
          event_name: string;
          issue_date?: string;
          certificate_url?: string | null;
          status?: CertificateStatus;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['certificates']['Insert']>;
      };
      certificate_jobs: {
        Row: {
          id: string;
          created_by: string | null;
          total_recipients: number;
          successful_sends: number;
          failed_sends: number;
          status: string;
          error_log: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_by?: string | null;
          total_recipients?: number;
          successful_sends?: number;
          failed_sends?: number;
          status?: string;
          error_log?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['certificate_jobs']['Insert']>;
      };
    };
  };
}
