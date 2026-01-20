import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  Shield, 
  Key, 
  Smartphone, 
  Link2, 
  ArrowLeft, 
  CheckCircle, 
  XCircle,
  Mail,
  Lock,
  Loader2,
  Unlink
} from "lucide-react";

interface ConnectedAccount {
  provider: string;
  email: string | null;
  connected: boolean;
  canDisconnect: boolean;
}

export default function SecuritySettings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  
  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [enabling2FA, setEnabling2FA] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  
  // Connected accounts state
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  
  // Session state
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSecurityInfo();
    }
  }, [user]);

  const fetchSecurityInfo = async () => {
    if (!user) return;
    
    setLoadingAccounts(true);
    try {
      // Check connected providers from user identities
      const identities = user.identities || [];
      const hasEmailProvider = identities.some(i => i.provider === 'email');
      const hasGoogleProvider = identities.some(i => i.provider === 'google');
      
      const accounts: ConnectedAccount[] = [
        {
          provider: 'email',
          email: hasEmailProvider ? user.email : null,
          connected: hasEmailProvider,
          canDisconnect: identities.length > 1 && hasEmailProvider,
        },
        {
          provider: 'google',
          email: hasGoogleProvider ? identities.find(i => i.provider === 'google')?.identity_data?.email : null,
          connected: hasGoogleProvider,
          canDisconnect: identities.length > 1 && hasGoogleProvider,
        },
      ];
      
      setConnectedAccounts(accounts);
      
      // Get last sign in
      if (user.last_sign_in_at) {
        setLastSignIn(new Date(user.last_sign_in_at).toLocaleString());
      }
      
      // Check 2FA status (Supabase MFA)
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors?.totp && factors.totp.length > 0) {
        const verifiedFactor = factors.totp.find(f => f.status === 'verified');
        setTwoFactorEnabled(!!verifiedFactor);
      }
    } catch (error) {
      console.error("Error fetching security info:", error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setChangingPassword(true);
    try {
      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      });

      if (signInError) {
        toast.error("Current password is incorrect");
        setChangingPassword(false);
        return;
      }

      // Update to new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleEnable2FA = async () => {
    setEnabling2FA(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });

      if (error) throw error;

      if (data) {
        setShow2FASetup(true);
        toast.info("Scan the QR code with your authenticator app");
        // In a real implementation, you'd show a QR code and verify the TOTP
        // For now, we'll show a simplified setup
      }
    } catch (error: any) {
      console.error("Error enabling 2FA:", error);
      toast.error(error.message || "Failed to enable 2FA");
    } finally {
      setEnabling2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors?.totp && factors.totp.length > 0) {
        const factorId = factors.totp[0].id;
        const { error } = await supabase.auth.mfa.unenroll({ factorId });
        
        if (error) throw error;
        
        setTwoFactorEnabled(false);
        toast.success("Two-factor authentication disabled");
      }
    } catch (error: any) {
      console.error("Error disabling 2FA:", error);
      toast.error(error.message || "Failed to disable 2FA");
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/security-settings`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Error connecting Google:", error);
      toast.error(error.message || "Failed to connect Google account");
    }
  };

  const handleDisconnectProvider = async (provider: string) => {
    try {
      const identity = user?.identities?.find(i => i.provider === provider);
      if (!identity) {
        toast.error("Identity not found");
        return;
      }

      const { error } = await supabase.auth.unlinkIdentity(identity);
      
      if (error) throw error;
      
      toast.success(`${provider} account disconnected`);
      fetchSecurityInfo();
    } catch (error: any) {
      console.error("Error disconnecting provider:", error);
      toast.error(error.message || `Failed to disconnect ${provider}`);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        );
      case 'email':
        return <Mail className="w-5 h-5" />;
      default:
        return <Link2 className="w-5 h-5" />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container max-w-4xl py-24 px-4">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/profile")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Button>

        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Security Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account security and connected accounts
          </p>
        </div>

        <div className="space-y-6">
          {/* Last Sign In */}
          {lastSignIn && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Session Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Last sign in: <span className="text-foreground font-medium">{lastSignIn}</span>
                </p>
              </CardContent>
            </Card>
          )}

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={changingPassword}>
                  {changingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Update Password
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Two-Factor Authentication (2FA)
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Authenticator App</span>
                    {twoFactorEnabled ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Enabled
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="h-3 w-3 mr-1" />
                        Disabled
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use an authenticator app like Google Authenticator or Authy
                  </p>
                </div>
                {twoFactorEnabled ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        Disable
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Disable Two-Factor Authentication?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will make your account less secure. Are you sure you want to disable 2FA?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDisable2FA}>
                          Disable 2FA
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button 
                    onClick={handleEnable2FA} 
                    disabled={enabling2FA}
                    size="sm"
                  >
                    {enabling2FA ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      "Enable"
                    )}
                  </Button>
                )}
              </div>

              {show2FASetup && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Two-factor authentication setup requires scanning a QR code with your authenticator app.
                    This feature is being configured for your account.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setShow2FASetup(false);
                      fetchSecurityInfo();
                    }}
                  >
                    Close Setup
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Connected Accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Connected Accounts
              </CardTitle>
              <CardDescription>
                Manage your linked accounts and sign-in methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAccounts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {connectedAccounts.map((account, index) => (
                    <div key={account.provider}>
                      {index > 0 && <Separator className="my-4" />}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-muted">
                            {getProviderIcon(account.provider)}
                          </div>
                          <div>
                            <p className="font-medium capitalize">{account.provider}</p>
                            {account.connected && account.email && (
                              <p className="text-sm text-muted-foreground">{account.email}</p>
                            )}
                          </div>
                        </div>
                        {account.connected ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-green-500">
                              Connected
                            </Badge>
                            {account.canDisconnect && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Unlink className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Disconnect {account.provider}?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      You won't be able to sign in with this {account.provider} account anymore.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDisconnectProvider(account.provider)}>
                                      Disconnect
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={account.provider === 'google' ? handleConnectGoogle : undefined}
                          >
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Verification Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">{user?.email}</p>
                    <p className="text-sm text-muted-foreground">Primary email address</p>
                  </div>
                </div>
                {user?.email_confirmed_at ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Verified
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
