import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ArrowRight, Layout, Layers } from "lucide-react";

export default function ExampleUIPage() {
  const examples = [
    {
      title: "Immersive Navigation",
      description: "沉浸式导航，带返回按钮和上下文操作。",
      href: "/example-ui/immersive-nav",
      icon: Layout,
    },
    {
      title: "Complex Tabs",
      description: "顶部选项卡，用于切换复杂信息视图。",
      href: "/example-ui/complex-tabs",
      icon: Layers,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <h1 className="text-2xl font-bold mb-6">UI Examples</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {examples.map((example) => (
          <Link key={example.href} href={example.href}>
            <Card className="p-6 hover:shadow-md transition-all cursor-pointer border-border/50 group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <example.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold group-hover:text-primary transition-colors">{example.title}</h2>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-sm text-muted-foreground">{example.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
