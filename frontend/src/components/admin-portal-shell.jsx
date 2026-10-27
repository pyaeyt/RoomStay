import Link from "next/link";
import { AdminDemoSeed } from "@/components/admin-demo-seed";
import { Icon } from "@/components/icon";
const navItems = [
    { label: "Dashboard", href: "/admin", icon: "homeFilled", section: "Dashboard" },
    { label: "Partner Applications", href: "/admin/partner-applications", icon: "user", section: "Partner Applications" },
    { label: "Listings", href: "/admin/listings", icon: "apartment", section: "Listings" },
    { label: "Users", href: "/admin/users", icon: "user", section: "Users" },
    { label: "Reviews", href: "/admin/reviews", icon: "star", section: "Reviews" },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: "bell", section: "Audit Logs" },
    { label: "Reports", href: "/admin/reports", icon: "filter", section: "Reports" },
    { label: "Payment chats", href: "/admin/payment-chats", icon: "messages", section: "Payment chats" },
];
export function AdminPortalShell({ activeSection, children }) {
    return (<div className="min-h-dvh bg-canvas">
      <AdminDemoSeed />
      <a href="#admin-content" className="sr-only z-50 rounded-lg bg-white p-3 text-primary focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to admin content
      </a>

      <div className="mx-auto grid max-w-[1440px] gap-6 px-[22px] py-6 pb-[calc(96px+env(safe-area-inset-bottom))] md:px-8 md:py-8 lg:grid-cols-[280px_minmax(0,1fr)] xl:px-12">
        <aside className="rounded-3xl border border-line bg-white p-4 shadow-sm shadow-ink/5 lg:sticky lg:top-8 lg:self-start lg:p-5">
          <Link href="/admin" className="flex items-center gap-3 rounded-2xl bg-primary-tint px-4 py-3 text-primary">
            <Icon name="brand" size={38}/>
            <span>
              <span className="block text-lg font-semibold tracking-[-0.035em] text-ink">RoomStay</span>
              <span className="block text-xs font-semibold text-primary">Admin Portal</span>
            </span>
          </Link>

          <nav aria-label="Admin navigation" className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {navItems.map((item) => {
            const active = item.section === activeSection;
            if (!item.href) {
                return (<span key={item.label} aria-disabled="true" title={`${item.label} is not available yet`} className="flex min-h-11 cursor-not-allowed items-center gap-3 rounded-xl px-3 text-sm font-semibold text-ink-secondary/50">
                    <Icon name={item.icon} size={20}/>
                    {item.label}
                    <span className="ml-auto rounded-full bg-canvas px-2 py-0.5 text-[11px] font-semibold text-ink-secondary ring-1 ring-inset ring-line">
                      Soon
                    </span>
                  </span>);
            }
            return (<Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${active ? "bg-primary text-white" : "text-ink-secondary hover:bg-canvas hover:text-ink"}`}>
                  <Icon name={item.icon} size={20}/>
                  {item.label}
                </Link>);
        })}
          </nav>

          <Link href="/" className="mt-4 flex min-h-11 items-center justify-center rounded-xl border border-line bg-white px-3 text-sm font-semibold text-ink btn-secondary">
            Back to RoomStay
          </Link>
        </aside>

        <main id="admin-content" className="min-w-0">
          {children}
        </main>
      </div>
    </div>);
}
