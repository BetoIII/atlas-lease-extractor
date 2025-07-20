export function useSession() {
  return { data: null }
}

export const signIn = {
  email: async (_opts: any) => ({ data: null })
}

export const signUp = {
  email: async (_opts: any) => ({ data: null })
}

export async function signOut(_opts: any) {
  return
}
