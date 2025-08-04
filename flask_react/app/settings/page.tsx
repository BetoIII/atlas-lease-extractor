"use client"

import { useState } from "react"
import { TrendingUp, Search, FileText, UsersIcon, Shield, Settings, Save, User, Bell, Wallet, Key } from "lucide-react"
import { Button, Input, Label, Switch, Card, CardContent, CardDescription, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
import { Navbar } from "@/components/navbar"
import DashboardSidebar from "@/app/dashboard/components/DashboardSidebar"

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: TrendingUp, href: "/dashboard" },
    { id: "marketplace", label: "Marketplace", icon: Search, href: "/marketplace" },
    { id: "documents", label: "My Documents", icon: FileText, href: "/documents" },
    { id: "contracts", label: "Contracts", icon: UsersIcon, href: "/contracts" },
    { id: "compliance", label: "Compliance", icon: Shield, href: "/compliance" },
    { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
  ]
  const [profileData, setProfileData] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    company: "Real Estate Holdings LLC",
    title: "Portfolio Manager"
  })

  const [privacySettings, setPrivacySettings] = useState({
    shareAnalytics: true,
    allowDataLicensing: true,
    publicProfile: false,
    showActivity: true
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    contractUpdates: true,
    marketplaceActivity: false,
    complianceAlerts: true,
    weeklyReports: true
  })

  const handleProfileSave = () => {
    console.log("Saving profile:", profileData)
  }

  const handlePrivacySave = () => {
    console.log("Saving privacy settings:", privacySettings)
  }

  const handleNotificationSave = () => {
    console.log("Saving notification settings:", notificationSettings)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        sidebarOpen={sidebarOpen} 
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
      />
      <div className="flex">
        <DashboardSidebar 
          open={sidebarOpen} 
          items={navigationItems} 
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 lg:ml-0">
          <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your account, privacy, and notification preferences
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Privacy
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Billing
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal and professional information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={profileData.company}
                        onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title</Label>
                      <Input
                        id="title"
                        value={profileData.title}
                        onChange={(e) => setProfileData(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button onClick={handleProfileSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy & Data Sharing</CardTitle>
                  <CardDescription>
                    Control how your data is used and shared within the Atlas ecosystem
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Share Usage Analytics</Label>
                      <p className="text-sm text-muted-foreground">
                        Help improve Atlas by sharing anonymous usage data
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.shareAnalytics}
                      onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, shareAnalytics: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Allow Data Licensing</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable others to license your uploaded documents
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.allowDataLicensing}
                      onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, allowDataLicensing: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Public Profile</Label>
                      <p className="text-sm text-muted-foreground">
                        Make your profile visible to other Atlas members
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.publicProfile}
                      onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, publicProfile: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Show Activity</Label>
                      <p className="text-sm text-muted-foreground">
                        Display your recent activity to connected users
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.showActivity}
                      onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showActivity: checked }))}
                    />
                  </div>
                  <Button onClick={handlePrivacySave}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Privacy Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose how and when you want to be notified
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive general notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Contract Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about contract status changes
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.contractUpdates}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, contractUpdates: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Marketplace Activity</Label>
                      <p className="text-sm text-muted-foreground">
                        Stay informed about new marketplace listings
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.marketplaceActivity}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, marketplaceActivity: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Compliance Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Important notifications about compliance issues
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.complianceAlerts}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, complianceAlerts: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Weekly Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive weekly summaries of your activity and earnings
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.weeklyReports}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, weeklyReports: checked }))}
                    />
                  </div>
                  <Button onClick={handleNotificationSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Notification Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Billing & Payments</CardTitle>
                  <CardDescription>
                    Manage your payment methods and billing information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Current Balance</h4>
                    <p className="text-2xl font-bold">$2,450.00 USDC</p>
                    <p className="text-sm text-muted-foreground">Available for withdrawal</p>
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full">
                      Add Payment Method
                    </Button>
                    <Button variant="outline" className="w-full">
                      Withdraw Earnings
                    </Button>
                    <Button variant="outline" className="w-full">
                      View Transaction History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your account security and authentication
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full">
                      Change Password
                    </Button>
                    <Button variant="outline" className="w-full">
                      Enable Two-Factor Authentication
                    </Button>
                    <Button variant="outline" className="w-full">
                      View Active Sessions
                    </Button>
                    <Button variant="outline" className="w-full">
                      Download Account Data
                    </Button>
                  </div>
                  <div className="border-t pt-4">
                    <Button variant="destructive" className="w-full">
                      Delete Account
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      This action cannot be undone and will permanently delete your account and all associated data.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          </div>
          </div>
        </main>
      </div>
    </div>
  )
}