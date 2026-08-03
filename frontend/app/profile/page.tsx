import { ProfilePageBody } from "@/components/ProfilePageBody";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProfilePage({ searchParams }: Props) {
  await searchParams;

  return (
    <div className="profile-page">
      <header className="profile-page-hero">
        <div className="container profile-page-hero-inner">
          <div className="profile-page-hero-copy">
            <span className="profile-page-eyebrow">Pass Scout</span>
            <h1>Player Profile</h1>
            <p>
              Análise completa por posição — xP, pass scores, índices e mapas de origem.
              Rankings dentro do pool selecionado.
            </p>
          </div>
        </div>
      </header>

      <div className="container profile-page-body">
        <ProfilePageBody />
      </div>
    </div>
  );
}
