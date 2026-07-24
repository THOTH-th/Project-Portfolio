"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, FolderX } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { Card } from "@/components/ui/Card";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { useData } from "@/context/DataContext";

export default function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const projectId = decodeURIComponent(id);
  const { state, hydrated } = useData();
  const project = state.projects.find((p) => p.id === projectId);

  if (hydrated && !project) {
    return (
      <Card className="mt-6">
        <EmptyState
          icon={<FolderX className="h-6 w-6" />}
          title="Project not found"
          description="This project may have been deleted."
          action={
            <Link href="/projects">
              <Button variant="outline">Back to projects</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        title={project ? `Edit ${project.name}` : "Edit Project"}
        description="Update project details — changes sync to the dashboard."
        actions={
          <Link
            href={`/projects/${encodeURIComponent(projectId)}`}
          >
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4" />
              Back to project
            </Button>
          </Link>
        }
      />
      {project ? <ProjectForm existing={project} /> : null}
    </div>
  );
}
