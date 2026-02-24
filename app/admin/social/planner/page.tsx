"use client";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";
import { useAdminAuth } from "@/app/admin/_components/AdminAuthProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Calendar, BarChart3, Users } from "lucide-react";
import { useState } from "react";
import dynamic from "next/dynamic";

const PostCreator = dynamic(() => import("./_components/PostCreator"), { ssr: false });
const PostList = dynamic(() => import("./_components/PostList"), { ssr: false });
const PostCalendar = dynamic(() => import("./_components/PostCalendar"), { ssr: false });
const AccountsList = dynamic(() => import("./_components/AccountsList"), { ssr: false });
const AnalyticsSummary = dynamic(() => import("./_components/AnalyticsSummary"), { ssr: false });

export default function SocialPlannerPage() {
  const { user } = useAdminAuth();
  const [showCreator, setShowCreator] = useState(false);

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Social Planner</h1>
            <p className="text-muted-foreground">
              Plánování a publikování příspěvků přes GenViral
            </p>
          </div>
          <Button onClick={() => setShowCreator(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nový příspěvek
          </Button>
        </div>

        <Tabs defaultValue="posts">
          <TabsList>
            <TabsTrigger value="posts" className="gap-2">
              <FileText className="h-4 w-4" />
              Příspěvky
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="h-4 w-4" />
              Kalendář
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytika
            </TabsTrigger>
            <TabsTrigger value="accounts" className="gap-2">
              <Users className="h-4 w-4" />
              Účty
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            <PostList />
          </TabsContent>
          <TabsContent value="calendar">
            <PostCalendar />
          </TabsContent>
          <TabsContent value="analytics">
            <AnalyticsSummary />
          </TabsContent>
          <TabsContent value="accounts">
            <AccountsList />
          </TabsContent>
        </Tabs>

        {showCreator && <PostCreator onClose={() => setShowCreator(false)} />}
      </main>
    </div>
  );
}
