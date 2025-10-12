import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateRequest {
  oldEmail: string;
  newEmail: string;
  newPassword: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { oldEmail, newEmail, newPassword }: UpdateRequest = await req.json();

    console.log(`Attempting to update user from ${oldEmail} to ${newEmail}`);

    // Find user by old email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      throw listError;
    }

    const user = users.users.find(u => u.email === oldEmail);
    
    if (!user) {
      console.error(`User with email ${oldEmail} not found`);
      return new Response(
        JSON.stringify({ error: `User with email ${oldEmail} not found` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update user email and password
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        email: newEmail,
        password: newPassword,
        email_confirm: true, // Auto-confirm email
      }
    );

    if (updateError) {
      console.error('Error updating user:', updateError);
      throw updateError;
    }

    console.log(`Successfully updated user ${oldEmail} to ${newEmail}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User updated from ${oldEmail} to ${newEmail}`,
        userId: updatedUser.user.id 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in update-user-credentials function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
