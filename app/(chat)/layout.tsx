import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import Script from 'next/script';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { session: supabaseSession },
  } = await supabase.auth.getSession();
  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  // Convert user data for sidebar
  const user = supabaseSession?.user
    ? {
        id: supabaseSession.user.id,
        email: supabaseSession.user.email,
        image: supabaseSession.user.user_metadata?.avatar_url,
        user_metadata: supabaseSession.user.user_metadata,
      }
    : undefined;

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <SidebarProvider defaultOpen={!isCollapsed}>
        <AppSidebar user={user} />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </>
  );
}
