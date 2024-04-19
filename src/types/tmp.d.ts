type RoleType = '' | '*' | 'admin' | 'user';
interface UserInfo {
    role: RoleType;
    name: string;
    avatar: string;
    job: string;
    jobName: string;
    email: string;
    organization: string;
    organizationName: string;
    location: string;
    locationName: string;
    introduction: string;
    personalWebsite: string;
    phone: string;
    registrationDate: string;
    accountId: string;
    certification: number;
}
