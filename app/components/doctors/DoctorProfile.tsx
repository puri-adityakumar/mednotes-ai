import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Stethoscope, Clock } from "lucide-react";

export function DoctorProfile() {
  return (
    <Card className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden relative">
      <div className="h-32 bg-gradient-to-r from-teal-500 to-emerald-600"></div>
      <CardContent className="pt-0 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-12 mb-6 gap-4">
          <Avatar className="w-24 h-24 border-4 border-white dark:border-zinc-900 shadow-md">
            <AvatarImage src="/images/doctor-avatar.jpg" alt="Dr. Sarah Wilson" />
            <AvatarFallback className="bg-teal-100 text-teal-700 text-xl font-bold">SW</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1 mt-2 sm:mt-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dr. Sarah Wilson</h2>
            <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Stethoscope className="w-4 h-4" />
                ardiologist
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Central Hospital, New York
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                15 Years Exp.
              </span>
            </div>
          </div>
          <div className="mt-4 sm:mt-0">
            <Badge variant="secondary" className="px-4 py-1.5 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800">
              Available Today
            </Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100 dark:border-zinc-800">
            <div className="flex flex-col">
                <span className="text-sm text-gray-500 dark:text-gray-400">Specialization</span>
                <span className="font-medium text-gray-900 dark:text-gray-200">Interventional Cardiology</span>
            </div>
            <div className="flex flex-col">
                <span className="text-sm text-gray-500 dark:text-gray-400">License ID</span>
                <span className="font-medium text-gray-900 dark:text-gray-200">MED-NY-2024-8892</span>
            </div>
            <div className="flex flex-col">
                <span className="text-sm text-gray-500 dark:text-gray-400">Contact</span>
                <span className="font-medium text-gray-900 dark:text-gray-200">dr.sarah@mednotes.ai</span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
