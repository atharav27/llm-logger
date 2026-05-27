export type AuthActor = 'USER';

export type AuthTokenType = 'access' | 'refresh';

export interface AuthTokenPayload {
  sub: string;
  email: string;
  actor: AuthActor;
  type: AuthTokenType;
}
