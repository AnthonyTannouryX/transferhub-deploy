import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeftRight, Mail, User, Building2, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { RegisterData, LoginData } from "@/services/authApi";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import OpeningHoursSelector, { OpeningHours } from "@/components/OpeningHoursSelector";
import LocationPicker from "@/components/LocationPicker";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<"personal" | "agent">("personal");
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [signupPassword, setSignupPassword] = useState("");
  const [storeLocation, setStoreLocation] = useState({ lat: 33.8886, lng: 35.4955 }); // Default to Beirut
  const [openingHours, setOpeningHours] = useState<OpeningHours>({
    monday: { isOpen: false, hours: [{ open: '09:00', close: '17:00' }] },
    tuesday: { isOpen: false, hours: [{ open: '09:00', close: '17:00' }] },
    wednesday: { isOpen: false, hours: [{ open: '09:00', close: '17:00' }] },
    thursday: { isOpen: false, hours: [{ open: '09:00', close: '17:00' }] },
    friday: { isOpen: false, hours: [{ open: '09:00', close: '17:00' }] },
    saturday: { isOpen: false, hours: [{ open: '09:00', close: '17:00' }] },
    sunday: { isOpen: false, hours: [{ open: '09:00', close: '17:00' }] },
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login, register } = useAuth();

  // Check for success messages from navigation state
  useEffect(() => {
    const successMessage = location.state?.message;
    if (successMessage) {
      toast({
        title: "Success!",
        description: successMessage,
      });
    }
  }, [location.state, toast]);

  // Clear password when switching tabs or user types
  useEffect(() => {
    setSignupPassword("");
  }, [activeTab, userType]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const loginData: LoginData = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
      };
      
      await login(loginData);
    } catch (error) {} 
    finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const registerData: RegisterData = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        password_confirmation: formData.get('password_confirmation') as string,
        first_name: formData.get('first_name') as string,
        last_name: formData.get('last_name') as string,
        phone: formData.get('phone') as string,
        user_type: userType,
        ...(userType === 'agent' && {
          store_name: formData.get('store_name') as string,
          address: formData.get('address') as string,
          city: formData.get('city') as string,
          country: formData.get('country') as string,
          latitude: storeLocation.lat,
          longitude: storeLocation.lng,
          opening_hours: openingHours,
        }),
      };
      
      await register(registerData);
    } catch (error) {}
    finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: `Signed in with ${provider}`,
        description: "You've successfully signed in.",
      });
      navigate("/user/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <ArrowLeftRight className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            TransferHub
          </h1>
          <p className="text-xl text-gray-600 mb-2">Send money worldwide, instantly</p>
          <p className="text-gray-500">Join millions of users and businesses worldwide</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
            <div className="mb-8 text-center">
              <h3 className="text-3xl font-bold text-gray-900 mb-2">Welcome to TransferHub</h3>
              <p className="text-gray-600 text-lg">Sign in to your account or create a new one</p>
            </div>

            <Tabs defaultValue="signin" value={activeTab} onValueChange={(value) => setActiveTab(value as "signin" | "signup")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100">
                <TabsTrigger value="signin" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Mail className="w-4 h-4 mr-2" />
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <User className="w-4 h-4 mr-2" />
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {/* ---------------- SIGN IN FORM ---------------- */}
              <TabsContent value="signin">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-medium text-gray-700">Email Address</Label>
                    <Input id="login-email" name="email" type="email" className="h-11" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-medium text-gray-700">Password</Label>
                    <Input id="login-password" name="password" type="password" className="h-11" required />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input id="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                      <Label htmlFor="remember-me" className="text-sm text-gray-700">Remember me</Label>
                    </div>
                    <button type="button" onClick={() => navigate('/forgot-password')} className="text-sm text-blue-600 hover:text-blue-500">
                      Forgot password?
                    </button>
                  </div>

                  <Button type="submit" className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>

                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Don't have an account?
                      <span className="text-blue-600 hover:text-blue-500 cursor-pointer ml-1" onClick={() => setActiveTab("signup")}>
                        Create one here
                      </span>
                    </p>
                  </div>
                </form>
              </TabsContent>

              {/* ---------------- SIGN UP FORM ---------------- */}
              <TabsContent value="signup">
                <div className="space-y-6">

                  {/* Account Type */}
                  <div className="text-center mb-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Choose Your Account Type</h4>
                    <p className="text-gray-600">Select the option that best fits your needs</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Personal Account */}
                    <Card className={`border-2 cursor-pointer group ${userType === "personal" ? "border-blue-300 shadow-lg bg-blue-50" : "border-gray-200 hover:border-blue-300"}`} onClick={() => setUserType("personal")}>
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <User className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Personal Account</h3>
                        <p className="text-sm text-gray-600 mb-4">Send and receive money globally</p>
                        <div className="flex items-center justify-center gap-2">
                          <Badge variant="secondary" className="text-xs">Free</Badge>
                          <Badge variant="outline" className="text-xs">No fees</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Agent Account */}
                    <Card className={`border-2 cursor-pointer group ${userType === "agent" ? "border-green-300 shadow-lg bg-green-50" : "border-gray-200 hover:border-green-300"}`} onClick={() => setUserType("agent")}>
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Building2 className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Agent/Partner Store</h3>
                        <p className="text-sm text-gray-600 mb-4">Receive and send money on behalf of users</p>
                        <div className="flex items-center justify-center gap-2">
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Earn Commission</Badge>
                          <Badge variant="outline" className="text-xs">Business Account</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Registration form */}
                  <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">

                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${userType === "personal" ? "bg-blue-100" : "bg-green-100"}`}>
                        {userType === "personal" ? (
                          <User className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Building2 className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <h5 className="text-lg font-semibold text-gray-900">
                          {userType === "personal" ? "Create Personal Account" : "Become an Agent"}
                        </h5>
                        <p className="text-sm text-gray-600">
                          {userType === "personal" ? "Fill in your details to get started" : "Join our network and start earning commissions"}
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>First Name</Label>
                          <Input name="first_name" className="h-11" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Last Name</Label>
                          <Input name="last_name" className="h-11" required />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input name="email" type="email" className="h-11" required />
                      </div>

                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input name="phone" type="tel" className="h-11" required />
                      </div>

                      {/* Agent fields */}
                      {userType === "agent" && (
                        <>
                          <div className="space-y-4 p-4 bg-white rounded-lg border">
                            <h6 className="font-semibold text-gray-900 flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-green-600" />
                              Business Information
                            </h6>

                            <div className="space-y-2">
                              <Label>Business/Store Name</Label>
                              <Input name="store_name" className="h-11" required />
                            </div>

                            <div className="space-y-2">
                              <Label>Business Address</Label>
                              <Input name="address" className="h-11" required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>City</Label>
                                <Input name="city" className="h-11" required />
                              </div>
                              <div className="space-y-2">
                                <Label>Country</Label>
                                <Input name="country" className="h-11" required />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4 p-4 bg-white rounded-lg border">
                            <h6 className="font-semibold text-gray-900 flex items-center gap-2">
                              <Clock className="w-4 h-4 text-green-600" />
                              Store Opening Hours
                            </h6>
                            <OpeningHoursSelector value={openingHours} onChange={setOpeningHours} />
                          </div>

                          <div className="space-y-4 p-4 bg-white rounded-lg border">
                            <h6 className="font-semibold text-gray-900 flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-green-600" />
                              Store Location
                            </h6>
                            <LocationPicker
                              initialLat={storeLocation.lat}
                              initialLng={storeLocation.lng}
                              onLocationChange={(lat, lng) => setStoreLocation({ lat, lng })}
                            />
                          </div>
                        </>
                      )}

                      <div className="space-y-2">
                        <Label>Password</Label>
                        <Input
                          name="password"
                          type="password"
                          className="h-11"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          required
                        />
                        {signupPassword && (
                          <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
                            <PasswordStrengthIndicator password={signupPassword} />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Confirm Password</Label>
                        <Input name="password_confirmation" type="password" className="h-11" required />
                      </div>

                      <Button
                        type="submit"
                        className={`w-full h-12 font-semibold ${
                          userType === "personal"
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                            : "bg-gradient-to-r from-green-600 to-blue-600 text-white"
                        }`}
                        disabled={isLoading}
                      >
                        {isLoading ? "Creating account..." : userType === "personal" ? "Create Personal Account" : "Become an Agent"}
                      </Button>
                    </form>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Already have an account?
                      <span className="text-blue-600 hover:text-blue-500 cursor-pointer ml-1" onClick={() => setActiveTab("signin")}>
                        Sign in here
                      </span>
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* ---------- SOCIAL LOGIN SECTION (UPDATED) ---------- */}
            {userType === "personal" && (
              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-4 text-gray-500">Or continue with</span>
                  </div>
                </div>

                {/* ONE CENTERED GOOGLE BUTTON */}
                <div className="flex justify-center mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSocialLogin("Google")}
                    disabled={isLoading}
                    className="h-11 hover:bg-red-50 hover:border-red-200 flex items-center gap-2 px-6"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </Button>
                </div>
              </div>
            )}

            <p className="text-center text-sm text-gray-500 mt-8">
              By continuing, you agree to our <a className="text-blue-600 hover:underline">Terms of Service</a> and <a className="text-blue-600 hover:underline">Privacy Policy</a>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
