import { Card, CardContent, CardHeader, CardTitle } from "@apolo/ui";

const stats = [
  { label: "Productos", value: "0", icon: "📦" },
  { label: "Ventas hoy", value: "$ 0", icon: "💰" },
  { label: "Stock bajo", value: "0", icon: "⚠️" },
  { label: "Proveedores", value: "0", icon: "🤝" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen general de tu empresa
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <span className="text-lg">{stat.icon}</span>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
