export default function PublicAdminLayout({ children }: { children: React.ReactNode }) {
  // Никакой авторизации здесь — чтобы /admin/(public)/login был доступен
  return <>{children}</>;
}
