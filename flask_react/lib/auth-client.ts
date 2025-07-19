import { createAuthClient } from 'better-auth/react'

const client = createAuthClient()

export const { signIn, signOut, useSession } = client
