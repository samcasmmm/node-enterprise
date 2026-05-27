export interface AuthenticatedUser {
  id: number;
  userName: string;
}

export interface AuthSession {
  token: string;
  user: AuthenticatedUser;
}
