"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Button, Input, Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui"
import { signIn } from "@/lib/auth-client"

interface SignInData {
  email: string
  password: string
}

export default function SignInPage() {
  const router = useRouter()
  const form = useForm<SignInData>({
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (data: SignInData) => {
    const res = await signIn.email({ email: data.email, password: data.password })
    if (res?.data?.user) {
      router.push("/dashboard")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full max-w-sm">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">Sign In</Button>
        </form>
      </Form>
    </div>
  )
}
