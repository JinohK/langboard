interface IUser {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    username: string;
    avatar?: string;
    groups?: string[];
}

export default IUser;
