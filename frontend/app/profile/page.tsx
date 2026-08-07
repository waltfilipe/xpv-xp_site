import { ProfilePageBody } from "@/components/ProfilePageBody";
import { ProfilePageHero } from "@/components/ProfilePageHero";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProfilePage({ searchParams }: Props) {
  await searchParams;

  return (
    <div className="profile-page">
      <ProfilePageHero />
      <div className="container profile-page-body">
        <ProfilePageBody />
      </div>
    </div>
  );
}
