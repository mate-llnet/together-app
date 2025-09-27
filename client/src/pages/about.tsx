import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, Target, Lightbulb, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const values = [
  {
    icon: Heart,
    title: "Appreciation First",
    description: "We believe every small act of love deserves recognition. Our platform is built to celebrate the daily efforts that strengthen relationships."
  },
  {
    icon: Users,
    title: "Together We Thrive",
    description: "Relationships flourish when both partners feel seen and valued. We create tools that help couples build deeper connections."
  },
  {
    icon: Target,
    title: "Purposeful Growth",
    description: "Every feature is designed with intention - to help couples understand, appreciate, and grow together in meaningful ways."
  },
  {
    icon: Lightbulb,
    title: "Insightful Innovation",
    description: "We combine relationship psychology with modern technology to provide insights that truly make a difference in couples' lives."
  }
];

const stats = [
  { number: "10,000+", label: "Happy Couples" },
  { number: "500,000+", label: "Activities Tracked" },
  { number: "50,000+", label: "Appreciations Sent" },
  { number: "98%", label: "Satisfaction Rate" }
];

export default function About() {
  const { data: aboutPage } = useQuery({
    queryKey: ['/api/site/pages', 'about'],
    enabled: false // We'll enable this once we create the API endpoints
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10" />
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent" data-testid="about-hero-title">
              Our Mission
            </h1>
            
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed" data-testid="about-hero-description">
              To help couples build stronger, more appreciative relationships by celebrating the daily acts of love that often go unnoticed.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 lg:py-32" data-testid="section-story">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl lg:text-5xl font-bold mb-6" data-testid="story-title">
                  Why We Built AppreciateMate
                </h2>
                <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                  <p data-testid="story-paragraph-1">
                    Every relationship is built on countless small moments - making coffee in the morning, 
                    doing the dishes, listening after a hard day, or simply being present. Yet these daily 
                    acts of love often go unnoticed and unappreciated.
                  </p>
                  <p data-testid="story-paragraph-2">
                    We created AppreciateMate because we believe that recognition and gratitude are the 
                    foundation of lasting relationships. When couples actively acknowledge each other's 
                    contributions, they build deeper understanding, stronger bonds, and more joyful partnerships.
                  </p>
                  <p data-testid="story-paragraph-3">
                    Our platform combines relationship psychology with modern technology to help couples 
                    track, celebrate, and grow together. Every feature is designed to foster appreciation, 
                    understanding, and connection.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="w-full h-96 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center transform rotate-2 hover:rotate-1 transition-transform duration-300 shadow-lg">
                  <Heart className="h-32 w-32 text-white opacity-80" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10" data-testid="section-values">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6" data-testid="values-title">
              Our Values
            </h2>
            <p className="text-xl text-muted-foreground">
              The principles that guide everything we do
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm" data-testid={`value-card-${index}`}>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <value.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3" data-testid={`value-title-${index}`}>{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed" data-testid={`value-description-${index}`}>
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 lg:py-32" data-testid="section-stats">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6" data-testid="stats-title">
              Our Impact
            </h2>
            <p className="text-xl text-muted-foreground">
              The numbers tell our story of helping couples appreciate each other
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group" data-testid={`stat-${index}`}>
                <div className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300" data-testid={`stat-number-${index}`}>
                  {stat.number}
                </div>
                <div className="text-lg text-muted-foreground" data-testid={`stat-label-${index}`}>
                  {stat.label}
                </div>
              </div>
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
                Ready to Start Your Journey?
              </h2>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed" data-testid="cta-description">
                Join thousands of couples who have discovered the power of daily appreciation. 
                Start building stronger bonds today.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button asChild size="lg" variant="secondary" className="px-8 py-6 text-lg rounded-xl bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300" data-testid="button-get-started">
                  <Link href="/auth">
                    Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="px-8 py-6 text-lg rounded-xl border-2 border-white text-white hover:bg-white/10" data-testid="button-contact">
                  <Link href="/contact">
                    Contact Us
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}