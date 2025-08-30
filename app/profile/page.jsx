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
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", padding: "1rem" }}>
      <div
        style={{
          maxWidth: "64rem",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h1 style={{ fontSize: "1.875rem", fontWeight: "bold" }}>Profile Details</h1>
          <Button onClick={() => signOut({ callbackUrl: "/" })} variant="outline">
            Sign Out
          </Button>
        </div>

        <div
          style={{
            display: "grid",
            gap: "1.5rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(20rem, 1fr))",
          }}
        >
          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <Avatar style={{ height: "3rem", width: "3rem" }}>
                  <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                  <AvatarFallback>{session.user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                User Profile
              </CardTitle>
            </CardHeader>
            <CardContent
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#6b7280",
                  }}
                >
                  Name
                </label>
                <p style={{ fontSize: "1.125rem" }}>{session.user?.name || "Not provided"}</p>
              </div>
              <div>
                <label
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#6b7280",
                  }}
                >
                  Email
                </label>
                <p style={{ fontSize: "1.125rem" }}>{session.user?.email || "Not provided"}</p>
              </div>
              <div>
                <label
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#6b7280",
                  }}
                >
                  Profile Image
                </label>
                <p style={{ fontSize: "0.875rem", wordBreak: "break-all" }}>
                  {session.user?.image || "Not provided"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Session Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Session Information</CardTitle>
            </CardHeader>
            <CardContent
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#6b7280",
                  }}
                >
                  Session Status
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginTop: "0.25rem",
                  }}
                >
                  <Badge variant="default">Authenticated</Badge>
                </div>
              </div>
              <div>
                <label
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#6b7280",
                  }}
                >
                  Provider
                </label>
                <p style={{ fontSize: "1.125rem" }}>Google</p>
              </div>
              <div>
                <label
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#6b7280",
                  }}
                >
                  Session Expires
                </label>
                <p style={{ fontSize: "0.875rem" }}>
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
            <pre
              style={{
                backgroundColor: "#e5e7eb",
                padding: "1rem",
                borderRadius: "0.5rem",
                overflow: "auto",
                fontSize: "0.875rem",
              }}
            >
              {JSON.stringify(session, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );

}
