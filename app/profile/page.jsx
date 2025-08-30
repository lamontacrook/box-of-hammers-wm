"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default function ProfilePage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div
          style={{
            animation: 'spin 1s linear infinite',
            borderRadius: '50%',
            height: '2rem',
            width: '2rem',
            borderBottom: '2px solid #3b82f6',
          }}
        />
      </div>
    )
  }

  if (!session) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card style={{ width: '100%', maxWidth: '28rem' }}>
          <CardHeader>
            <CardTitle>Not Authenticated</CardTitle>
            <CardDescription>Please sign in to view your profile</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div style="min-height: 100vh; background-color: #f9fafb; padding: 1rem;">
      <div style="max-width: 64rem; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h1 style="font-size: 1.875rem; font-weight: bold;">Profile Details</h1>
          <Button onClick={() => signOut({ callbackUrl: "/" })} variant="outline">
            Sign Out
          </Button>
        </div>

        <div style="display: grid; grid-gap: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));">
          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle style="display: flex; align-items: center; gap: 0.75rem;">
                <Avatar style="height: 3rem; width: 3rem;">
                  <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                  <AvatarFallback>{session.user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                User Profile
              </CardTitle>
            </CardHeader>
            <CardContent style="display: flex; flex-direction: column; gap: 1rem;">
              <div>
                <label style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">Name</label>
                <p style="font-size: 1.125rem;">{session.user?.name || "Not provided"}</p>
              </div>
              <div>
                <label style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">Email</label>
                <p style="font-size: 1.125rem;">{session.user?.email || "Not provided"}</p>
              </div>
              <div>
                <label style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">Profile Image</label>
                <p style="font-size: 0.875rem; word-break: break-all;">{session.user?.image || "Not provided"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Session Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Session Information</CardTitle>
            </CardHeader>
            <CardContent style="display: flex; flex-direction: column; gap: 1rem;">
              <div>
                <label style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">Session Status</label>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem;">
                  <Badge variant="default">Authenticated</Badge>
                </div>
              </div>
              <div>
                <label style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">Provider</label>
                <p style="font-size: 1.125rem;">Google</p>
              </div>
              <div>
                <label style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">Session Expires</label>
                <p style="font-size: 0.875rem;">
                  {session.expires ? new Date(session.expires).toLocaleString() : "Not available"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Raw Session Data Card */}
        <Card>
          <CardHeader>
            <CardTitle>Raw Session Data</CardTitle>
            <CardDescription>Complete session object returned by NextAuth</CardDescription>
          </CardHeader>
          <CardContent>
            <pre style="background-color: #e5e7eb; padding: 1rem; border-radius: 0.5rem; overflow: auto; font-size: 0.875rem;">
              {JSON.stringify(session, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
