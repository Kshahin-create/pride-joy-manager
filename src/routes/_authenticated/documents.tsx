import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2, FolderArchive } from "lucide-react";
import { DocumentsTab, ExpiringDocsCard } from "@/components/documents-tab";

export const Route = createFileRoute("/_authenticated/documents")({
  component: DocumentsPage,
});

function DocumentsPage() {
  return (
    <div className="p-4 space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <FolderArchive className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">الأرشيف المركزي للمستندات</h1>
      </div>

      <ExpiringDocsCard />

      <Tabs defaultValue="tenants" dir="rtl">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="tenants"><Users className="h-4 w-4 ms-1" /> أرشيف المستأجرين</TabsTrigger>
          <TabsTrigger value="building"><Building2 className="h-4 w-4 ms-1" /> أرشيف البرج</TabsTrigger>
        </TabsList>
        <TabsContent value="tenants" className="mt-4">
          <DocumentsTab entityType="tenant" entityId={null} fixedEntity={false} scope="tenant-side" />
        </TabsContent>
        <TabsContent value="building" className="mt-4">
          <DocumentsTab entityType="building" entityId={null} fixedEntity={false} scope="building-side" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
