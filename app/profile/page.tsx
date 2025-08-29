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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Not Authenticated</CardTitle>
            <CardDescription>Please sign in to view your profile</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Profile Details</h1>
          <Button onClick={() => signOut({ callbackUrl: "/" })} variant="outline">
            Sign Out
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                  <AvatarFallback>{session.user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                User Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-lg">{session.user?.name || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-lg">{session.user?.email || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Profile Image</label>
                <p className="text-sm break-all">{session.user?.image || "Not provided"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Session Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Session Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Session Status</label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="default">Authenticated</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Provider</label>
                <p className="text-lg">Google</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Session Expires</label>
                <p className="text-sm">
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
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">{JSON.stringify(session, null, 2)}</pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
