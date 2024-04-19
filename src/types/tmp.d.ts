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


interface UserInfoCanModified {
    name: string;
    avatar: string;
    email: string;
    job: string;
    job_name: string;
    organization: string;
    organization_name: string;
    location: string;
    location_name: string;
    introduction: string;
    personal_website: string;
    phone: string;
}
