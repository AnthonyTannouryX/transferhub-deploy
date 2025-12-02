import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeftRight,
  Shield,
  Zap,
  DollarSign,
  Clock,
  CheckCircle,
  Users,
  Target,
  Send,
  Eye,
  ArrowRight,
  Mail,
  MapPin
} from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: Shield,
      title: "Secure Transfers",
      description: "Bank-level security to protect your transactions",
    },
    {
      icon: Zap,
      title: "Fast Processing",
      description: "Express and standard transfer options available",
    },
    {
      icon: DollarSign,
      title: "Transparent Fees",
      description: "Clear pricing with no hidden charges",
    },
    {
      icon: Clock,
      title: "Track Transfers",
      description: "Monitor your transfer status in real-time",
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Sign Up",
      description: "Create your account with your email",
      icon: Users
    },
    {
      step: "2",
      title: "Add Recipient",
      description: "Enter recipient details",
      icon: Target
    },
    {
      step: "3",
      title: "Send Money",
      description: "Choose amount and speed tier",
      icon: Send
    },
    {
      step: "4",
      title: "Track Transfer",
      description: "Monitor your transfer in real-time",
      icon: Eye
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg gradient-hero flex items-center justify-center shadow-elegant">
                <ArrowLeftRight className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">TransferHub</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">How It Works</a>
              <a href="#plans" className="text-sm font-medium hover:text-primary transition-colors">Plans</a>
              <a href="#contact" className="text-sm font-medium hover:text-primary transition-colors">Contact</a>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/auth">
                <Button className="gradient-hero text-white border-0">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5"></div>
        <div className="container mx-auto px-4 py-24 text-center relative">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                Send Money
              </span>
              <br />
              <span className="text-foreground">Securely & Quickly</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Transfer money with low fees and secure processing.
              Track your transfers in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link to="/auth">
                <Button size="lg" className="text-lg px-8 py-6 gradient-hero text-white border-0 shadow-elegant hover:shadow-xl transition-all hover:scale-105">
                  Start Transferring Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-2 text-sm">
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="font-medium">Secure Platform</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm">
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="font-medium">Fast Transfers</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm">
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="font-medium">Real-time Tracking</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Why Choose TransferHub?</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Simple, secure, and reliable money transfers
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="group shadow-card border-none hover:shadow-elegant transition-all duration-300 hover:-translate-y-1"
                >
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Send money in just 4 simple steps
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {howItWorks.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card key={index} className="text-center shadow-card border-none hover:shadow-elegant transition-all">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                      {step.step}
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Subscription Plans */}
      <section id="plans" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto mb-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center">
              Subscription Plans
            </h2>
            <p className="text-center text-muted-foreground mb-6">
              Choose the plan that best fits your transfer needs.
            </p>
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2 text-xs sm:text-sm bg-card border border-border rounded-full px-4 py-2 shadow-sm">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>You are currently on the&nbsp;</span>
                <span className="font-semibold">Business</span>
                <span>&nbsp;plan.</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 max-w-6xl mx-auto">
            {/* Personal */}
            <Card className="shadow-card border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Personal</CardTitle>
                <p className="text-3xl font-bold mt-2">
                  Free<span className="text-base font-normal text-muted-foreground">/month</span>
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Limit</span>
                    <span className="font-semibold">$5000.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transfer Fee</span>
                    <span className="font-semibold">$4.99</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Express Speed Fee</span>
                    <span className="font-semibold">$9.99</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Select Plan
                </Button>
              </CardContent>
            </Card>

            {/* Business - Current Plan */}
            <Card className="relative shadow-elegant border-primary/40 ring-2 ring-primary/40">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="px-3 py-1 text-xs rounded-full bg-primary text-primary-foreground shadow">
                  Current Plan
                </Badge>
              </div>
              <CardHeader className="pb-4 pt-6">
                <CardTitle className="text-lg">Business</CardTitle>
                <p className="text-3xl font-bold mt-2">
                  $29<span className="text-base font-normal text-muted-foreground">/month</span>
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Limit</span>
                    <span className="font-semibold">$50000.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transfer Fee</span>
                    <span className="font-semibold">$2.99</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Express Speed Fee</span>
                    <span className="font-semibold">$4.99</span>
                  </div>
                </div>
                <Button disabled className="w-full mt-4">
                  Current Plan
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise */}
            <Card className="shadow-card border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Enterprise</CardTitle>
                <p className="text-3xl font-bold mt-2">
                  $100<span className="text-base font-normal text-muted-foreground">/month</span>
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Limit</span>
                    <span className="font-semibold">Unlimited</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transfer Fee</span>
                    <span className="font-semibold">$0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Express Speed Fee</span>
                    <span className="font-semibold">$0.00</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Select Plan
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground mb-12">
              Create your account and start sending money today.
            </p>
            <Link to="/auth">
              <Button size="lg" className="text-lg px-12 py-6 gradient-hero text-white border-0 shadow-elegant">
                Create Free Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-16">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg gradient-hero flex items-center justify-center">
                  <ArrowLeftRight className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl">TransferHub</span>
              </div>
              <p className="text-muted-foreground">
                Secure and reliable money transfer platform.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Quick Links</h3>
              <div className="space-y-2">
                <a href="#features" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
                <a href="#how-it-works" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
                <a href="#plans" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Plans</a>
                <Link to="/auth" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Contact</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>support@transferhub.com</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>Online Platform</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border mt-12 pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 TransferHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
