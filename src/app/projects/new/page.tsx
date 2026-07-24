"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ProjectForm } from "@/components/projects/ProjectForm";

export default function NewProjectPage() {
  const router = useRouter();
  return (
    <div>
      <PageHeader
        title="Add New Project"
        description="Create once — portfolio metrics update automatically."
        actions={
          <Button variant="ghost" onClick={() => router.push("/projects")}>
            <ArrowLeft className="h-4 w-4" />
            Back to projects
          </Button>
        }
      />
      <ProjectForm />
    </div>
  );
}
