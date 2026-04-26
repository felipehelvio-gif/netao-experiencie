// Layout raiz do admin — apenas passa adiante.
// O layout protegido fica em app/admin/(secure)/layout.tsx.
// O login fica em app/admin/login/page.tsx (sem shell autenticado).
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
