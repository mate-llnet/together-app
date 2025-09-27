interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  change: string;
  emoji: string;
}

export default function StatCard({ title, value, icon, color, change, emoji }: StatCardProps) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case "primary":
        return "bg-primary/10 text-primary";
      case "secondary":
        return "bg-secondary/10 text-secondary";
      case "amber-500":
        return "bg-amber-500/10 text-amber-500";
      case "green-500":
        return "bg-green-500/10 text-green-500";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  const getChangeColor = () => {
    if (change.includes("+") || change.toLowerCase().includes("well") || change.toLowerCase().includes("keep")) {
      return "text-secondary";
    }
    return "text-muted-foreground";
  };

  return (
    <div className="bg-card rounded-xl p-6 border border-border hover-lift" data-testid={`stat-${title.toLowerCase().replace(' ', '-')}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClasses(color)}`}>
          <i className={`${icon} text-xl`}></i>
        </div>
        <span className="text-2xl">{emoji}</span>
      </div>
      <h3 className="text-2xl font-bold text-foreground mb-1" data-testid={`stat-value-${title.toLowerCase().replace(' ', '-')}`}>
        {value}
      </h3>
      <p className="text-muted-foreground text-sm" data-testid={`stat-title-${title.toLowerCase().replace(' ', '-')}`}>
        {title}
      </p>
      <div className="mt-3 flex items-center text-sm">
        <span className={`font-medium ${getChangeColor()}`} data-testid={`stat-change-${title.toLowerCase().replace(' ', '-')}`}>
          {change}
        </span>
      </div>
    </div>
  );
}
