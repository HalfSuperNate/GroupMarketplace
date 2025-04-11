import { useRouter } from "next/router";
import GroupDisplay from "@/components/GroupDisplay";

const GroupPage = () => {
  const { groupName } = useRouter().query as { groupName: string };
  return <GroupDisplay groupName={groupName} />;
};

export default GroupPage;
