import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { User, Mail, Phone, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export async function PatientProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const firstName = profile?.first_name || "";
  const lastName = profile?.last_name || "";
  const fullName = firstName || lastName ? `${firstName} ${lastName}`.trim() : "Patient Profile";
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || "P";
  const email = profile?.email || user.email || "";
  const phone = profile?.phone || "Not provided";
  const dob = profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : "Not provided";

  return (
    <Card className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="w-20 h-20 border-2 border-teal-200 dark:border-teal-800">
            <AvatarImage src="/images/patient-avatar.jpg" alt={fullName} />
            <AvatarFallback className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-lg font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-teal-600" />
                {fullName}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Mail className="w-4 h-4 text-teal-600" />
                <span className="text-sm">{email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Phone className="w-4 h-4 text-teal-600" />
                <span className="text-sm">{phone}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span className="text-sm">DOB: {dob}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

