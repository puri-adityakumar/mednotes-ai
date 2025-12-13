'use client';

import { Button } from "@/components/ui/button";
import { Calendar, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export function ActionButtons() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3">
      <Button
        onClick={() => router.push('/patient/book-appointment')}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
        size="lg"
      >
        <Calendar className="w-4 h-4 mr-2" />
        Book Appointment
      </Button>
      <Button
        disabled
        variant="outline"
        className="w-full border-zinc-300 dark:border-zinc-700"
        size="lg"
      >
        <FileText className="w-4 h-4 mr-2" />
        Document OCR (TBD)
      </Button>
    </div>
  );
}

