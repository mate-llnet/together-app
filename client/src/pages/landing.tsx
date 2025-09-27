import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, TrendingUp, Award, ArrowRight, CheckCircle, Code } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getVersionInfo } from "@shared/version";

const features = [
  {
    icon: Heart,
    title: "Track Contributions",
    description: "Log and appreciate daily activities that make your relationship stronger"
  },
  {
    icon: Users,
    title: "Couple Insights",
    description: "Gain insights into your relationship patterns and celebrate achievements together"
  },
  {
    icon: TrendingUp,
    title: "Analytics & Growth",
    description: "Visualize your journey with detailed analytics and track your progress over time"
  },
  {
    icon: Award,
    title: "Achievements System",
    description: "Unlock achievements and milestones as you build a stronger partnership"
  }
];

const testimonials = [
  {
    name: "Sarah & Mike",
    text: "AppreciateMate helped us recognize all the little things we do for each other. Our relationship has never been stronger!",
    rating: 5
  },
  {
    name: "Emily & David",
    text: "The insights feature showed us patterns we never noticed. We're more balanced and happier than ever.",
    rating: 5
  },
  {
    name: "Lisa & John",
    text: "Finally, a way to celebrate our daily efforts. This app transformed how we appreciate each other.",
    rating: 5
  }
];

export default function Landing() {
  const { user } = useAuth();
  const versionInfo = getVersionInfo();

  const { data: siteSettings } = useQuery({
    queryKey: ['/api/site/settings'],
    enabled: false // We'll enable this once we create the API endpoints
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Version Badge */}
      <div className="fixed top-4 right-4 z-50">
        <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <Code className="h-3 w-3" />
          <span data-testid="version-display">{versionInfo.displayVersion}</span>
        </div>
      </div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10" />
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8 transform rotate-3 hover:rotate-6 transition-transform duration-300 shadow-lg">
              <Heart className="h-10 w-10 text-white" />
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent" data-testid="hero-title">
              Appreciate Life
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Together</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed" data-testid="hero-description">
              A relationship appreciation app that helps couples track and celebrate each other's daily contributions, building stronger bonds through recognition and gratitude.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" data-testid="button-dashboard">
                  <Link href="/app">
                    Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" data-testid="button-get-started">
                    <Link href="/auth">
                      Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="px-8 py-6 text-lg rounded-xl border-2 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300" data-testid="button-learn-more">
                    <Link href="/about">
                      Learn More
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32" data-testid="section-features">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6" data-testid="features-title">
              Why Couples Love AppreciateMate
            </h2>
            <p className="text-xl text-muted-foreground">
              Discover the features that make relationships stronger and more fulfilling
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-card/50 backdrop-blur-sm" data-testid={`feature-card-${index}`}>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3" data-testid={`feature-title-${index}`}>{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed" data-testid={`feature-description-${index}`}>
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10" data-testid="section-testimonials">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6" data-testid="testimonials-title">
              Real Couples, Real Results
            </h2>
            <p className="text-xl text-muted-foreground">
              See how AppreciateMate has transformed relationships around the world
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm" data-testid={`testimonial-card-${index}`}>
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Heart key={i} className="h-5 w-5 text-red-500 fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 leading-relaxed italic" data-testid={`testimonial-text-${index}`}>
                    "{testimonial.text}"
                  </p>
                  <p className="font-semibold" data-testid={`testimonial-name-${index}`}>
                    {testimonial.name}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32" data-testid="section-cta">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-12 lg:p-16 text-white shadow-2xl">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6" data-testid="cta-title">
                Start Appreciating Each Other Today
              </h2>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed" data-testid="cta-description">
                Join thousands of couples who have discovered the power of daily appreciation. Build stronger bonds, celebrate achievements, and grow together.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <Button asChild size="lg" variant="secondary" className="px-8 py-6 text-lg rounded-xl bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300" data-testid="button-cta-signup">
                  <Link href="/auth">
                    Sign Up Free <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="px-8 py-6 text-lg rounded-xl border-2 border-white text-white hover:bg-white/10 transition-all duration-300" data-testid="button-cta-contact">
                  <Link href="/contact">
                    Contact Us
                  </Link>
                </Button>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-8 justify-center items-center text-sm opacity-80">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Free to start</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}