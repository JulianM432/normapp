export type LoginState = {
  error: string | null;
  lockedUntil: number | null;
};

export const initialLoginState: LoginState = { error: null, lockedUntil: null };
